# ViralLens — AI Content Virality Analyzer

> Know if your content will go viral — before you post.

**Live demo:** [virallens.vercel.app](https://virallens.vercel.app) <!-- replace with your URL -->

---

## What It Does

ViralLens is an AI-powered content intelligence tool for short-form creators. Paste a caption, upload a thumbnail or post image, or drop a video — and get a full virality breakdown in seconds.

### Features

- **Virality Score (0–100)** — Overall viral potential with detailed breakdown
- **Hook Analyzer** — Detects hook type, scores the opening, rewrites it stronger
- **Metric Breakdown** — Hook strength, emotional engagement, clarity, retention potential
- **Thumbnail / Post Rating** — Upload any image and get scored on color, contrast, emotion, and text overlay
- **Video Analysis** — AI transcribes audio, rates the hook, scores the first frame
- **Trending Audio Picks** — 3 platform-matched audio style recommendations per analysis
- **Hashtag Toolkit** — Platform-specific hashtag sets, copy individually or all at once
- **Caption Generator** — 3 alternative captions in different styles (curiosity, bold, story-led)
- **Competitor Compare** — Side-by-side score comparison with "what they're doing better" summary
- **Platform-aware scoring** — Weights shift for TikTok, Instagram Reels, and YouTube Shorts
- **Full history** — Every analysis saved, searchable, filterable, with detail expand panel
- **Dark / Light mode** — Persisted theme toggle

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth + DB | Supabase (Auth + PostgreSQL + RLS) |
| AI — Text | Groq API · `llama-3.3-70b-versatile` |
| AI — Vision | Groq API · `meta-llama/llama-4-scout-17b-16e-instruct` |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

### 1. Clone the repo

```bash
git clone https://github.com/YOURUSERNAME/virallens.git
cd virallens
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

### 4. Set up the database

Run this SQL in your Supabase SQL Editor:

```sql
create table public.analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  result jsonb not null,
  platform text,
  type text default 'text',
  created_at timestamptz default now() not null
);

alter table public.analyses enable row level security;

create policy "Users can insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can view own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);

create index analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
virallens/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── api/
│   │   ├── analyze/route.ts        # Text analysis
│   │   ├── analyze-image/route.ts  # Image / thumbnail rating
│   │   ├── analyze-video/route.ts  # Video transcription + analysis
│   │   ├── captions/route.ts       # Alternative caption generator
│   │   ├── toolkit/route.ts        # Hashtags + audio suggestions
│   │   └── compare/route.ts        # Competitor comparison
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── AnalyzeForm.tsx
│   ├── history/
│   │   ├── page.tsx
│   │   └── HistoryClient.tsx
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   └── globals.css
├── components/
│   ├── Navbar.tsx
│   ├── ThemeToggle.tsx
│   ├── ScoreGauge.tsx
│   ├── MetricCard.tsx
│   ├── SuggestionList.tsx
│   ├── AnalysisSkeleton.tsx
│   ├── EmptyState.tsx
│   └── Toast.tsx
├── lib/
│   ├── supabase.ts
│   └── supabase-server.ts
├── types/
│   └── index.ts
└── public/
    ├── logo-light.png
    ├── logo-dark.png
    └── og-image.png
```

---

## AI Prompt Evolution

The Groq system prompt went through 3 major versions — full documentation in [`/ai-logs/`](./ai-logs/).

Key iterations:
- **v1** — Basic JSON schema, scores were inflated (avg ~72), markdown fences broke parsing
- **v2** — Added explicit score calibration anchors, platform-specific weight injection, client-side fence stripping
- **v3** — Added `hookScore`, `hookDiagnosis`, `hookType` fields, locked enum values, eliminated field-drop hallucination

---

## Deployment

### Deploy to Vercel (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import repository → select `virallens`
3. Add environment variables in Vercel dashboard → Settings → Environment Variables
4. Deploy

Every `git push` to `main` triggers an automatic redeploy.

---

## Built For

This project was built for **Build a Go Viral Clone — AI Content Virality Analyzer** · May 2026

---

## License

MIT
