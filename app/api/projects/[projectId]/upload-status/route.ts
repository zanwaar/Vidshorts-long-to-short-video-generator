import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { projects, videos } from "@/db/schema";

const routeParamsSchema = z.object({
  projectId: z.string().uuid(),
});

function normalizeUploadFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string"
  );

  return Object.fromEntries(entries);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = routeParamsSchema.parse(await context.params);

  const [row] = await db
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
      s3Url: videos.s3Url,
      s3Key: projects.s3Key,
      videoId: videos.id,
    })
    .from(projects)
    .leftJoin(videos, eq(videos.projectId, projects.id))
    .where(and(eq(projects.id, projectId), eq(projects.clerkUserId, userId)))
    .limit(1);

  if (!row) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json(
    {
      projectId: row.projectId,
      videoId: row.videoId,
      title: row.title,
      sourceFileName: row.sourceFileName,
      status: row.status,
      uploadProgress: row.uploadProgress,
      statusMessage: row.statusMessage,
      uploadUrl: row.uploadUrl,
      uploadFields: normalizeUploadFields(row.uploadFields),
      signedViewUrl: row.signedViewUrl,
      s3Url: row.s3Url,
      s3Key: row.s3Key,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
