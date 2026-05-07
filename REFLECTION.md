# ViralLens — Reflection

## Biggest Challenge: Prompt Engineering

Getting the Groq API to return consistently parseable JSON was harder than expected. The first two prompt versions either returned unstructured text or markdown-wrapped JSON. The breakthrough was combining three things: (1) inline type annotations in the schema, (2) an explicit "no markdown, no backticks" instruction, and (3) a fallback strip in `grok.ts` that handles the rare case where the model still wraps output in code fences. See `/ai-logs/` for the full evolution.

The second prompt challenge was the caption generator. Early versions returned verbose explanations alongside captions, mixing them in a way that was hard to parse. Switching to a structured object with labeled `style` + `text` fields per caption made the response predictable and directly renderable.

The hook analyzer prompt required careful field design. Adding `hookScore`, `hookDiagnosis`, and `hookType` to the same Groq call (rather than a second API call) kept latency low and let us display hook analysis as part of the main result without a secondary loading state.

## All Features Built

**Feature 1 — Platform Selector**: Dropdown for TikTok, Instagram Reels, and YouTube Shorts. The selected platform injects platform-specific weight instructions into the Groq system prompt. Platform is saved to the `analyses` table and displayed as an icon badge on history items.

**Feature 2 — Hashtag & Audio Toolkit**: A separate `POST /api/toolkit` route fires after the main analysis completes. It returns 8–10 platform-tailored hashtags and 3 trending audio style suggestions. The UI renders hashtag chips with a copy-all button and audio suggestion cards with individual copy buttons.

**Feature 3 — Image Upload & Thumbnail Rating**: Text/Image/Video mode toggle in the form. Image mode shows a drag-and-drop upload zone with client-side base64 conversion. Sends to `POST /api/analyze-image` using `meta-llama/llama-4-scout-17b-16e-instruct`. Returns thumbnailScore, colorFeedback, textOverlayFeedback, faceFeedback. Saved to `analyses` table with `type: 'image'`.

**Feature 3b — Video Analysis**: Video upload mode accepts MP4/MOV/WEBM up to 25MB. Client-side first-frame extraction via HTML5 canvas (draw video at t=0 → JPEG base64). `POST /api/analyze-video` runs Groq Whisper transcription and Llama 4 Scout frame analysis in parallel via `Promise.all`, then feeds the transcript through the main text analysis. Result shows dual scores (content score + thumbnail score), full transcript, hook analyzer, visual analysis cards, and combined suggestions.

**Feature 4 — Hook Analyzer Panel**: Purely additive to the existing Groq call — three new fields (`hookScore`, `hookDiagnosis`, `hookType`) added to the prompt schema and TypeScript interface. Hook type displays as a color-coded badge, hook score as a metric card, and hook diagnosis as a highlighted callout.

**Feature 5 — Competitor Comparison**: Two-column layout with score diff indicators (green/red). Metric bars render side-by-side for all four sub-scores. A summary card at the bottom provides plain-English "What they're doing better / What you're doing better" analysis. `POST /api/compare` runs two Groq calls in parallel via `Promise.all`.

**Feature 6 — Landing Page**: Full SaaS-style landing page for unauthenticated users — hero with mock score card, features grid (6 features), how-it-works 3-step flow, and a bottom CTA section. Logged-in users are redirected to `/dashboard` via server-side session check.

**Feature 7 — Mobile Responsiveness**: Audited all screens at 375px. Before/after hook grid stacks to single column on mobile (`grid sm:grid-cols-2`). Competitor comparison metric labels truncate correctly on narrow viewports. History detail panel converts to a full-screen bottom sheet modal on mobile (fixed overlay + bottom-anchored sliding panel) instead of the sidebar layout used on large screens.

## Scope Cuts Made

**Stripe / payment tiers** were mocked. Implementing real billing in a hackathon context would consume time better spent on AI and UI quality.

**Real-time streaming** was skipped. A single `await fetch()` to Groq with a loading skeleton gives better perceived performance than a token-by-token stream for structured JSON — streaming JSON mid-parse creates its own complexity.

## What I'd Build Next

**Trend integration** — pull trending topics from a search API and contextualize the analysis against what's performing well right now.

**Larger video support** — current limit is 25MB (Groq Whisper API constraint). Chunked upload or a dedicated transcription service would support longer videos and higher quality files.

**Score history chart** — show a user's viral score trend over time, turning ViralLens from a single-shot tool into a genuine content improvement platform.

**Team workspaces** — let content teams share analyses, comment, and compare performance across members' content.

## Key Learnings

Prompt design is product design. The shape of the JSON you ask for directly determines what your UI can show. Designing the output schema first and then writing the prompt to produce it is a much cleaner approach than starting with a vague prompt.

The loading skeleton made a bigger UX difference than expected — card-shaped skeletons that match the eventual result layout made the 3–5 second wait feel purposeful rather than empty.

Parallelizing API calls for competitor compare (via `Promise.all`) cut latency roughly in half with no additional frontend complexity.
