"use server";

import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

import { auth } from "@clerk/nextjs/server";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { projects, videos } from "@/db/schema";
import {
  getArcjetErrorMessage,
  protectAnalysisActionRequest,
  protectUploadActionRequest,
} from "@/lib/arcjet";
import { deriveProjectTitle, sanitizeFileName } from "@/lib/project-upload";
import { inngest } from "@/lib/inngest";

const createUploadProjectSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive().max(20 * 1024 * 1024 * 1024),
  contentType: z.string().trim().min(1).max(255).startsWith("video/"),
});

const failUploadSchema = z.object({
  projectId: z.string().uuid(),
  error: z.string().trim().min(1).max(255),
});

const startAnalysisSchema = z.object({
  projectId: z.string().uuid(),
});

async function stageUploadFile(file: File) {
  const stagedDirectory = path.join(os.tmpdir(), "vidshorts-upload-staging");
  const stagedFilePath = path.join(
    stagedDirectory,
    `${randomUUID()}-${sanitizeFileName(file.name) || "source-video"}`
  );

  await mkdir(stagedDirectory, { recursive: true });
  await pipeline(
    Readable.fromWeb(file.stream() as WebReadableStream),
    createWriteStream(stagedFilePath)
  );

  return stagedFilePath;
}

function getUtcDayRange(now = new Date()) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

async function getDailyUploadCount(clerkUserId: string) {
  const { start, end } = getUtcDayRange();

  const [result] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(projects)
    .where(
      and(
        eq(projects.clerkUserId, clerkUserId),
        gte(projects.createdAt, start),
        lt(projects.createdAt, end)
      )
    );

  return result?.count ?? 0;
}

export async function createUploadProjectAction(formData: FormData) {
  let createdProjectId: string | null = null;

  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return { success: false, error: "Select a video file first." };
    }

    const values = createUploadProjectSchema.parse({
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || "video/mp4",
    });

    const decision = await protectUploadActionRequest(userId);

    if (decision.isDenied()) {
      return {
        success: false,
        error: getArcjetErrorMessage(
          decision,
          "Upload request blocked by security policy."
        ),
      };
    }

    const dailyUploadCount = await getDailyUploadCount(userId);

    if (dailyUploadCount >= 20) {
      return {
        success: false,
        error:
          "Daily upload limit reached. You can upload up to 2 videos per UTC day and the limit resets tomorrow.",
      };
    }

    const stagedFilePath = await stageUploadFile(file);

    const [project] = await db
      .insert(projects)
      .values({
        clerkUserId: userId,
        title: deriveProjectTitle(values.fileName),
        sourceFileName: values.fileName,
        sourceContentType: values.contentType,
        sourceFileSize: values.fileSize,
        status: "creating",
        uploadProgress: 5,
        statusMessage: "Staging source video for background upload",
      })
      .returning({
        id: projects.id,
      });

    createdProjectId = project.id;

    const [video] = await db
      .insert(videos)
      .values({
        projectId: project.id,
        clerkUserId: userId,
        fileName: values.fileName,
        fileSize: values.fileSize,
        contentType: values.contentType,
        status: "uploading",
      })
      .returning({
        id: videos.id,
      });

    await inngest.send({
      name: "video/upload.requested",
      data: {
        projectId: project.id,
        videoId: video.id,
        clerkUserId: userId,
        fileName: values.fileName,
        fileSize: values.fileSize,
        contentType: values.contentType,
        stagedFilePath,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      projectId: project.id,
      videoId: video.id,
    };
  } catch (error) {
    console.error("Failed to create upload project", error);

    if (createdProjectId) {
      await db
        .update(projects)
        .set({
          status: "failed",
          statusMessage: "Unable to dispatch the upload workflow",
          updatedAt: new Date(),
        })
        .where(eq(projects.id, createdProjectId));

      await db
        .update(videos)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(videos.projectId, createdProjectId));
    }

    return { success: false, error: "Unable to prepare the upload project." };
  }
}

export async function failVideoUploadAction(input: unknown) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const values = failUploadSchema.parse(input);

    await db
      .update(projects)
      .set({
        status: "failed",
        statusMessage: values.error,
        updatedAt: new Date(),
      })
      .where(
        and(eq(projects.id, values.projectId), eq(projects.clerkUserId, userId))
      );

    await db
      .update(videos)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(
        and(eq(videos.projectId, values.projectId), eq(videos.clerkUserId, userId))
      );

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to mark upload as failed", error);
    return { success: false, error: "Unable to update upload failure state." };
  }
}

export async function startVideoAnalysisAction(input: unknown) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const values = startAnalysisSchema.parse(input);
    const decision = await protectAnalysisActionRequest(userId);

    if (decision.isDenied()) {
      return {
        success: false,
        error: getArcjetErrorMessage(
          decision,
          "AI analysis request blocked by security policy."
        ),
      };
    }

    const [project] = await db
      .select({
        projectId: projects.id,
        status: projects.status,
        uploadProgress: projects.uploadProgress,
        videoId: videos.id,
        s3Bucket: videos.s3Bucket,
        s3Key: videos.s3Key,
      })
      .from(projects)
      .leftJoin(videos, eq(videos.projectId, projects.id))
      .where(
        and(eq(projects.id, values.projectId), eq(projects.clerkUserId, userId))
      )
      .limit(1);

    if (!project?.videoId) {
      return { success: false, error: "Project not found." };
    }

    if (!project.s3Bucket || !project.s3Key) {
      return {
        success: false,
        error: "Finish the source upload before running AI analysis.",
      };
    }

    if (project.status === "processing") {
      return { success: true, projectId: project.projectId, alreadyStarted: true };
    }

    await inngest.send({
      name: "video/analysis.requested",
      data: {
        projectId: project.projectId,
        videoId: project.videoId,
        clerkUserId: userId,
      },
    });

    await db
      .update(projects)
      .set({
        status: "processing",
        uploadProgress: Math.max(project.uploadProgress, 55),
        statusMessage: "Queued AI analysis with Inngest",
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.projectId));

    await db
      .update(videos)
      .set({
        status: "processing",
        updatedAt: new Date(),
      })
      .where(eq(videos.id, project.videoId));

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/projects/${project.projectId}`);

    return { success: true, projectId: project.projectId };
  } catch (error) {
    console.error("Failed to start video analysis", error);
    return { success: false, error: "Unable to start AI analysis." };
  }
}
