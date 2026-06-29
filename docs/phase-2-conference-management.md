# Phase 2 — Conference Management Core

> Status: **Complete** ✅
> Blocker: Phase 1 complete (done). Follow-up migrations `005_conferences` + `006_slot_speaker_email` applied.

---

## Goal

Give organizers the tools to build a full conference program: multiple days, typed slots, and speaker assignment. Speaker assignment is the entry point for the affiliation system (speaker gets temporary Pro access scoped to the conference).

---

## Features in this phase

| Feature | Status |
|---|---|
| Conference multi-day scheduling (up to 5 days) | Done |
| Conference slot management | Done |
| Speaker assignment to conference slots | Done |

---

## ⚠️ Implementation notes (as built)

- **Migrations:** `005_conferences` (conferences, conference_days, conference_slots tables + RLS; re-pointed `event_speaker_affiliations.event_id` FK to `conferences`), and `006_slot_speaker_email` (added `conference_slots.speaker_email` for displaying pending invites before the speaker has an account).
- **Data layer:** conference types + queries in `lib/db.ts`; affiliation access logic, slot types (`talk|keynote|workshop|lightning|break|panel`), and `MAX_CONFERENCE_DAYS=5` in `lib/billing.ts`; server-only affiliation helpers (`linkAffiliationsOnSignup`, assign/unassign) in `lib/affiliations.ts`.
- **Server actions:** `app/dashboard/conference/actions.ts` (create/rename/delete conference, add/rename/reorder day, slot CRUD) — all gated through `computeOrganizerAccess` and RLS-scoped.
- **Routes:** list `app/dashboard/conference/page.tsx`, editor `app/dashboard/conference/[id]/page.tsx`, assign API `app/api/conference/assign-speaker/route.ts`.
- **Components:** `conference-list-client.tsx` (paywall-gated create), `conference-editor.tsx` (day tabs + timeline + slot management), `slot-dialog.tsx`, `assign-speaker-dialog.tsx`.
- **Affiliation linking:** invitations match by email; existing accounts link immediately (`accepted`), unknown emails stay `pending` and auto-link on signup via the `/auth/callback` route. Event-scoped Pro is derived at runtime (`hasEventScopedPro`) — it never mutates `speakers.speaker_plan`.
- **Nav:** added an "Events" item to the dashboard sidebar.
- **Email sending** for invitations is stubbed (affiliation row is created; no transactional email provider wired yet) — flagged for a future phase.

---

## ⚠️ Data model revision (decided before build)

The original draft bolted conference data onto `organizer_subscriptions` (adding `name`/`days jsonb`). That conflates **billing** with **product content** and breaks down as soon as a user has multiple events or renews a subscription. Revised approach:

1. **Dedicated `conferences` table.** A conference is owned by a `user_id` and references the `organizer_subscriptions` row that paid for it. Billing stays clean; content lives in its own table.
2. **Normalized days + slots.** Days and slots get their own tables instead of a `jsonb` blob — needed for drag/resize updates, per-slot speaker FKs, and RLS.
3. **Re-point affiliation FK.** `event_speaker_affiliations.event_id` currently FKs to `organizer_subscriptions(id)`. It must point at `conferences(id)` instead, since affiliation is to a conference, not a payment. This is handled in migration `005_conferences`.
4. **Add `'revoked'` to affiliation status.** Phase 1 documented `'pending' | 'accepted' | 'declined'`; Phase 2 needs `'revoked'` for speaker removal.

---

## 2.0 Follow-up migration — `005_conferences` (do first)

```sql
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
create policy "conferences_all_own" on public.conferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── conference_days ────────────────────────────────────────────────────────────
create table if not exists public.conference_days (
  id            uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  label         text not null,          -- "Day 1", renameable
  date          date,                   -- must fall within the event window
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists conference_days_conf_idx on public.conference_days (conference_id);
alter table public.conference_days enable row level security;
-- RLS via parent conference ownership
create policy "conf_days_all_own" on public.conference_days
  for all using (exists (
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
create policy "conf_slots_all_own" on public.conference_slots
  for all using (exists (
    select 1 from public.conference_days d
    join public.conferences c on c.id = d.conference_id
    where d.id = day_id and c.user_id = auth.uid()
  ));

-- ─── re-point affiliation FK + add 'revoked' status ───────────────────────────
alter table public.event_speaker_affiliations
  drop constraint if exists event_speaker_affiliations_event_id_fkey;
-- NOTE: if existing rows reference organizer_subscriptions, migrate or truncate first.
alter table public.event_speaker_affiliations
  add constraint event_speaker_affiliations_event_id_fkey
  foreign key (event_id) references public.conferences(id) on delete cascade;
-- status now allows: 'pending' | 'accepted' | 'declined' | 'revoked' (enforced in app layer)
```

> ⚠️ The FK re-point assumes `event_speaker_affiliations` is empty (no affiliations exist yet — Phase 2 hasn't run). Confirm the table is empty before applying, otherwise migrate `event_id` values first.

---

## 2.1 Multi-day Scheduling
Files: `app/dashboard/conference/[id]/schedule/page.tsx`, `components/conference/day-timeline.tsx`

### UI
- Organizer sees a tab per day (up to 5: "Day 1", "Day 2", … — renameable)
- Each tab shows a vertical timeline for that day
- Day dates must fall within the paying subscription's event window (`event_start`–`event_end`) for one-time plans; unrestricted for monthly/annual
- "Add day" button (disabled at 5)

### Access gating
- Creating/editing schedule structure: pre-event, organizer plan required (else `PaywallModal`)
- Running live sessions: only during the active event window

---

## 2.2 Slot Management
Files: `components/conference/slot-card.tsx`, `components/conference/add-slot-dialog.tsx`

### Slot types
| Type | Assignable speaker | Notes |
|---|---|---|
| Talk | Yes | Standard |
| Keynote | Yes | Featured styling |
| Workshop | Yes | — |
| Lightning Talk | Yes | Short format |
| Break | No | Time block only |
| Panel | Yes (multiple) | Multi-speaker — Phase 2.2 supports single FK; multi-speaker deferred |

### Slot fields
Maps to `conference_slots`: `title` (req), `type` (req), `start_time`, `duration`, `description`, `speaker_id` (nullable), `track`, `sort_order`.

### UI interactions
- Click empty timeline area → "Add slot" dialog pre-filled with that time
- Drag slot to move (updates `start_time`/`sort_order`)
- Drag slot edge to resize (updates `duration`)
- Click slot → edit dialog

---

## 2.3 Speaker Assignment
Files: `components/conference/assign-speaker-dialog.tsx`, `app/api/conference/assign-speaker/route.ts`

### Flow
1. Organizer opens a slot → "Assign Speaker"
2. Types an email address
3. **Email matches existing account:** link to slot, insert `event_speaker_affiliations` with `status: 'accepted'` and `event_id = conferences.id`. Speaker gains event-scoped Pro access.
4. **No matching account:** send invitation email (template TBD), insert affiliation `status: 'pending'`. On signup with that email → auto-accept and link.

### Affiliation effect (unchanged logic, re-scoped to conference)
- `status: 'accepted'` → speaker's account gains Pro features scoped to the conference
- Access evaluated at runtime via the conference's paying subscription window: `event_start <= now() <= event_end` (or active recurring subscription)
- No change to `speaker_plan` on the speakers row — purely event-scoped (handled in `lib/billing.ts`)

### Edge cases
- Already affiliated → show existing status, no duplicate (enforced by `unique (event_id, email)`)
- Speaker removed from slot → affiliation `status: 'revoked'`, access removed, slot unassigned
- Speaker declines → `status: 'declined'`, slot back to unassigned

---

## Definition of Done

- [ ] `005_conferences` migration applied; affiliation FK points at `conferences`
- [ ] Organizer can create a conference with 1–5 named days
- [ ] Each day shows a timeline with add/edit/move/resize for slots
- [ ] All slot types render with correct styling
- [ ] Organizer can assign a speaker by email to any slot
- [ ] Existing users: affiliation created immediately, Pro access active during event window
- [ ] New users: invitation email sent, affiliation linked on signup
- [ ] Removing a speaker from a slot revokes affiliation (`status: 'revoked'`)
- [ ] Schedule editing is blocked (`PaywallModal`) for users without an organizer plan
- [ ] `lib/billing.ts` extended to grant event-scoped Pro access from accepted affiliations
- [ ] `features.json` feat-006, feat-007, feat-008 marked complete
