import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { projects, shortVideoCaptions, shortVideos, transcripts, videos } from "@/db/schema";
import { getVideoObjectStream, uploadVideoToS3 } from "@/lib/aws";
import { type CaptionCue, transcribeVideoFromStream } from "@/lib/deepgram";
import { inngest } from "@/lib/inngest";
import { selectShortVideoMoments } from "@/lib/short-video-selection";

const uploadRequestedEventSchema = z.object({
  projectId: z.string().uuid(),
  videoId: z.string().uuid(),
  clerkUserId: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  fileSize: z.number().int().positive(),
  contentType: z.string().trim().min(1).startsWith("video/"),
  stagedFilePath: z.string().trim().min(1),
});

const analysisRequestedEventSchema = z.object({
  projectId: z.string().uuid(),
  videoId: z.string().uuid(),
  clerkUserId: z.string().trim().min(1),
});

async function deleteStagedFile(stagedFilePath: string) {
  try {
    await unlink(stagedFilePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function upsertTranscriptRecord(input: {
  videoId: string;
  fullText: string;
  language: string | null;
  rawJson: Record<string, unknown>;
}) {
  const [existingTranscript] = await db
    .select({
      id: transcripts.id,
    })
    .from(transcripts)
    .where(eq(transcripts.videoId, input.videoId))
    .orderBy(desc(transcripts.createdAt))
    .limit(1);

  if (existingTranscript) {
    await db
      .update(transcripts)
      .set({
        rawJson: input.rawJson,
        fullText: input.fullText,
        language: input.language,
      })
      .where(eq(transcripts.id, existingTranscript.id));

    return existingTranscript.id;
  }

  const [createdTranscript] = await db
    .insert(transcripts)
    .values({
      videoId: input.videoId,
      rawJson: input.rawJson,
      fullText: input.fullText,
      language: input.language,
    })
    .returning({
      id: transcripts.id,
    });

  return createdTranscript.id;
}

function getCaptionCuesForWindow(
  captionCues: CaptionCue[],
  startTime: number,
  endTime: number
) {
  return captionCues.filter((cue) => cue.end > startTime && cue.start < endTime);
}

function buildTranscriptExcerpt(captionCues: CaptionCue[]) {
  return captionCues
    .map((cue) => cue.text.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function replaceShortVideoRecords(input: {
  projectId: string;
  videoId: string;
  provider: string;
  model: string;
  clips: Array<{
    title: string;
    startTime: number;
    endTime: number;
    reason: string;
    seoScore: number;
  }>;
  captionCues: CaptionCue[];
}) {
  await db.transaction(async (tx) => {
    await tx.delete(shortVideos).where(eq(shortVideos.videoId, input.videoId));

    for (const [index, clip] of input.clips.entries()) {
      const clipCaptionCues = getCaptionCuesForWindow(
        input.captionCues,
        clip.startTime,
        clip.endTime
      );

      const transcriptExcerpt = buildTranscriptExcerpt(clipCaptionCues);

      const [createdShortVideo] = await tx
        .insert(shortVideos)
        .values({
          projectId: input.projectId,
          videoId: input.videoId,
          clipIndex: index + 1,
          title: clip.title,
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: Number((clip.endTime - clip.startTime).toFixed(2)),
          reason: clip.reason,
          seoScore: clip.seoScore,
          transcriptExcerpt,
          provider: input.provider,
          model: input.model,
          rawJson: {
            title: clip.title,
            startTime: clip.startTime,
            endTime: clip.endTime,
            reason: clip.reason,
            seoScore: clip.seoScore,
          },
        })
        .returning({
          id: shortVideos.id,
        });

      if (clipCaptionCues.length === 0) {
        continue;
      }

      await tx.insert(shortVideoCaptions).values(
        clipCaptionCues.map((cue, cueIndex) => ({
          shortVideoId: createdShortVideo.id,
          cueIndex: cueIndex + 1,
          startTime: cue.start,
          endTime: cue.end,
          text: cue.text,
          speaker: cue.speaker,
        }))
      );
    }
  });
}

export const prepareVideoUpload = inngest.createFunction(
  {
    id: "prepare-video-upload",
    triggers: [{ event: "video/upload.requested" }],
  },
  async ({ event, step }) => {
    const payload = uploadRequestedEventSchema.parse(event.data);

    try {
      await step.run("mark-preparing-upload", async () => {
        await db
          .update(projects)
          .set({
            status: "preparing_upload",
            uploadProgress: 10,
            statusMessage: "Preparing background S3 upload",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projects.id, payload.projectId),
              eq(projects.clerkUserId, payload.clerkUserId)
            )
          );
      });

      const uploadResult = await step.run("upload-video-to-s3", async () => {
        await db
          .update(projects)
          .set({
            status: "uploading",
            uploadProgress: 35,
            statusMessage: "Uploading source video to AWS S3",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projects.id, payload.projectId),
              eq(projects.clerkUserId, payload.clerkUserId)
            )
          );

        await db
          .update(videos)
          .set({
            status: "uploading",
            updatedAt: new Date(),
          })
          .where(
            and(eq(videos.id, payload.videoId), eq(videos.clerkUserId, payload.clerkUserId))
          );

        const fileStream = createReadStream(payload.stagedFilePath);

        return uploadVideoToS3({
          clerkUserId: payload.clerkUserId,
          projectId: payload.projectId,
          fileName: payload.fileName,
          fileSize: payload.fileSize,
          contentType: payload.contentType,
          body: fileStream,
        });
      });

      await step.run("persist-upload-result", async () => {
        await db
          .update(projects)
          .set({
            status: "uploaded",
            uploadProgress: 52,
            statusMessage: "Source video uploaded. Ready for AI analysis",
            s3Bucket: uploadResult.bucket,
            s3Key: uploadResult.objectKey,
            uploadUrl: null,
            uploadFields: null,
            signedViewUrl: uploadResult.signedViewUrl,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projects.id, payload.projectId),
              eq(projects.clerkUserId, payload.clerkUserId)
            )
          );

        await db
          .update(videos)
          .set({
            s3Bucket: uploadResult.bucket,
            s3Key: uploadResult.objectKey,
            s3Url: uploadResult.s3Url,
            signedViewUrl: uploadResult.signedViewUrl,
            status: "completed",
            updatedAt: new Date(),
          })
          .where(
            and(eq(videos.id, payload.videoId), eq(videos.clerkUserId, payload.clerkUserId))
          );
      });

      await step.run("cleanup-staged-file", async () => {
        await deleteStagedFile(payload.stagedFilePath);
      });

      return {
        projectId: payload.projectId,
        videoId: payload.videoId,
        s3Url: uploadResult.s3Url,
        signedViewUrl: uploadResult.signedViewUrl,
      };
    } catch (error) {
      await deleteStagedFile(payload.stagedFilePath).catch((cleanupError) => {
        console.error("Failed to clean up staged upload", cleanupError);
      });

      await db
        .update(projects)
        .set({
          status: "failed",
          statusMessage: "Unable to upload the source video to S3",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.id, payload.projectId),
            eq(projects.clerkUserId, payload.clerkUserId)
          )
        );

      await db
        .update(videos)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(
          and(eq(videos.id, payload.videoId), eq(videos.clerkUserId, payload.clerkUserId))
        );

      throw error;
    }
  }
);

export const runVideoAnalysis = inngest.createFunction(
  {
    id: "run-video-analysis",
    triggers: [{ event: "video/analysis.requested" }],
  },
  async ({ event, step }) => {
    const payload = analysisRequestedEventSchema.parse(event.data);

    try {
      await step.run("mark-analysis-started", async () => {
        await db
          .update(projects)
          .set({
            status: "processing",
            uploadProgress: 60,
            statusMessage: "Preparing Deepgram transcription",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projects.id, payload.projectId),
              eq(projects.clerkUserId, payload.clerkUserId)
            )
          );

        await db
          .update(videos)
          .set({
            status: "processing",
            updatedAt: new Date(),
          })
          .where(
            and(eq(videos.id, payload.videoId), eq(videos.clerkUserId, payload.clerkUserId))
          );
      });

      const analysisResult = await step.run(
        "transcribe-video-and-generate-captions",
        async () => {
          const [video] = await db
            .select({
              id: videos.id,
              s3Bucket: videos.s3Bucket,
              s3Key: videos.s3Key,
              contentType: videos.contentType,
            })
            .from(videos)
            .where(
              and(eq(videos.id, payload.videoId), eq(videos.clerkUserId, payload.clerkUserId))
            )
            .limit(1);

          if (!video?.s3Bucket || !video.s3Key) {
            throw new Error("Uploaded source video is missing its S3 location.");
          }

          await db
            .update(projects)
            .set({
              status: "processing",
              uploadProgress: 72,
              statusMessage: "Transcribing full video with Deepgram",
              updatedAt: new Date(),
            })
            .where(eq(projects.id, payload.projectId));

          const videoObject = await getVideoObjectStream({
            bucket: video.s3Bucket,
            objectKey: video.s3Key,
          });

          const transcriptResult = await transcribeVideoFromStream({
            body: videoObject.body,
            contentType: video.contentType ?? videoObject.contentType,
          });

          await db
            .update(projects)
            .set({
              status: "processing",
              uploadProgress: 88,
              statusMessage: "Saving transcript and generated captions",
              updatedAt: new Date(),
            })
            .where(eq(projects.id, payload.projectId));

          await upsertTranscriptRecord({
            videoId: payload.videoId,
            fullText: transcriptResult.fullText,
            language: transcriptResult.language,
            rawJson: {
              deepgram: transcriptResult.rawResponse as unknown as Record<string, unknown>,
              captions: {
                cues: transcriptResult.captions.cues,
                srt: transcriptResult.captions.srt,
                vtt: transcriptResult.captions.vtt,
              },
            },
          });

          await db
            .update(videos)
            .set({
              duration:
                typeof transcriptResult.duration === "number"
                  ? Math.round(transcriptResult.duration)
                  : null,
              updatedAt: new Date(),
            })
            .where(eq(videos.id, payload.videoId));

          await db
            .update(projects)
            .set({
              status: "processing",
              uploadProgress: 92,
              statusMessage: "Selecting the best short-form moments with AI",
              updatedAt: new Date(),
            })
            .where(eq(projects.id, payload.projectId));

          const shortVideoSelectionResult = await selectShortVideoMoments({
            clerkUserId: payload.clerkUserId,
            transcriptText: transcriptResult.fullText,
            transcriptLanguage: transcriptResult.language,
            duration: transcriptResult.duration,
            captionCues: transcriptResult.captions.cues,
          });

          await db
            .update(projects)
            .set({
              status: "processing",
              uploadProgress: 96,
              statusMessage: "Saving AI-selected short video candidates",
              updatedAt: new Date(),
            })
            .where(eq(projects.id, payload.projectId));

          await replaceShortVideoRecords({
            projectId: payload.projectId,
            videoId: payload.videoId,
            provider: shortVideoSelectionResult.provider,
            model: shortVideoSelectionResult.model,
            clips: shortVideoSelectionResult.clips,
            captionCues: transcriptResult.captions.cues,
          });

          return {
            transcriptText: transcriptResult.fullText,
            transcriptLanguage: transcriptResult.language,
            captionCount: transcriptResult.captions.cues.length,
            captionsVtt: transcriptResult.captions.vtt,
            shortVideoCount: shortVideoSelectionResult.clips.length,
          };
        }
      );

      await step.run("mark-analysis-complete", async () => {
        await db
          .update(projects)
          .set({
            status: "completed",
            uploadProgress: 100,
            statusMessage: "Transcript, captions, and short suggestions are ready",
            updatedAt: new Date(),
          })
          .where(eq(projects.id, payload.projectId));

        await db
          .update(videos)
          .set({
            status: "completed",
            updatedAt: new Date(),
          })
          .where(eq(videos.id, payload.videoId));
      });

      return {
        projectId: payload.projectId,
        videoId: payload.videoId,
        transcriptPreview: analysisResult.transcriptText.slice(0, 1_200),
        transcriptLanguage: analysisResult.transcriptLanguage,
        captionCount: analysisResult.captionCount,
        captionsVtt: analysisResult.captionsVtt,
        shortVideoCount: analysisResult.shortVideoCount,
      };
    } catch (error) {
      await db
        .update(projects)
        .set({
          status: "failed",
          statusMessage: "AI transcription or short-video selection failed",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.id, payload.projectId),
            eq(projects.clerkUserId, payload.clerkUserId)
          )
        );

      await db
        .update(videos)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(
          and(eq(videos.id, payload.videoId), eq(videos.clerkUserId, payload.clerkUserId))
        );

      throw error;
    }
  }
);

export const inngestFunctions = [prepareVideoUpload, runVideoAnalysis];
