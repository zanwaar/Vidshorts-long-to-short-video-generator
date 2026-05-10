import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, Sparkles, WandSparkles } from "lucide-react";

import { VideoUploadHero } from "@/components/dashboard/video-upload-hero";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { projects } from "@/db/schema";
import {
  getProjectStatusLabel,
  getProjectStepMessage,
} from "@/lib/project-upload";

export default async function DashboardPage() {
  const { userId } = await auth();

  const projectRows = userId
    ? await db
        .select({
          id: projects.id,
          title: projects.title,
          status: projects.status,
          uploadProgress: projects.uploadProgress,
          statusMessage: projects.statusMessage,
          createdAt: projects.createdAt,
        })
        .from(projects)
        .where(eq(projects.clerkUserId, userId))
        .orderBy(desc(projects.createdAt))
    : [];

  const recentProjects = projectRows.slice(0, 3);
  const currentDate = new Date();
  const uploadsThisMonth = projectRows.filter((project) => {
    const createdAt = new Date(project.createdAt);

    return (
      createdAt.getMonth() === currentDate.getMonth() &&
      createdAt.getFullYear() === currentDate.getFullYear()
    );
  }).length;
  const projectsReady = projectRows.filter((project) =>
    ["uploaded", "processing", "completed"].includes(project.status)
  ).length;
  const projectsInFlight = projectRows.filter((project) =>
    ["creating", "preparing_upload", "awaiting_upload", "uploading"].includes(
      project.status
    )
  ).length;
  const quickStats = [
    { label: "Uploads this month", value: String(uploadsThisMonth) },
    { label: "Projects ready", value: String(projectsReady) },
    { label: "In flight", value: String(projectsInFlight) },
  ];

  return (
    <div className="flex h-full flex-col gap-6 p-6 md:gap-8 md:p-8">
      <VideoUploadHero />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/45">
                Recent queue
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Your latest video jobs
              </h2>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60 sm:block">
              Protected route active
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {recentProjects.length ? (
              recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-medium text-white">{project.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {project.statusMessage ??
                          getProjectStepMessage(project.status, project.uploadProgress)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white/80"
                      >
                        {getProjectStatusLabel(project.status)}
                      </Badge>
                      <span className="text-sm text-white/60">
                        {project.uploadProgress}% complete
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/55">
                No projects yet. Start with a source upload above and the queue will
                appear here.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(125,92,255,0.18),transparent_35%),rgba(255,255,255,0.04)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <WandSparkles className="size-4 text-primary" />
                  AI next step
                </div>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Upload projects now prepare signed S3 targets with Inngest.
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  The current flow creates a project row, polls DB-backed status,
                  and stores the signed upload and view URLs once the workflow is
                  ready.
                </p>
              </div>
              <ArrowUpRight className="mt-1 hidden size-5 text-accent sm:block" />
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Sparkles className="size-4 text-accent" />
              Suggested workflow
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Select a source video and create a project record",
                "Let Inngest prepare the signed S3 upload target",
                "Upload the source asset and persist progress to the DB",
                "Use the returned signed URL to review the uploaded source",
              ].map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-muted-foreground"
                >
                  <span className="mr-3 text-white/45">0{index + 1}</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
