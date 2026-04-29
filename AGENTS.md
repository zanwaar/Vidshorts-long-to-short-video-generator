# AI Coding Agent Guidelines: ViralClip AI

## Project Architecture & Tech Stack
- **Framework**: Next.js 16 (App Router, React 19).
- **Folder Structure**: NO `/src` folder. All top-level directories: `/app`, `/components`, `/lib`, `/db`, `/hooks`, `/actions`, `/types`.
- **Auth**: Clerk (Middleware-based protection).
- **Database**: Neon (PostgreSQL) + Drizzle ORM.
- **Background Jobs**: Inngest (Event-driven architecture).
- **Styling**: Tailwind CSS v4 (No `tailwind.config.ts`, use `@theme` in `app/globals.css`).
- **Security**: Arcjet (Rate limiting, bot protection, and AI prompt injection detection).
- **Video Engine**: AWS S3 (Storage), AWS Lambda + FFmpeg (Clipping), Remotion Lambda (Captioning & Rendering).

## Coding Standards

### 1. Components
- Use Server Components by default. Add `'use client'` only when interactivity or browser APIs are required.
- Implement Shadcn UI-inspired components manually using Tailwind v4 utilities.

### 2. Server Actions
- Use Server Actions for all form submissions and data mutations.
- Place actions in `app/actions/` or alongside the component file in `actions.ts`.
- Validate all inputs using `zod`.

### 3. Database & Drizzle
- Schema defined in `db/schema.ts`.
- Use `db/index.ts` to export the Drizzle client initialized with the Neon connection string.
- Always use `camelCase` for TypeScript and `snake_case` for Database columns.

### 4. Background Job Pattern (Inngest)
- Create Inngest functions in `app/api/inngest/functions.ts`.
- Trigger events using `inngest.send({ name: 'video/uploaded', data: { s3Key } })`.
- Maintain a clear step-by-step logic: `extract-audio` -> `transcribe` -> `ai-select-highlights` -> `ffmpeg-clip` -> `remotion-render`.

### 5. Security (Arcjet)
- Initialize Arcjet in `lib/arcjet.ts`.
- Apply Arcjet protection in `middleware.ts` for global rules and specifically in API routes for prompt injection checks (Gemini inputs).

### 6. Video Processing
- **S3**: Use `@aws-sdk/s3-presigned-post` for direct uploads.
- **FFmpeg**: Trigger Lambda via SDK; do not attempt to run FFmpeg inside the Next.js runtime.
- **Remotion**: Compositions should be defined in `/remotion/` directory. Use `@remotion/lambda` for remote rendering.

## Workflows

### Feature Implementation Flow
1. Define Drizzle Schema changes.
2. Create the UI Layout/Page.
3. Implement Clerk Auth protection.
4. Set up the Inngest event listener.
5. Integrate external APIs (Deepgram/Gemini/Zernio).
6. Apply Arcjet security layers.

### Error Handling
- Use `try/catch` blocks in Server Actions and return a standardized `{ success: boolean, error?: string }` object.
- Log errors to a dedicated logging utility (e.g., Axiom or standard console in dev).