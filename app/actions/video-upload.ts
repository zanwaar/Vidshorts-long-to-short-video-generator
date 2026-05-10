"use server";

import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { projects, videos } from "@/db/schema";
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

async function stageUploadFile(file: File) {
  const stagedDirectory = path.join(os.tmpdir(), "vidshorts-upload-staging");
  const stagedFilePath = path.join(
    stagedDirectory,
    `${randomUUID()}-${sanitizeFileName(file.name) || "source-video"}`
  );

  await mkdir(stagedDirectory, { recursive: true });
  await pipeline(
    Readable.fromWeb(file.stream() as globalThis.ReadableStream),
    createWriteStream(stagedFilePath)
  );

  return stagedFilePath;
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
