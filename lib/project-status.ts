import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects, shortVideos, transcripts, videos } from "@/db/schema";
import type { ProjectStatus } from "@/lib/project-upload";

type CaptionCue = {
  index: number;
  start: number;
  end: number;
  text: string;
  speaker: number | null;
};

export type ProjectStatusSnapshot = {
  projectId: string;
  videoId: string | null;
  title: string;
  sourceFileName: string;
  status: ProjectStatus;
  uploadProgress: number;
  statusMessage: string | null;
  uploadUrl: string | null;
  uploadFields: Record<string, string> | null;
  signedViewUrl: string | null;
  s3Url: string | null;
  s3Key: string | null;
  transcriptText: string | null;
  transcriptLanguage: string | null;
  captionCount: number;
  captionPreview: CaptionCue[];
  shortVideoCount: number;
  shortVideoPreview: Array<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    seoScore: number;
    reason: string;
    transcriptExcerpt: string;
  }>;
};

function normalizeUploadFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string"
  );

  return Object.fromEntries(entries);
}

function normalizeCaptionPreview(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [] satisfies CaptionCue[];
  }

  const captions = (value as { captions?: { cues?: unknown } }).captions;

  if (!Array.isArray(captions?.cues)) {
    return [] satisfies CaptionCue[];
  }

  return captions.cues
    .map((cue, index) => {
      if (!cue || typeof cue !== "object" || Array.isArray(cue)) {
        return null;
      }

      const candidate = cue as Partial<CaptionCue>;

      if (
        typeof candidate.start !== "number" ||
        typeof candidate.end !== "number" ||
        typeof candidate.text !== "string"
      ) {
        return null;
      }

      return {
        index:
          typeof candidate.index === "number"
            ? candidate.index
            : index + 1,
        start: candidate.start,
        end: candidate.end,
        text: candidate.text,
        speaker:
          typeof candidate.speaker === "number" ? candidate.speaker : null,
      } satisfies CaptionCue;
    })
    .filter((cue): cue is CaptionCue => cue !== null);
}

function getCaptionCount(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return 0;
  }

  const captions = (value as { captions?: { cues?: unknown } }).captions;

  return Array.isArray(captions?.cues) ? captions.cues.length : 0;
}

export async function getProjectStatusSnapshot(input: {
  clerkUserId: string;
  projectId: string;
}) {
  const [projectRow] = await db
    .select({
      projectId: projects.id,
      title: projects.title,
      sourceFileName: projects.sourceFileName,
      status: projects.status,
      uploadProgress: projects.uploadProgress,
      statusMessage: projects.statusMessage,
      uploadUrl: projects.uploadUrl,
      uploadFields: projects.uploadFields,
      signedViewUrl: projects.signedViewUrl,
      s3Key: projects.s3Key,
      videoId: videos.id,
      s3Url: videos.s3Url,
    })
    .from(projects)
    .leftJoin(videos, eq(videos.projectId, projects.id))
    .where(
      and(eq(projects.id, input.projectId), eq(projects.clerkUserId, input.clerkUserId))
    )
    .limit(1);

  if (!projectRow) {
    return null;
  }

  const [transcriptRow] = projectRow.videoId
    ? await db
        .select({
          fullText: transcripts.fullText,
          language: transcripts.language,
          rawJson: transcripts.rawJson,
        })
        .from(transcripts)
        .where(eq(transcripts.videoId, projectRow.videoId))
        .orderBy(desc(transcripts.createdAt))
        .limit(1)
    : [];

  const captionPreview = normalizeCaptionPreview(transcriptRow?.rawJson).slice(0, 6);
  const captionCount = getCaptionCount(transcriptRow?.rawJson);
  const shortVideoRows = projectRow.videoId
    ? await db
        .select({
          id: shortVideos.id,
          title: shortVideos.title,
          startTime: shortVideos.startTime,
          endTime: shortVideos.endTime,
          seoScore: shortVideos.seoScore,
          reason: shortVideos.reason,
          transcriptExcerpt: shortVideos.transcriptExcerpt,
        })
        .from(shortVideos)
        .where(eq(shortVideos.videoId, projectRow.videoId))
        .orderBy(asc(shortVideos.clipIndex))
        .limit(5)
    : [];

  return {
    projectId: projectRow.projectId,
    videoId: projectRow.videoId,
    title: projectRow.title,
    sourceFileName: projectRow.sourceFileName,
    status: projectRow.status,
    uploadProgress: projectRow.uploadProgress,
    statusMessage: projectRow.statusMessage,
    uploadUrl: projectRow.uploadUrl,
    uploadFields: normalizeUploadFields(projectRow.uploadFields),
    signedViewUrl: projectRow.signedViewUrl,
    s3Url: projectRow.s3Url,
    s3Key: projectRow.s3Key,
    transcriptText: transcriptRow?.fullText ?? null,
    transcriptLanguage: transcriptRow?.language ?? null,
    captionCount,
    captionPreview,
    shortVideoCount: shortVideoRows.length,
    shortVideoPreview: shortVideoRows.map((row) => ({
      id: row.id,
      title: row.title,
      startTime: row.startTime,
      endTime: row.endTime,
      seoScore: row.seoScore,
      reason: row.reason,
      transcriptExcerpt: row.transcriptExcerpt,
    })),
  } satisfies ProjectStatusSnapshot;
}
