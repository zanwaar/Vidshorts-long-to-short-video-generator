import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ProjectWorkflowClient } from "@/components/dashboard/project-workflow-client";
import { getProjectStatusSnapshot } from "@/lib/project-status";

const pageParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export default async function ProjectWorkflowPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const { projectId } = pageParamsSchema.parse(await params);
  const snapshot = await getProjectStatusSnapshot({
    clerkUserId: userId,
    projectId,
  });

  if (!snapshot) {
    notFound();
  }

  return <ProjectWorkflowClient initialSnapshot={snapshot} />;
}
