-- Phase 1 — Billing Foundation
-- Applied via Supabase MCP migration "004_billing".
-- Kept here for repo record. See docs/phase-1-billing-foundation.md.

-- ─── speakers: billing columns ───────────────────────────────────────────────
alter table public.speakers
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists speaker_plan text not null default 'free';

create unique index if not exists speakers_stripe_customer_id_key
  on public.speakers (stripe_customer_id)
  where stripe_customer_id is not null;

-- ─── organizer_subscriptions ──────────────────────────────────────────────────
-- One row per purchased organizer plan. A user can hold several over time.
--   plan:   'organizer_onetime' | 'organizer_monthly' | 'organizer_annual'
--   status: 'active' | 'pending_activation' | 'expired' | 'cancelled' | 'payment_failed'
-- One-time purchases use event_start/event_end (max 7-day window) + expires_at.
create table if not exists public.organizer_subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id        text,
  stripe_subscription_id    text,
  stripe_payment_intent_id  text,
  plan                      text not null,
  status                    text not null default 'active',
  event_start               timestamptz,
  event_end                 timestamptz,
  activated_at              timestamptz,
  expires_at                timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists organizer_subscriptions_user_id_idx
  on public.organizer_subscriptions (user_id);
create index if not exists organizer_subscriptions_customer_idx
  on public.organizer_subscriptions (stripe_customer_id);
create unique index if not exists organizer_subscriptions_subscription_key
  on public.organizer_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.organizer_subscriptions enable row level security;

drop policy if exists "org_subs_select_own" on public.organizer_subscriptions;
create policy "org_subs_select_own" on public.organizer_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "org_subs_update_own" on public.organizer_subscriptions;
create policy "org_subs_update_own" on public.organizer_subscriptions
  for update using (auth.uid() = user_id);
-- Inserts/writes from the Stripe webhook use the service role (bypasses RLS).

-- ─── event_speaker_affiliations ───────────────────────────────────────────────
-- Links a speaker (by email, then account) to a paid organizer event.
-- Grants the speaker per-event Pro access for the event window only.
create table if not exists public.event_speaker_affiliations (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.organizer_subscriptions(id) on delete cascade,
  speaker_id   uuid references auth.users(id) on delete cascade,
  invited_by   uuid not null references auth.users(id) on delete cascade,
  email        text not null,
  status       text not null default 'pending', -- 'pending' | 'accepted' | 'declined'
  created_at   timestamptz not null default now(),
  unique (event_id, email)
);

create index if not exists affiliations_speaker_idx
  on public.event_speaker_affiliations (speaker_id);
create index if not exists affiliations_email_idx
  on public.event_speaker_affiliations (email);

alter table public.event_speaker_affiliations enable row level security;

drop policy if exists "affiliations_select_own" on public.event_speaker_affiliations;
create policy "affiliations_select_own" on public.event_speaker_affiliations
  for select using (auth.uid() = speaker_id or auth.uid() = invited_by);

drop policy if exists "affiliations_insert_organizer" on public.event_speaker_affiliations;
create policy "affiliations_insert_organizer" on public.event_speaker_affiliations
  for insert with check (auth.uid() = invited_by);

drop policy if exists "affiliations_update_involved" on public.event_speaker_affiliations;
create policy "affiliations_update_involved" on public.event_speaker_affiliations
  for update using (auth.uid() = speaker_id or auth.uid() = invited_by);

drop policy if exists "affiliations_delete_organizer" on public.event_speaker_affiliations;
create policy "affiliations_delete_organizer" on public.event_speaker_affiliations
  for delete using (auth.uid() = invited_by);
