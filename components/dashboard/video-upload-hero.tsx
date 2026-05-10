"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AlertTriangle,
  CircleCheckBig,
  Clock3,
  Film,
  HardDriveUpload,
  LoaderCircle,
  Play,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { createUploadProjectAction } from "@/app/actions/video-upload";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import {
  getProjectStatusLabel,
  getProjectStepMessage,
  type ProjectStatus,
} from "@/lib/project-upload";
import { cn } from "@/lib/utils";

type UploadState = "idle" | ProjectStatus;

type UploadStatusPayload = {
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
};

const acceptedFormats = ["MP4", "MOV", "AVI", "WebM"];
const idleMessage = "Select a long-form video to begin the upload workflow";
const activeUploadStates: UploadState[] = ["creating", "preparing_upload", "uploading"];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getUploadBadgeClassName(state: UploadState) {
  if (state === "failed") {
    return "text-rose-300";
  }

  if (state === "uploaded" || state === "completed") {
    return "text-emerald-300";
  }

  if (state === "uploading") {
    return "text-sky-200";
  }

  return "text-white/70";
}

export function VideoUploadHero() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadedPreviewOpen, setUploadedPreviewOpen] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(idleMessage);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [signedViewUrl, setSignedViewUrl] = useState<string | null>(null);
  const [s3Url, setS3Url] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const previewUrl = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const pollProjectStatus = useEffectEvent(async () => {
    if (!projectId) {
      return;
    }

    const response = await fetch(`/api/projects/${projectId}/upload-status`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as UploadStatusPayload;
    const nextMessage =
      payload.statusMessage ??
      getProjectStepMessage(payload.status, payload.uploadProgress);

    setUploadState(payload.status);
    setProgress(payload.uploadProgress);
    setStatusMessage(nextMessage);
    setS3Url(payload.s3Url);
    setSignedViewUrl(payload.signedViewUrl);

    if (payload.status === "failed") {
      setErrorMessage(nextMessage);
    }
  });

  useEffect(() => {
    if (!projectId) {
      return;
    }

    if (!activeUploadStates.includes(uploadState)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void pollProjectStatus();
    }, 0);

    const interval = window.setInterval(() => {
      void pollProjectStatus();
    }, 1500);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [projectId, uploadState]);

  function resetUploadSession() {
    setProjectId(null);
    setS3Url(null);
    setSignedViewUrl(null);
    setErrorMessage(null);
    setUploadState("idle");
    setProgress(0);
    setStatusMessage(idleMessage);
  }

  function handleSelectFile(file: File | null) {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    resetUploadSession();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleSelectFile(event.target.files?.[0] ?? null);
  }

  function handleUploadClick() {
    if (!selectedFile || activeUploadStates.includes(uploadState) || isPending) {
      return;
    }

    setErrorMessage(null);
    setS3Url(null);
    setSignedViewUrl(null);
    setUploadState("creating");
    setProgress(1);
    setStatusMessage("Staging source video for background upload");

    startTransition(() => {
      void (async () => {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const result = await createUploadProjectAction(formData);

        if (!result.success || !result.projectId) {
          setUploadState("failed");
          setErrorMessage(result.error ?? "Unable to create the upload project.");
          setStatusMessage(result.error ?? "Unable to create the upload project.");
          return;
        }

        setProjectId(result.projectId);
        setUploadState("preparing_upload");
        setProgress(5);
        setStatusMessage("Queued background upload with Inngest");
        router.push(`/dashboard/projects/${result.projectId}`);
      })();
    });
  }

  const uploadMessage =
    uploadState === "idle"
      ? idleMessage
      : statusMessage || getProjectStepMessage(uploadState, progress);
  const isUploadActive = activeUploadStates.includes(uploadState) || isPending;
  const badgeLabel =
    uploadState === "idle" ? "Waiting" : getProjectStatusLabel(uploadState);
  const uploadedViewUrl = signedViewUrl ?? s3Url;

  return (
    <>
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(125,92,255,0.30),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(102,201,255,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.32)] md:p-8">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/12 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-primary"
            >
              Dashboard Home
            </Badge>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Upload a long-form video and turn it into your next batch of shorts.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/68 md:text-base">
              Each upload stages the source on the server, then Inngest pushes the
              actual file to AWS S3 and keeps progress visible while it runs.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: HardDriveUpload,
                  label: "Project first",
                  detail: "Every upload starts with a tracked project ID",
                },
                {
                  icon: Play,
                  label: "Inngest upload",
                  detail: "The background job performs the AWS S3 upload",
                },
                {
                  icon: Sparkles,
                  label: "Pipeline ready",
                  detail: "Uploaded sources are ready for the next workflow",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 backdrop-blur-sm"
                  >
                    <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                      <Icon className="size-4 text-white" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-white">{item.label}</p>
                    <p className="mt-1 text-sm text-white/55">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-black/30 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-sm sm:p-5">
            <div className="rounded-[1.5rem] border border-dashed border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-white/45">
                    Video upload
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                    Source file selection
                  </h2>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em]",
                    getUploadBadgeClassName(uploadState)
                  )}
                >
                  {badgeLabel}
                </Badge>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                {!selectedFile ? (
                  <div className="flex min-h-72 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)] px-6 py-10 text-center">
                    <div className="flex size-16 items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/5">
                      <Upload className="size-6 text-white" />
                    </div>
                    <h3 className="mt-5 text-xl font-medium text-white">
                      Choose a long-form source video
                    </h3>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-white/58">
                      Select a file from your computer to create a project, queue the
                      Inngest upload, and track the progress end to end.
                    </p>

                    <Button
                      size="lg"
                      className="mt-6 rounded-full border border-primary/40 px-5"
                      onClick={() => inputRef.current?.click()}
                    >
                      <HardDriveUpload className="size-4" />
                      Select video
                    </Button>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-white/45">
                      {acceptedFormats.map((format) => (
                        <span
                          key={format}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/30">
                      {previewUrl ? (
                        <video
                          key={previewUrl}
                          src={previewUrl}
                          controls
                          preload="metadata"
                          className="aspect-video h-full w-full bg-black object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-black/30">
                          <Video className="size-8 text-white/45" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                          <Film className="size-4 text-accent" />
                          Selected source
                        </div>
                        <p className="mt-3 line-clamp-2 text-lg font-medium text-white">
                          {selectedFile.name}
                        </p>
                        {projectId ? (
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/42">
                            Project ID {projectId}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/42">
                            File size
                          </p>
                          <p className="mt-2 text-base font-medium text-white">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/42">
                            Format
                          </p>
                          <p className="mt-2 text-base font-medium text-white">
                            {selectedFile.type || "Video"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="rounded-full border-white/12 bg-white/5 px-5 text-white hover:bg-white/8"
                          onClick={() => setPreviewOpen(true)}
                        >
                          <Play className="size-4" />
                          Preview
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="rounded-full border-white/12 bg-white/5 px-5 text-white hover:bg-white/8"
                          onClick={() => inputRef.current?.click()}
                          disabled={isUploadActive}
                        >
                          <Video className="size-4" />
                          Replace
                        </Button>

                        <button
                          type="button"
                          onClick={handleUploadClick}
                          disabled={isUploadActive}
                          className={cn(
                            buttonVariants({ size: "lg" }),
                            "rounded-full border border-primary/40 px-5",
                            (uploadState === "uploaded" || uploadState === "completed") &&
                              "bg-emerald-500 hover:bg-emerald-500",
                            uploadState === "failed" && "bg-rose-500 hover:bg-rose-500"
                          )}
                        >
                          {isUploadActive ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : uploadState === "uploaded" || uploadState === "completed" ? (
                            <CircleCheckBig className="size-4" />
                          ) : uploadState === "failed" ? (
                            <AlertTriangle className="size-4" />
                          ) : (
                            <Upload className="size-4" />
                          )}
                          {isUploadActive
                            ? "Uploading..."
                            : uploadState === "uploaded" || uploadState === "completed"
                              ? "Uploaded"
                              : uploadState === "failed"
                                ? "Upload again"
                                : "Upload video"}
                        </button>

                        {uploadedViewUrl ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setUploadedPreviewOpen(true)}
                            className={cn(
                              "rounded-full border-white/12 bg-white/5 px-5 text-white hover:bg-white/8"
                            )}
                          >
                            <Play className="size-4" />
                            View upload
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Clock3 className="size-4 text-primary" />
                    Upload progress
                  </div>
                  <span className="text-sm text-white/55">{uploadMessage}</span>
                </div>

                <Progress value={progress} className="mt-4 gap-2">
                  <div className="flex w-full items-center gap-3">
                    <ProgressLabel className="text-sm text-white">
                      {selectedFile ? selectedFile.name : "No source selected"}
                    </ProgressLabel>
                    <ProgressValue className="ml-auto text-white/55" />
                  </div>
                </Progress>

                <p className="mt-3 text-sm text-white/50">
                  {projectId
                    ? `Project ${projectId} is the source of truth for polling and workflow updates.`
                    : "Choose a source video, then the upload button will queue the Inngest S3 job."}
                </p>

                {errorMessage ? (
                  <p className="mt-3 text-sm text-rose-300">{errorMessage}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,26,0.98),rgba(14,14,20,0.98))] p-5 text-white sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Video Preview</DialogTitle>
            <DialogDescription className="text-white/55">
              Review the selected source clip before starting the upload flow.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
            {previewUrl ? (
              <video
                key={`${previewUrl}-dialog`}
                src={previewUrl}
                controls
                preload="metadata"
                className="aspect-video w-full bg-black"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center">
                <Video className="size-8 text-white/40" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadedPreviewOpen} onOpenChange={setUploadedPreviewOpen}>
        <DialogContent className="max-w-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,26,0.98),rgba(14,14,20,0.98))] p-5 text-white sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Uploaded Video</DialogTitle>
            <DialogDescription className="text-white/55">
              Tampilkan hasil upload langsung di player, bukan download file.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
            {uploadedViewUrl ? (
              <video
                key={`${uploadedViewUrl}-dialog`}
                src={uploadedViewUrl}
                controls
                preload="metadata"
                className="aspect-video w-full bg-black"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center">
                <Video className="size-8 text-white/40" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
