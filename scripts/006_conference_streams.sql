-- 006_conference_streams.sql
-- Phase 3 — Public conference page + per-track live streams (layout / embed-ready)
-- Adds publish controls to conferences, a conference_streams table, and
-- anonymous-read RLS so published conferences (and their schedule + streams)
-- are visible without auth. Applied via Supabase MCP migration `006_conference_streams`.

-- ─── conferences: publish controls ──────────────────────────────────────────────
alter table public.conferences add column if not exists slug text;
alter table public.conferences add column if not exists is_public boolean not null default false;
create unique index if not exists conferences_slug_key on public.conferences (slug) where slug is not null;

-- Anonymous (and any) read access to published conferences only.
drop policy if exists "conferences_public_read" on public.conferences;
create policy "conferences_public_read" on public.conferences
  for select using (is_public = true);

-- ─── conference_streams ─────────────────────────────────────────────────────────
-- One row per track stream (track null = conference-level / main feed).
-- `is_featured` marks the stream shown by default on the public page (the
-- "doubled" main stream). provider/video_id are reserved for a future
-- Dailymotion Partner API integration; for now only embed_url is used.
create table if not exists public.conference_streams (
  id            uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  track         text,
  label         text not null,
  embed_url     text,
  provider      text not null default 'dailymotion',
  video_id      text,
  is_featured   boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists conference_streams_conf_idx on public.conference_streams (conference_id);
alter table public.conference_streams enable row level security;

-- Owner full control.
drop policy if exists "conf_streams_all_own" on public.conference_streams;
create policy "conf_streams_all_own" on public.conference_streams
  for all using (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.user_id = auth.uid()
  ));

-- Anonymous read when the parent conference is published.
drop policy if exists "conf_streams_public_read" on public.conference_streams;
create policy "conf_streams_public_read" on public.conference_streams
  for select using (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.is_public = true
  ));

-- ─── public read for schedule (days + slots) of published conferences ─────────────
drop policy if exists "conf_days_public_read" on public.conference_days;
create policy "conf_days_public_read" on public.conference_days
  for select using (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.is_public = true
  ));

drop policy if exists "conf_slots_public_read" on public.conference_slots;
create policy "conf_slots_public_read" on public.conference_slots
  for select using (exists (
    select 1 from public.conference_days d
    join public.conferences c on c.id = d.conference_id
    where d.id = day_id and c.is_public = true
  ));
