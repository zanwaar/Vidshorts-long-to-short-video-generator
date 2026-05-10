import {
  bigint,
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  real,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const projectStatusEnum = pgEnum("project_status", [
  "creating",
  "preparing_upload",
  "awaiting_upload",
  "uploading",
  "uploaded",
  "processing",
  "completed",
  "failed",
]);

export const videoStatusEnum = pgEnum("video_status", [
  "uploading",
  "processing",
  "completed",
  "failed",
]);

export const highlightStatusEnum = pgEnum("highlight_status", [
  "pending",
  "clipping",
  "rendering",
  "completed",
  "failed",
]);

export const shortVideoStatusEnum = pgEnum("short_video_status", [
  "pending",
  "clipping",
  "rendering",
  "completed",
  "failed",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    username: text("username"),
    imageUrl: text("image_url"),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    clerkUserIdIdx: uniqueIndex("users_clerk_user_id_idx").on(table.clerkUserId),
  })
);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  title: text("title").notNull(),
  sourceFileName: text("source_file_name").notNull(),
  sourceContentType: text("source_content_type"),
  sourceFileSize: bigint("source_file_size", { mode: "number" }),
  status: projectStatusEnum("status").default("creating").notNull(),
  uploadProgress: integer("upload_progress").default(0).notNull(),
  statusMessage: text("status_message"),
  s3Bucket: text("s3_bucket"),
  s3Key: text("s3_key"),
  uploadUrl: text("upload_url"),
  uploadFields: jsonb("upload_fields"),
  signedViewUrl: text("signed_view_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  contentType: text("content_type"),
  s3Key: text("s3_key"),
  s3Bucket: text("s3_bucket"),
  s3Url: text("s3_url"),
  signedViewUrl: text("signed_view_url"),
  status: videoStatusEnum("status").default("uploading"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const transcripts = pgTable("transcripts", {
  id: uuid("id").defaultRandom().primaryKey(),
  videoId: uuid("video_id")
    .references(() => videos.id, { onDelete: "cascade" })
    .notNull(),
  rawJson: jsonb("raw_json"),
  fullText: text("full_text"),
  language: text("language"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shortVideos = pgTable(
  "short_videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    videoId: uuid("video_id")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    clipIndex: integer("clip_index").notNull(),
    title: text("title").notNull(),
    startTime: real("start_time").notNull(),
    endTime: real("end_time").notNull(),
    duration: real("duration").notNull(),
    reason: text("reason").notNull(),
    seoScore: integer("seo_score").notNull(),
    transcriptExcerpt: text("transcript_excerpt").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    rawJson: jsonb("raw_json"),
    shortClipS3Url: text("short_clip_s3_url"),
    status: shortVideoStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    videoClipIndexIdx: uniqueIndex("short_videos_video_clip_index_idx").on(
      table.videoId,
      table.clipIndex
    ),
  })
);

export const shortVideoCaptions = pgTable(
  "short_video_captions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shortVideoId: uuid("short_video_id")
      .references(() => shortVideos.id, { onDelete: "cascade" })
      .notNull(),
    cueIndex: integer("cue_index").notNull(),
    startTime: real("start_time").notNull(),
    endTime: real("end_time").notNull(),
    text: text("text").notNull(),
    speaker: integer("speaker"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    shortVideoCueIndexIdx: uniqueIndex("short_video_captions_short_video_cue_idx").on(
      table.shortVideoId,
      table.cueIndex
    ),
  })
);

export const highlights = pgTable("highlights", {
  id: uuid("id").defaultRandom().primaryKey(),
  videoId: uuid("video_id")
    .references(() => videos.id, { onDelete: "cascade" })
    .notNull(),
  startTime: real("start_time"),
  endTime: real("end_time"),
  score: integer("score"),
  reason: text("reason"),
  seoScore: integer("seo_score"),
  transcriptSegment: text("transcript_segment"),
  shortClipS3Url: text("short_clip_s3_url"),
  status: highlightStatusEnum("status").default("pending"),
  zernioId: text("zernio_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  videos: many(videos),
  shortVideos: many(shortVideos),
}));

export const videosRelations = relations(videos, ({ many, one }) => ({
  project: one(projects, {
    fields: [videos.projectId],
    references: [projects.id],
  }),
  highlights: many(highlights),
  shortVideos: many(shortVideos),
  transcript: one(transcripts, {
    fields: [videos.id],
    references: [transcripts.videoId],
  }),
}));

export const transcriptsRelations = relations(transcripts, ({ one }) => ({
  video: one(videos, {
    fields: [transcripts.videoId],
    references: [videos.id],
  }),
}));

export const shortVideosRelations = relations(shortVideos, ({ many, one }) => ({
  project: one(projects, {
    fields: [shortVideos.projectId],
    references: [projects.id],
  }),
  video: one(videos, {
    fields: [shortVideos.videoId],
    references: [videos.id],
  }),
  captions: many(shortVideoCaptions),
}));

export const shortVideoCaptionsRelations = relations(
  shortVideoCaptions,
  ({ one }) => ({
    shortVideo: one(shortVideos, {
      fields: [shortVideoCaptions.shortVideoId],
      references: [shortVideos.id],
    }),
  })
);

export const highlightsRelations = relations(highlights, ({ one }) => ({
  video: one(videos, {
    fields: [highlights.videoId],
    references: [videos.id],
  }),
}));
