CREATE TYPE "public"."highlight_status" AS ENUM('pending', 'clipping', 'rendering', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('creating', 'preparing_upload', 'awaiting_upload', 'uploading', 'uploaded', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."short_video_status" AS ENUM('pending', 'clipping', 'rendering', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('uploading', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"start_time" real,
	"end_time" real,
	"score" integer,
	"reason" text,
	"seo_score" integer,
	"transcript_segment" text,
	"short_clip_s3_url" text,
	"status" "highlight_status" DEFAULT 'pending',
	"zernio_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"title" text NOT NULL,
	"source_file_name" text NOT NULL,
	"source_content_type" text,
	"source_file_size" bigint,
	"status" "project_status" DEFAULT 'creating' NOT NULL,
	"upload_progress" integer DEFAULT 0 NOT NULL,
	"status_message" text,
	"s3_bucket" text,
	"s3_key" text,
	"upload_url" text,
	"upload_fields" jsonb,
	"signed_view_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "short_video_captions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_video_id" uuid NOT NULL,
	"cue_index" integer NOT NULL,
	"start_time" real NOT NULL,
	"end_time" real NOT NULL,
	"text" text NOT NULL,
	"speaker" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "short_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"clip_index" integer NOT NULL,
	"title" text NOT NULL,
	"start_time" real NOT NULL,
	"end_time" real NOT NULL,
	"duration" real NOT NULL,
	"reason" text NOT NULL,
	"seo_score" integer NOT NULL,
	"transcript_excerpt" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"raw_json" jsonb,
	"short_clip_s3_url" text,
	"status" "short_video_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"raw_json" jsonb,
	"full_text" text,
	"language" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text,
	"first_name" text,
	"last_name" text,
	"username" text,
	"image_url" text,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"clerk_user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" bigint,
	"content_type" text,
	"s3_key" text,
	"s3_bucket" text,
	"s3_url" text,
	"signed_view_url" text,
	"status" "video_status" DEFAULT 'uploading',
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_video_captions" ADD CONSTRAINT "short_video_captions_short_video_id_short_videos_id_fk" FOREIGN KEY ("short_video_id") REFERENCES "public"."short_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_videos" ADD CONSTRAINT "short_videos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_videos" ADD CONSTRAINT "short_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "short_video_captions_short_video_cue_idx" ON "short_video_captions" USING btree ("short_video_id","cue_index");--> statement-breakpoint
CREATE UNIQUE INDEX "short_videos_video_clip_index_idx" ON "short_videos" USING btree ("video_id","clip_index");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_idx" ON "users" USING btree ("clerk_user_id");