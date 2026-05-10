export type ProjectStatus =
  | "creating"
  | "preparing_upload"
  | "awaiting_upload"
  | "uploading"
  | "uploaded"
  | "processing"
  | "completed"
  | "failed";

export function deriveProjectTitle(fileName: string) {
  const normalizedName = fileName.trim();
  const extensionIndex = normalizedName.lastIndexOf(".");

  if (extensionIndex <= 0) {
    return normalizedName;
  }

  return normalizedName.slice(0, extensionIndex);
}

export function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getProjectStatusLabel(status: ProjectStatus) {
  switch (status) {
    case "creating":
      return "Creating";
    case "preparing_upload":
      return "Preparing";
    case "awaiting_upload":
      return "Ready";
    case "uploading":
      return "Uploading";
    case "uploaded":
      return "Uploaded";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
}

export function getProjectStepMessage(status: ProjectStatus, progress: number) {
  switch (status) {
    case "creating":
      return "Staging source video";
    case "preparing_upload":
      return "Preparing background upload";
    case "awaiting_upload":
      return "Upload target ready";
    case "uploading":
      if (progress >= 95) {
        return "Finalizing source asset";
      }

      if (progress >= 45) {
        return "Uploading video to S3";
      }

      return "Uploading source video in background";
    case "uploaded":
      return "Upload complete";
    case "processing":
      return "Queued for the clipping workflow";
    case "completed":
      return "Project ready";
    case "failed":
      return "Upload failed";
    default:
      return "Waiting to start";
  }
}
