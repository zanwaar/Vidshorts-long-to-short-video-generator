"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clapperboard,
  Download,
  LoaderCircle,
  Sparkles,
  Subtitles,
  Video,
  WandSparkles,
} from "lucide-react";

import { startVideoAnalysisAction } from "@/app/actions/video-upload";
import { ShortVideoPlayer } from "@/components/dashboard/short-video-player";
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

const shortVideoPollingStatuses = ["clipping", "rendering"] as const;

async function fetchProjectStatusSnapshot(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/upload-status`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ProjectStatusSnapshot;
}

function shouldPollSnapshot(snapshot: ProjectStatusSnapshot) {
  if (pollableStatuses.includes(snapshot.status)) {
    return true;
  }

  return snapshot.shortVideoPreview.some((clip) =>
    shortVideoPollingStatuses.includes(
      clip.status as (typeof shortVideoPollingStatuses)[number]
    )
  );
}

function formatCueTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = Math.floor(safeSeconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatClipDuration(seconds: number) {
  const roundedSeconds = Math.max(1, Math.round(seconds));
  const mins = Math.floor(roundedSeconds / 60);
  const secs = roundedSeconds % 60;

  if (mins === 0) {
    return `${secs}s`;
  }

  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function getWorkflowSteps(snapshot: ProjectStatusSnapshot) {
  const uploadComplete = ["uploaded", "processing", "completed"].includes(snapshot.status);
  const transcriptComplete = snapshot.captionCount > 0 || snapshot.status === "completed";
  const captionsComplete = snapshot.captionCount > 0 || snapshot.status === "completed";
  const highlightsComplete = snapshot.shortVideoCount > 0;

  return [
    {
      label: "Upload source video",
      detail: "Move the full recording into the project bucket and verify playback.",
      state: uploadComplete
        ? "complete"
        : pollableStatuses.includes(snapshot.status)
          ? "active"
          : "pending",
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
      detail: "Use the transcript to select the best 30 to 90 second short clips.",
      state: highlightsComplete
        ? "complete"
        : snapshot.status === "processing" && snapshot.uploadProgress >= 92
          ? "active"
          : captionsComplete
            ? "pending"
            : "pending",
    },
  ] satisfies Array<{
    label: string;
    detail: string;
    state: WorkflowStepState;
  }>;
}

function getClipReadinessLabel(
  clip: ProjectStatusSnapshot["shortVideoPreview"][number]
) {
  if (clip.shortClipS3Url) {
    return "Export ready";
  }

  if (clip.status === "completed") {
    return "Completed";
  }

  if (clip.status === "failed") {
    return "Needs retry";
  }

  if (clip.status === "clipping" || clip.status === "rendering") {
    return "Rendering";
  }

  return "Preview ready";
}

function getClipReadinessClasses(
  clip: ProjectStatusSnapshot["shortVideoPreview"][number]
) {
  if (clip.shortClipS3Url || clip.status === "completed") {
    return "border-emerald-400/18 bg-emerald-400/10 text-emerald-100";
  }

  if (clip.status === "failed") {
    return "border-rose-400/18 bg-rose-400/10 text-rose-100";
  }

  if (clip.status === "clipping" || clip.status === "rendering") {
    return "border-sky-400/18 bg-sky-400/10 text-sky-100";
  }

  return "border-amber-300/18 bg-amber-300/10 text-amber-100";
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
  const [selectedClipId, setSelectedClipId] = useState<string | null>(
    initialSnapshot.shortVideoPreview[0]?.id ?? null
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAnalysisPending, startAnalysisTransition] = useTransition();

  useEffect(() => {
    if (!shouldPollSnapshot(snapshot)) {
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
  }, [snapshot]);

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

  const sourceVideoUrl = snapshot.signedViewUrl ?? snapshot.s3Url;
  const effectiveSelectedClipId =
    selectedClipId &&
    snapshot.shortVideoPreview.some((clip) => clip.id === selectedClipId)
      ? selectedClipId
      : snapshot.shortVideoPreview[0]?.id ?? null;
  const selectedClip =
    snapshot.shortVideoPreview.find((clip) => clip.id === effectiveSelectedClipId) ??
    snapshot.shortVideoPreview[0] ??
    null;
  const previewUrl = sourceVideoUrl ?? selectedClip?.shortClipS3Url ?? null;
  const normalizedCaptions = useMemo(() => {
    if (!selectedClip) {
      return [];
    }

    return selectedClip.captions.map((cue) => ({
      cueIndex: cue.cueIndex,
      startTime: Math.max(0, cue.startTime - selectedClip.startTime),
      endTime: Math.max(0, cue.endTime - selectedClip.startTime),
      text: cue.text,
      speaker: cue.speaker,
    }));
  }, [selectedClip]);
  const previewStartTime = sourceVideoUrl ? selectedClip?.startTime ?? 0 : 0;
  const previewEndTime = sourceVideoUrl
    ? selectedClip?.endTime ?? 0
    : selectedClip?.duration ?? 0;
  const displayMessage =
    snapshot.statusMessage ??
    getProjectStepMessage(snapshot.status, snapshot.uploadProgress);
  const canStartAnalysis =
    snapshot.status === "uploaded" && Boolean(snapshot.videoId && snapshot.s3Key);
  const canRetryAnalysis =
    snapshot.status === "failed" && Boolean(snapshot.videoId && snapshot.s3Key);
  const workflowSteps = getWorkflowSteps(snapshot);
  const hasPlayableShortClip = Boolean(selectedClip && previewUrl);

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
            {hasPlayableShortClip
              ? "The short clip preview is ready. Review the cut, check the captions, and move it toward export or scheduling."
              : "Track upload, transcription, captions, and short-clip generation from one project workspace."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-white/42">
            <span>Source file: {snapshot.sourceFileName}</span>
            {snapshot.shortVideoCount ? (
              <span>{snapshot.shortVideoCount} clips generated</span>
            ) : null}
          </div>
        </div>

        <Badge
          variant="outline"
          className="border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-white/80"
        >
          {getProjectStatusLabel(snapshot.status)}
        </Badge>
      </div>

      {hasPlayableShortClip && selectedClip && previewUrl ? (
        <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-6">
            <div className="rounded-[1.9rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(100,208,255,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Clapperboard className="size-4 text-primary" />
                    Generated short clip
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    {selectedClip.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/58">
                    This preview uses the full source video with the AI-selected start
                    and end times, so you can review the actual cut immediately
                    without waiting for a separate render.
                  </p>
                </div>

                <div
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.22em]",
                    getClipReadinessClasses(selectedClip)
                  )}
                >
                  {getClipReadinessLabel(selectedClip)}
                </div>
              </div>

              <div className="mt-6">
                <ShortVideoPlayer
                  videoUrl={previewUrl}
                  title={selectedClip.title}
                  startTime={previewStartTime}
                  endTime={previewEndTime}
                  captions={normalizedCaptions}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/72">
                  {formatCueTime(selectedClip.startTime)} -{" "}
                  {formatCueTime(selectedClip.endTime)}
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/72">
                  {formatClipDuration(selectedClip.duration)}
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/72">
                  {selectedClip.captions.length} caption cues
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/72">
                  SEO score {selectedClip.seoScore}/100
                </div>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Sparkles className="size-4 text-accent" />
                Select a generated clip
              </div>
              <p className="mt-3 text-sm leading-6 text-white/55">
                Swap between AI-selected moments without leaving the detail page.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {snapshot.shortVideoPreview.map((clip) => {
                  const isSelected = clip.id === selectedClip.id;

                  return (
                    <button
                      key={clip.id}
                      type="button"
                      onClick={() => setSelectedClipId(clip.id)}
                      className={cn(
                        "rounded-[1.35rem] border p-4 text-left transition",
                        isSelected
                          ? "border-primary/40 bg-primary/10 shadow-[0_18px_40px_rgba(172,86,255,0.12)]"
                          : "border-white/10 bg-black/20 hover:border-white/18 hover:bg-white/[0.06]"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/42">
                            {formatCueTime(clip.startTime)} - {formatCueTime(clip.endTime)}
                          </p>
                          <p className="mt-2 text-base font-medium text-white">
                            {clip.title}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.22em]",
                            getClipReadinessClasses(clip)
                          )}
                        >
                          {getClipReadinessLabel(clip)}
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-white/62">
                        {clip.reason}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
                        <span>{formatClipDuration(clip.duration)}</span>
                        <span>SEO {clip.seoScore}/100</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {snapshot.transcriptText ? (
              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Subtitles className="size-4 text-accent" />
                      Full transcript
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
                    {snapshot.captionCount} source caption cues
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
            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Sparkles className="size-4 text-primary" />
                Why this clip matters
              </div>

              <p className="mt-4 text-2xl font-semibold leading-tight text-white">
                {selectedClip.reason}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                    SEO score
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-white">
                    {selectedClip.seoScore}
                    <span className="text-lg text-white/45">/100</span>
                  </p>
                </div>
                <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                    Source timing
                  </p>
                  <p className="mt-3 text-xl font-semibold text-white">
                    {formatCueTime(selectedClip.startTime)} -{" "}
                    {formatCueTime(selectedClip.endTime)}
                  </p>
                  <p className="mt-2 text-sm text-white/48">
                    {formatClipDuration(selectedClip.duration)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {selectedClip.shortClipS3Url ? (
                  <Button
                    nativeButton={false}
                    render={
                      <a
                        href={selectedClip.shortClipS3Url}
                        target="_blank"
                        rel="noreferrer"
                        download
                      />
                    }
                    className="rounded-full px-5"
                  >
                    <Download className="size-4" />
                    Download clip
                  </Button>
                ) : (
                  <Button disabled className="rounded-full px-5">
                    <Download className="size-4" />
                    Download clip
                  </Button>
                )}

                <Button
                  variant="outline"
                  disabled
                  className="rounded-full border-white/12 bg-white/[0.03] px-5 text-white/72"
                >
                  <CalendarDays className="size-4" />
                  Schedule video
                </Button>
              </div>

              <p className="mt-3 text-sm leading-6 text-white/48">
                {selectedClip.shortClipS3Url
                  ? "The exported clip is available for direct download from S3."
                  : "Download becomes available after the clip is exported to its own S3 object. Scheduling UI is staged here until distribution integrations are connected."}
              </p>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Subtitles className="size-4 text-accent" />
                Clip captions
              </div>
              <p className="mt-3 text-sm leading-6 text-white/55">
                Timed caption cues are aligned to the selected clip preview, not the
                full source timeline.
              </p>

              <div className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                {normalizedCaptions.length ? (
                  normalizedCaptions.map((cue) => (
                    <div
                      key={`${cue.cueIndex}-${cue.startTime}`}
                      className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/38">
                          {formatCueTime(cue.startTime)} - {formatCueTime(cue.endTime)}
                        </p>
                        {cue.speaker !== null ? (
                          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sky-200/75">
                            Speaker {cue.speaker}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/72">{cue.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/50">
                    Captions will appear here as soon as cue data exists for this clip.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Video className="size-4 text-primary" />
                Clip transcript excerpt
              </div>
              <p className="mt-4 text-sm leading-7 text-white/68">
                {selectedClip.transcriptExcerpt}
              </p>
            </div>
          </div>
        </div>
      ) : (
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
                {sourceVideoUrl ? (
                  <video
                    key={sourceVideoUrl}
                    src={sourceVideoUrl}
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
                <Clapperboard className="size-4 text-primary" />
                Short video suggestions
              </div>

              <div className="mt-5 space-y-3">
                {snapshot.shortVideoPreview.length ? (
                  snapshot.shortVideoPreview.map((clip) => (
                    <div
                      key={clip.id}
                      className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/38">
                          {formatCueTime(clip.startTime)} - {formatCueTime(clip.endTime)}
                        </p>
                        <div
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.22em]",
                            getClipReadinessClasses(clip)
                          )}
                        >
                          {getClipReadinessLabel(clip)}
                        </div>
                      </div>
                      <p className="mt-2 text-sm font-medium text-white">{clip.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">{clip.reason}</p>
                      <p className="mt-3 text-sm leading-6 text-white/52">
                        {clip.transcriptExcerpt}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/50">
                    Run AI analysis to generate short-video candidates from the transcript.
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
      )}
    </div>
  );
}
