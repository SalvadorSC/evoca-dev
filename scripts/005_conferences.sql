-- 005_conferences.sql
-- Phase 2 — Conference Management Core
-- Adds conferences / conference_days / conference_slots and re-points the
-- event_speaker_affiliations FK from organizer_subscriptions to conferences.
-- Applied via Supabase MCP migration `005_conferences`.

-- ─── conferences ──────────────────────────────────────────────────────────────
create table if not exists public.conferences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.organizer_subscriptions(id) on delete set null,
  name            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists conferences_user_id_idx on public.conferences (user_id);
alter table public.conferences enable row level security;
drop policy if exists "conferences_all_own" on public.conferences;
create policy "conferences_all_own" on public.conferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── conference_days ────────────────────────────────────────────────────────────
create table if not exists public.conference_days (
  id            uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  label         text not null,
  date          date,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists conference_days_conf_idx on public.conference_days (conference_id);
alter table public.conference_days enable row level security;
drop policy if exists "conf_days_all_own" on public.conference_days;
create policy "conf_days_all_own" on public.conference_days
  for all using (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.conferences c
    where c.id = conference_id and c.user_id = auth.uid()
  ));

-- ─── conference_slots ───────────────────────────────────────────────────────────
create table if not exists public.conference_slots (
  id          uuid primary key default gen_random_uuid(),
  day_id      uuid not null references public.conference_days(id) on delete cascade,
  title       text not null,
  type        text not null,            -- 'talk'|'keynote'|'workshop'|'lightning'|'break'|'panel'
  start_time  time,
  duration    int not null default 30,  -- minutes
  description text,
  speaker_id  uuid references auth.users(id) on delete set null,
  track       text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists conference_slots_day_idx on public.conference_slots (day_id);
alter table public.conference_slots enable row level security;
drop policy if exists "conf_slots_all_own" on public.conference_slots;
create policy "conf_slots_all_own" on public.conference_slots
  for all using (exists (
    select 1 from public.conference_days d
    join public.conferences c on c.id = d.conference_id
    where d.id = day_id and c.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.conference_days d
    join public.conferences c on c.id = d.conference_id
    where d.id = day_id and c.user_id = auth.uid()
  ));

-- ─── re-point affiliation FK (tables confirmed empty at migration time) ────────
alter table public.event_speaker_affiliations
  drop constraint if exists event_speaker_affiliations_event_id_fkey;
alter table public.event_speaker_affiliations
  add constraint event_speaker_affiliations_event_id_fkey
  foreign key (event_id) references public.conferences(id) on delete cascade;
-- status now allows: 'pending' | 'accepted' | 'declined' | 'revoked' (enforced in app layer)
