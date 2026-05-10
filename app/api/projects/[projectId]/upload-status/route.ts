import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { getProjectStatusSnapshot } from "@/lib/project-status";

const routeParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = routeParamsSchema.parse(await context.params);
  const snapshot = await getProjectStatusSnapshot({
    clerkUserId: userId,
    projectId,
  });

  if (!snapshot) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json(
    snapshot,
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
