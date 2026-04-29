# Design System: ViralClip AI (Violet Theme)

## Overview
This design system is tailored for a high-performance video processing application. The "Violet" theme conveys creativity, intelligence, and premium AI capabilities. It utilizes glassmorphism for overlays and high-contrast elements for video editing interfaces.

## Color Palette (Tailwind CSS v4 Variables)

css
@theme {
  --color-background: #09090b;
  --color-foreground: #f8fafc;

  --color-primary: #7c3aed;
  --color-primary-foreground: #ffffff;

  --color-secondary: #1e1b4b;
  --color-secondary-foreground: #e9d5ff;

  --color-accent: #d8b4fe;
  --color-muted: #1e293b;
  --color-muted-foreground: #94a3b8;

  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-destructive: #ef4444;

  --color-border: #2e1065;
  --color-input: #1e1b4b;

  --radius-lg: 0.75rem;
  --radius-md: 0.5rem;
  --radius-sm: 0.25rem;
}


## Typography
- **Primary Sans**: `Inter`, system-ui, sans-serif (Used for UI, headings, and body text).
- **Monospace**: `DM Mono`, monospace (Used for timestamps, JSON responses, and SEO scores).

## Component Specifications

### 1. Elevated Video Rows
- **Background**: `rgba(30, 27, 75, 0.4)`
- **Border**: `1px solid var(--color-border)`
- **Backdrop Blur**: `12px`
- **Hover State**: Border shifts to `var(--color-primary)`

### 2. Status Badges
- **Processing**: Violet background, pulsing opacity.
- **Transcribing**: Blue-sky border with spinning icon.
- **Ready**: Emerald background, solid white text.
- **Failed**: Red/Destructive outline.

### 3. Video Segment Cards
- Used for displaying Gemini-identified highlights.
- **SEO Score Display**: Large `DM Mono` number in the top-right corner.
- **Reasoning Text**: Muted-foreground with a smaller font size.

### 4. Progress Indicators
- **Track**: `var(--color-muted)`
- **Indicator**: Linear gradient from `var(--color-primary)` to `#c084fc`.

## Icons & Imagery
- Use **Lucide React** for consistent, thin-stroke iconography.
- Loading states should use custom SVG animations reflecting video frames or sound waves.

## Layout Principles
- **Dashboard Grid**: Sidebar-driven layout for desktop, bottom-bar for mobile.
- **Workspace**: 60/40 split between Video Preview and Transcript/Segments list.