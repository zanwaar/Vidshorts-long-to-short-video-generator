import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { sanitizeFileName } from "@/lib/project-upload";

const S3_UPLOAD_EXPIRATION_SECONDS = 60 * 10;
const S3_VIEW_EXPIRATION_SECONDS = 60 * 60;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function getOptionalEnv(name: string) {
  const value = process.env[name]?.trim();

  return value ? value : undefined;
}

function getOptionalEnvFromAliases(...names: string[]) {
  for (const name of names) {
    const value = getOptionalEnv(name);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function getAwsRegion() {
  return getOptionalEnvFromAliases("AWS_REGION", "AWS_DEFAULT_REGION") ?? "us-east-1";
}

export function getVideoBucketName() {
  const bucketName = getOptionalEnvFromAliases("AWS_S3_BUCKET_NAME", "AWS_BUCKET");

  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME or AWS_BUCKET is required");
  }

  return bucketName;
}

function shouldForcePathStyle() {
  const rawValue = getOptionalEnvFromAliases(
    "AWS_S3_FORCE_PATH_STYLE",
    "AWS_USE_PATH_STYLE_ENDPOINT"
  );

  return rawValue === "true";
}

function encodeObjectKey(objectKey: string) {
  return objectKey.split("/").map(encodeURIComponent).join("/");
}

export function createS3Client() {
  return new S3Client({
    region: getAwsRegion(),
    endpoint: getOptionalEnvFromAliases("AWS_S3_ENDPOINT", "AWS_ENDPOINT"),
    forcePathStyle: shouldForcePathStyle(),
    credentials: {
      accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });
}

export function getS3ObjectUrl(input: { bucket: string; objectKey: string }) {
  const { bucket, objectKey } = input;
  const encodedObjectKey = encodeObjectKey(objectKey);
  const publicBaseUrl = getOptionalEnv("AWS_S3_PUBLIC_URL_BASE");

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/+$/, "")}/${encodedObjectKey}`;
  }

  const endpoint = getOptionalEnvFromAliases("AWS_S3_ENDPOINT", "AWS_ENDPOINT");

  if (endpoint) {
    const endpointUrl = new URL(endpoint);

    if (shouldForcePathStyle()) {
      endpointUrl.pathname = `/${bucket}/${encodedObjectKey}`;
      return endpointUrl.toString();
    }

    endpointUrl.hostname = `${bucket}.${endpointUrl.hostname}`;
    endpointUrl.pathname = `/${encodedObjectKey}`;
    return endpointUrl.toString();
  }

  const region = getAwsRegion();
  const s3Host =
    region === "us-east-1" ? "s3.amazonaws.com" : `s3.${region}.amazonaws.com`;

  return `https://${bucket}.${s3Host}/${encodedObjectKey}`;
}

export async function createSignedVideoViewUrl(input: {
  bucket: string;
  objectKey: string;
  contentType?: string;
}) {
  const client = createS3Client();

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: input.bucket,
      Key: input.objectKey,
      ResponseContentType: input.contentType,
      ResponseContentDisposition: "inline",
    }),
    { expiresIn: S3_VIEW_EXPIRATION_SECONDS }
  );
}

export async function assertVideoObjectExists(input: {
  bucket: string;
  objectKey: string;
}) {
  const client = createS3Client();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: input.bucket,
        Key: input.objectKey,
      })
    );
  } catch (error) {
    throw new Error("Uploaded video was not found in S3.", {
      cause: error,
    });
  }
}

export async function createVideoUploadTarget(input: {
  clerkUserId: string;
  projectId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}) {
  const { clerkUserId, projectId, fileName, contentType, fileSize } = input;
  const client = createS3Client();
  const bucket = getVideoBucketName();
  const objectKey = [
    "projects",
    clerkUserId,
    projectId,
    "source",
    `${randomUUID()}-${sanitizeFileName(fileName) || "source-video"}`,
  ].join("/");
  const s3Url = getS3ObjectUrl({ bucket, objectKey });

  const signedViewUrl = await createSignedVideoViewUrl({
    bucket,
    objectKey,
    contentType,
  });

  const presignedPost = await createPresignedPost(client, {
    Bucket: bucket,
    Key: objectKey,
    Conditions: [
      ["content-length-range", 0, fileSize],
      ["starts-with", "$Content-Type", "video/"],
    ],
    Fields: {
      "Content-Type": contentType,
    },
    Expires: S3_UPLOAD_EXPIRATION_SECONDS,
  });

  return {
    bucket,
    objectKey,
    s3Url,
    signedViewUrl,
    uploadUrl: presignedPost.url,
    uploadFields: presignedPost.fields,
  };
}

export async function uploadVideoToS3(input: {
  clerkUserId: string;
  projectId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  body: Readable;
}) {
  const { clerkUserId, projectId, fileName, contentType, fileSize, body } = input;
  const client = createS3Client();
  const bucket = getVideoBucketName();
  const objectKey = [
    "projects",
    clerkUserId,
    projectId,
    "source",
    `${randomUUID()}-${sanitizeFileName(fileName) || "source-video"}`,
  ].join("/");

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
      ContentLength: fileSize,
      ContentDisposition: "inline",
    })
  );

  const s3Url = getS3ObjectUrl({ bucket, objectKey });
  const signedViewUrl = await createSignedVideoViewUrl({
    bucket,
    objectKey,
    contentType,
  });

  return {
    bucket,
    objectKey,
    s3Url,
    signedViewUrl,
  };
}
