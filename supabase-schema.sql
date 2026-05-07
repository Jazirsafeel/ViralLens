-- Run this in Supabase SQL editor

create table if not exists public.analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  content     text not null,
  result      jsonb not null,
  platform    text,
  type        text default 'text',
  created_at  timestamptz default now()
);

-- If table already exists, run these migrations:
-- ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS platform text;
-- ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS type text DEFAULT 'text';

-- RLS: users can only see their own analyses
alter table public.analyses enable row level security;

create policy "Users can insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can read own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

-- Index for fast user queries
create index analyses_user_id_idx on public.analyses(user_id);

-- Allow users to delete their own analyses (needed for history page delete button)
create policy "Users can delete own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);
