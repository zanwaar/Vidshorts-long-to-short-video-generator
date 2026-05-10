# Theme System: ViralClip AI

## Purpose
This file defines the visual system and AI agent rules for the landing experience of ViralClip AI, an AI-powered long-form to short-form video generator.

## Brand Direction
- Product name: `ViralClip AI`
- Positioning: premium AI studio for creators, agencies, and media teams
- Tone: sharp, cinematic, technical, confident
- Visual mood: dark control room, neon editorial highlights, premium SaaS clarity

## Theme Tokens

### Colors
- Background: deep charcoal and blue-black surfaces
- Primary: electric violet for key actions
- Accent: cyan for motion, analytics, and system signals
- Highlight: warm amber for ROI, pricing emphasis, and urgency
- Text: bright neutral white with softened secondary copy
- Borders: low-contrast luminous lines, never flat gray

### Typography
- Sans: `Inter`
- Heading style: bold, tight, slightly condensed feeling through tracking and sizing
- Body style: clear, product-focused, compact paragraph widths
- Numeric emphasis: large mono-like or tabular-feeling layouts for metrics, durations, and pricing

### Layout
- Default page background must be dark
- Sections should use strong horizontal rhythm with generous spacing
- Content width should stay readable, usually centered around `max-w-6xl` to `max-w-7xl`
- Use layered panels, gradients, soft borders, and blur instead of flat cards

### Motion
- Prefer subtle glow, hover lift, and opacity transitions
- Avoid exaggerated animation loops
- Motion should reinforce a tool/product feeling, not a marketing-template feeling

## Component Rules

### Header
- Sticky header with translucent dark surface
- Include product wordmark, section navigation, and primary CTA
- Keep nav labels short and task-oriented

### Hero
- Must communicate core value in one pass:
  turn long recordings into viral shorts quickly
- Include:
  headline, supporting copy, proof points, CTA cluster, and visual/product preview
- Hero visuals should suggest workflow, analytics, captions, and clip extraction

### Features
- Show concrete benefits, not vague AI claims
- Each feature card should describe an outcome and the mechanism behind it
- Use icons sparingly but consistently

### Pricing
- Highlight one recommended plan
- Emphasize operational value, not only credits
- Include what happens after upload: transcript, highlights, captions, exports

### Footer
- Include product summary, key navigation, legal placeholders, and concise trust messaging

## Agent Rules For Future UI Work
- Always preserve dark theme as the default experience unless the user explicitly asks otherwise.
- Do not introduce generic white backgrounds for primary sections.
- Prefer cinematic gradients, glass panels, and layered depth over plain boxed layouts.
- Keep branding consistent as `ViralClip AI`.
- Hero copy should stay product-specific to video repurposing, not generic AI automation.
- Pricing, CTA, and feature sections should clearly target creators, teams, and agencies.
- When adding new sections, maintain the existing color token family instead of inventing unrelated hues.
- Use existing ShadCN-style local components where practical, but do not force components that weaken the visual direction.
- Avoid filler testimonials or fake company logos unless the user explicitly requests them.
- Any dashboard-like preview should feel plausible for a real video workflow: upload, transcript, highlight selection, render, export.
