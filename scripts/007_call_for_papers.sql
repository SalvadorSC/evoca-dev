-- 007_call_for_papers.sql
-- Phase 7 — Call for Papers (CFP)
-- Public proposal submission + organizer review, building on Phase 2
-- (conferences / conference_slots / event_speaker_affiliations).
-- Applied via Supabase MCP migration `007_call_for_papers`.

-- ─── cfp_settings (1:1 with conferences) ────────────────────────────────────────
create table if not exists public.cfp_settings (
  id                          uuid primary key default gen_random_uuid(),
  conference_id               uuid not null unique references public.conferences(id) on delete cascade,
  slug                        text not null unique,           -- public URL: /cfp/[slug]
  is_open                     boolean not null default false,
  opens_at                    timestamptz,
  closes_at                   timestamptz,
  title                       text not null default 'Call for Papers',
  description                 text,
  max_submissions_per_email   int not null default 3,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index if not exists cfp_settings_conf_idx on public.cfp_settings (conference_id);
alter table public.cfp_settings enable row level security;
drop policy if exists "cfp_settings_all_own" on public.cfp_settings;
create policy "cfp_settings_all_own" on public.cfp_settings
  for all using (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.user_id = auth.uid()
  ));

-- ─── cfp_custom_questions ───────────────────────────────────────────────────────
create table if not exists public.cfp_custom_questions (
  id            uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  label         text not null,
  type          text not null,            -- short_text|long_text|select|multi_select|checkbox
  options       jsonb,                    -- string[] for select/multi_select
  required      boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists cfp_questions_conf_idx on public.cfp_custom_questions (conference_id);
alter table public.cfp_custom_questions enable row level security;
drop policy if exists "cfp_questions_all_own" on public.cfp_custom_questions;
create policy "cfp_questions_all_own" on public.cfp_custom_questions
  for all using (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.user_id = auth.uid()
  ));

-- ─── cfp_submissions ────────────────────────────────────────────────────────────
create table if not exists public.cfp_submissions (
  id            uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  name          text not null,
  email         text not null,
  title         text not null,
  abstract      text not null,
  talk_format   text not null default 'talk', -- talk|keynote|workshop|lightning
  bio           text,
  status        text not null default 'submitted', -- submitted|under_review|accepted|rejected|waitlisted
  rating        int,                          -- 1..5
  reviewer_notes text,
  slot_id       uuid references public.conference_slots(id) on delete set null, -- set on accept
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists cfp_submissions_conf_idx on public.cfp_submissions (conference_id);
create index if not exists cfp_submissions_email_idx on public.cfp_submissions (lower(email));
alter table public.cfp_submissions enable row level security;
-- Organizer-only access. Public submissions are inserted via the admin client
-- in a server route (validated there), so no anon insert policy is needed.
drop policy if exists "cfp_submissions_all_own" on public.cfp_submissions;
create policy "cfp_submissions_all_own" on public.cfp_submissions
  for all using (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.user_id = auth.uid()
  ));

-- ─── cfp_submission_answers ─────────────────────────────────────────────────────
create table if not exists public.cfp_submission_answers (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.cfp_submissions(id) on delete cascade,
  question_id   uuid not null references public.cfp_custom_questions(id) on delete cascade,
  answer        jsonb,                    -- string | string[]
  created_at    timestamptz not null default now()
);
create index if not exists cfp_answers_submission_idx on public.cfp_submission_answers (submission_id);
alter table public.cfp_submission_answers enable row level security;
drop policy if exists "cfp_answers_all_own" on public.cfp_submission_answers;
create policy "cfp_answers_all_own" on public.cfp_submission_answers
  for all using (exists (
    select 1 from public.cfp_submissions s
    join public.conferences c on c.id = s.conference_id
    where s.id = submission_id and c.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.cfp_submissions s
    join public.conferences c on c.id = s.conference_id
    where s.id = submission_id and c.user_id = auth.uid()
  ));
