# Post-Session Analytics — Implementation Plan

> Status: **planned, not built**. Per-session report shown after every talk:
> engagement over time, top questions, and reaction peaks.
> Last updated: 2026-06-30.

## Goal

After a talk ends, the speaker/organizer sees a report for that session:

- **Engagement over time** — a curve of reactions + questions across the talk's duration.
- **Reaction peaks** — the moments with the highest reaction rate (the "this landed" spikes).
- **Top questions** — most-upvoted questions, plus answered/unanswered split.
- Supporting headline stats — total reactions, total questions, peak concurrent attendees,
  average rating (from `session_feedback`).

Availability: **all tiers, including free** (the event-wide view in
`docs/event-engagement-plan.md` is the paid counterpart).

## What exists today

- `sessions` — `id, talk_id, title, scheduled_at, ended_at, status, question_count,
  reaction_count, allow_reactions, allow_questions, partykit_room, …`. Only **aggregate**
  counts are persisted; no time series.
- `questions` — `id, session_id, text, author_name, votes, answered, created_at`. Persisted,
  so "top questions" is available from existing data.
- `session_feedback` — `id, session_id, attendee_token, rating, comment, created_at`.
- Reactions are **ephemeral**: they live only in the PartyKit room's in-memory state and are
  never timestamped or stored individually. This is the core gap.

## The core gap

There is **no time-series data** for reactions or questions. To draw "engagement over time"
and find "reaction peaks", the PartyKit room must flush time-bucketed counts to the database.

## Design (decided)

1. **PartyKit writes time-bucketed counts** to a new `session_timeline` table.
   - The room maintains in-memory counters per fixed bucket (e.g. **10s** buckets).
   - On a periodic flush (every ~10s) and on session end, it POSTs the closed buckets to an
     authenticated Next.js endpoint, which inserts rows. Low write volume, crash-resilient
     (only the current open bucket can be lost), and supports a future live view.
2. The post-session report is a **static report** computed from persisted data and viewed in
   the dashboard after the session ends. No live querying required for v1.

## Schema changes

```sql
-- New: per-bucket engagement time series for a session.
create table public.session_timeline (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  bucket_start  timestamptz not null,           -- start of the time bucket
  reactions     integer not null default 0,     -- reactions in this bucket
  questions     integer not null default 0,     -- questions created in this bucket
  created_at    timestamptz not null default now(),
  unique (session_id, bucket_start)
);
create index on public.session_timeline (session_id, bucket_start);
```

- Optionally add `peak_attendees integer` to `sessions` (max concurrent attendee-role
  connections), captured by the same flush — useful headline stat and aligns with the
  attendee-cap work in `docs/attendee-cap-plan.md`.
- RLS: timeline rows are readable by the session's owner (via `sessions.talk_id → talks.user_id`)
  and, once `docs/multi-admin-plan.md` lands, by conference admins. Writes happen only through
  the service-role server endpoint, never from the client.

## PartyKit changes (`server-patches/server.ts`)

- Maintain `bucketCounters: Map<bucketStart, {reactions, questions}>` in room state.
- Increment the current bucket whenever a reaction / new question is handled.
- `flushTimeline()` on an interval and in the session-end path: POST closed buckets to
  `POST /api/sessions/[id]/timeline` with the room's shared secret (same auth pattern the
  server already uses for persistence). Server upserts into `session_timeline`.
- Also report `peak_attendees` (reuse the attendee-role connection count from the cap work).

## App / API changes

- `POST /api/sessions/[id]/timeline` — service-role insert/upsert of buckets (auth via room secret).
- `GET` data layer for the report: aggregate `session_timeline` into a curve, derive peaks
  (top N buckets by reaction rate), pull top questions from `questions` (order by `votes`),
  and feedback summary from `session_feedback`.

## UI

- New report at `app/dashboard/talks/[slug]/sessions/[sessionId]/analytics` (or a tab on the
  existing session detail view — verify current route structure during build).
- Use the **`charts` skill** (shadcn + Recharts) for the engagement curve (area/line) and a
  small bar list for top questions. Mark reaction-peak buckets on the curve.
- Headline stat cards: total reactions, total questions, peak attendees, avg rating.
- Empty state for sessions that ended before timeline capture shipped (graceful: show
  aggregate counts only, no curve).

## Touch list

- `scripts/0XX_session_timeline.sql` (new migration) — table + RLS + index.
- `server-patches/server.ts` — bucket counters, periodic + end flush.
- `app/api/sessions/[id]/timeline/route.ts` (new) — authenticated writer.
- Data/query helper (e.g. `lib/analytics.ts`) — curve, peaks, top questions, feedback summary.
- Dashboard report UI + chart components (charts skill).
- `docs/pricing.md` — note post-session analytics is live for all tiers once built.

## Edge cases

- **Legacy sessions** (ended before this ships) have no timeline → show aggregates only.
- **Lost open bucket** on crash → acceptable; at most ~10s of data.
- **Clock/skew** — bucket by server receipt time, not client time.
- **Very long sessions** — fixed bucket size keeps row counts bounded and predictable.
- **Reactions disabled** (`allow_reactions=false`) → curve uses questions only.

## Open questions

1. Bucket size: 10s (smoother peaks, more rows) vs 30s (cheaper)?
2. Should the report be visible to **speakers** for their own talk, organizers only, or both?
3. Do we capture `peak_attendees` now (couples to cap work) or defer it?
