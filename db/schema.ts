import {
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

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  fileName: text("file_name"),
  s3Url: text("s3_url"),
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
export const videosRelations = relations(videos, ({ many, one }) => ({
  highlights: many(highlights),
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

export const highlightsRelations = relations(highlights, ({ one }) => ({
  video: one(videos, {
    fields: [highlights.videoId],
    references: [videos.id],
  }),
}));
