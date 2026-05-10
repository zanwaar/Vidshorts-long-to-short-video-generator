"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  LoaderCircle,
  Sparkles,
  Subtitles,
  Video,
  WandSparkles,
} from "lucide-react";

import { startVideoAnalysisAction } from "@/app/actions/video-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import type { ProjectStatusSnapshot } from "@/lib/project-status";
import {
  getProjectStatusLabel,
  getProjectStepMessage,
  type ProjectStatus,
} from "@/lib/project-upload";
import { cn } from "@/lib/utils";

type WorkflowStepState = "complete" | "active" | "pending";

const pollableStatuses: ProjectStatus[] = [
  "creating",
  "preparing_upload",
  "uploading",
  "processing",
];

async function fetchProjectStatusSnapshot(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/upload-status`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ProjectStatusSnapshot;
}

function formatCueTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getWorkflowSteps(snapshot: ProjectStatusSnapshot) {
  const uploadComplete = ["uploaded", "processing", "completed"].includes(snapshot.status);
  const transcriptComplete = snapshot.status === "completed";
  const captionsComplete = snapshot.status === "completed";

  return [
    {
      label: "Upload source video",
      detail: "Move the full recording into the project bucket and verify playback.",
      state: uploadComplete ? "complete" : pollableStatuses.includes(snapshot.status) ? "active" : "pending",
    },
    {
      label: "Transcribe with Deepgram",
      detail: "Generate a full transcript from the uploaded video URL.",
      state: transcriptComplete
        ? "complete"
        : snapshot.status === "processing" && snapshot.uploadProgress < 88
          ? "active"
          : uploadComplete
            ? "pending"
            : "pending",
    },
    {
      label: "Build captions",
      detail: "Convert transcript utterances into time-coded caption cues.",
      state: captionsComplete
        ? "complete"
        : snapshot.status === "processing" && snapshot.uploadProgress >= 88
          ? "active"
          : uploadComplete
            ? "pending"
            : "pending",
    },
    {
      label: "Select highlights",
      detail: "Next stage for short clips once transcript QA is done.",
      state: "pending",
    },
    {
      label: "Render shorts",
      detail: "Captioned clip rendering will start after highlight selection exists.",
      state: "pending",
    },
  ] satisfies Array<{
    label: string;
    detail: string;
    state: WorkflowStepState;
  }>;
}

function StepIcon({ state }: { state: WorkflowStepState }) {
  if (state === "complete") {
    return <CheckCircle2 className="size-5 text-emerald-300" />;
  }

  if (state === "active") {
    return <LoaderCircle className="size-5 animate-spin text-sky-300" />;
  }

  return <CircleDashed className="size-5 text-white/30" />;
}

export function ProjectWorkflowClient({
  initialSnapshot,
}: {
  initialSnapshot: ProjectStatusSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAnalysisPending, startAnalysisTransition] = useTransition();

  useEffect(() => {
    if (!pollableStatuses.includes(snapshot.status)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void (async () => {
        const nextSnapshot = await fetchProjectStatusSnapshot(snapshot.projectId);

        if (nextSnapshot) {
          setSnapshot(nextSnapshot);
        }
      })();
    }, 0);

    const interval = window.setInterval(() => {
      void (async () => {
        const nextSnapshot = await fetchProjectStatusSnapshot(snapshot.projectId);

        if (nextSnapshot) {
          setSnapshot(nextSnapshot);
        }
      })();
    }, 1500);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [snapshot.projectId, snapshot.status]);

  function handleStartAnalysis() {
    setActionError(null);

    startAnalysisTransition(() => {
      void (async () => {
        const result = await startVideoAnalysisAction({
          projectId: snapshot.projectId,
        });

        if (!result.success) {
          setActionError(result.error ?? "Unable to start AI analysis.");
          return;
        }

        setSnapshot((currentSnapshot) => ({
          ...currentSnapshot,
          status: "processing",
          uploadProgress: Math.max(currentSnapshot.uploadProgress, 55),
          statusMessage: "Queued AI analysis with Inngest",
        }));
        const nextSnapshot = await fetchProjectStatusSnapshot(snapshot.projectId);

        if (nextSnapshot) {
          setSnapshot(nextSnapshot);
        }
      })();
    });
  }

  const displayMessage =
    snapshot.statusMessage ??
    getProjectStepMessage(snapshot.status, snapshot.uploadProgress);
  const canStartAnalysis =
    snapshot.status === "uploaded" && Boolean(snapshot.videoId && snapshot.s3Key);
  const canRetryAnalysis =
    snapshot.status === "failed" && Boolean(snapshot.videoId && snapshot.s3Key);
  const workflowSteps = getWorkflowSteps(snapshot);
  const videoUrl = snapshot.signedViewUrl ?? snapshot.s3Url;

  return (
    <div className="flex h-full flex-col gap-6 p-6 md:gap-8 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {snapshot.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/62">
            Track upload, transcription, captions, and the next short-clip stages
            from one project workspace.
          </p>
        </div>

        <Badge
          variant="outline"
          className="border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-white/80"
        >
          {getProjectStatusLabel(snapshot.status)}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(100,208,255,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Sparkles className="size-4 text-primary" />
                  Project progress
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {displayMessage}
                </p>
                <p className="mt-2 text-sm text-white/52">
                  Source file: {snapshot.sourceFileName}
                </p>
              </div>

              {(canStartAnalysis || canRetryAnalysis) && (
                <Button
                  type="button"
                  onClick={handleStartAnalysis}
                  disabled={isAnalysisPending}
                  className="rounded-full border border-primary/40 px-5"
                >
                  {isAnalysisPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <WandSparkles className="size-4" />
                  )}
                  {canRetryAnalysis ? "Retry AI analysis" : "Run AI analysis"}
                </Button>
              )}
            </div>

            <Progress value={snapshot.uploadProgress} className="mt-5 gap-2">
              <div className="flex w-full items-center gap-3">
                <ProgressLabel className="text-sm text-white">
                  Pipeline completion
                </ProgressLabel>
                <ProgressValue className="ml-auto text-white/55" />
              </div>
            </Progress>

            {actionError ? (
              <p className="mt-3 text-sm text-rose-300">{actionError}</p>
            ) : null}
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Subtitles className="size-4 text-accent" />
              Workflow steps
            </div>

            <div className="mt-5 space-y-3">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.label}
                  className={cn(
                    "rounded-[1.3rem] border p-4",
                    step.state === "complete" &&
                      "border-emerald-500/20 bg-emerald-500/[0.08]",
                    step.state === "active" &&
                      "border-sky-500/20 bg-sky-500/[0.08]",
                    step.state === "pending" &&
                      "border-white/10 bg-black/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <StepIcon state={step.state} />
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-white/42">
                        Step 0{index + 1}
                      </p>
                      <p className="mt-2 text-base font-medium text-white">
                        {step.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/55">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {snapshot.transcriptText ? (
            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Sparkles className="size-4 text-primary" />
                    Transcript preview
                  </div>
                  <p className="mt-2 text-sm text-white/52">
                    {snapshot.transcriptLanguage
                      ? `Detected language: ${snapshot.transcriptLanguage}`
                      : "Language detection unavailable"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white/75"
                >
                  {snapshot.captionCount} caption cues
                </Badge>
              </div>

              <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-white/72">
                  {snapshot.transcriptText}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Video className="size-4 text-primary" />
              Uploaded source
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-white/10 bg-black">
              {videoUrl ? (
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  preload="metadata"
                  className="aspect-video w-full bg-black"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center text-sm text-white/45">
                  The player will appear after the S3 upload is ready.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Subtitles className="size-4 text-accent" />
              Caption samples
            </div>

            <div className="mt-5 space-y-3">
              {snapshot.captionPreview.length ? (
                snapshot.captionPreview.map((cue) => (
                  <div
                    key={`${cue.index}-${cue.start}`}
                    className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-white/38">
                      {formatCueTime(cue.start)} - {formatCueTime(cue.end)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{cue.text}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/50">
                  Run AI analysis to create timed captions from the uploaded source.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
