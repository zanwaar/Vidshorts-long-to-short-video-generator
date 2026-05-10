import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { projects, videos } from "@/db/schema";
import { uploadVideoToS3 } from "@/lib/aws";
import { inngest } from "@/lib/inngest";

const uploadRequestedEventSchema = z.object({
  projectId: z.string().uuid(),
  videoId: z.string().uuid(),
  clerkUserId: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  fileSize: z.number().int().positive(),
  contentType: z.string().trim().min(1).startsWith("video/"),
  stagedFilePath: z.string().trim().min(1),
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
            uploadProgress: 100,
            statusMessage: "Source video uploaded to S3",
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
            status: "processing",
            updatedAt: new Date(),
          })
          .where(
            and(eq(videos.id, payload.videoId), eq(videos.clerkUserId, payload.clerkUserId))
          );
      });

      await step.run("cleanup-staged-file", async () => {
        await deleteStagedFile(payload.stagedFilePath);
      });

      await step.run("dispatch-uploaded-event", async () => {
        await inngest.send({
          name: "video/uploaded",
          data: {
            projectId: payload.projectId,
            videoId: payload.videoId,
            s3Bucket: uploadResult.bucket,
            s3Key: uploadResult.objectKey,
          },
        });
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

export const inngestFunctions = [prepareVideoUpload];
