# Event-Wide Engagement Metrics — Implementation Plan

> Status: **planned, not built**. Organizer-level view showing which sessions drove the most
> engagement across an entire event. Paid feature (Growth / Scale).
> Last updated: 2026-06-30.

## Goal

For an organizer's conference, a dashboard that ranks and compares sessions:

- **Engagement leaderboard** — sessions ranked by an engagement score (reactions + questions,
  normalized by attendees/duration).
- **Totals across the event** — total reactions, total questions, total attendees,
  average rating.
- **Breakdowns** — by day and by track (both available on `conference_slots`).
- Drill-down → the per-session report from `docs/post-session-analytics-plan.md`.

Availability: **organizer paid tiers** (Growth / Scale). Free and one-time see an upsell.
This is the premium counterpart to per-session analytics (free for all).

## What exists today

- `conferences` → `conference_days` → `conference_slots`. Slots have
  `title, type, track, speaker_id, speaker_email, start_time, duration`.
- `sessions` are the live-talk runtime objects, linked to `talks` (a speaker's personal talk).
- **There is no link between `sessions` and a conference/slot.** A slot only knows the
  *speaker*, not which live session ran for it. This is the core gap for event-wide rollups.

## The core gap

Without a `sessions → conference_slots` relationship we cannot attribute engagement to an
event. We add an explicit FK rather than guessing by speaker + time.

## Design (decided)

1. **Add `conference_slot_id` FK to `sessions`.** When a session is started from a conference
   slot, stamp the slot id. This gives a clean join `sessions → conference_slots →
   conference_days → conferences`, plus per-slot context (track, title) for free.
   - Nullable: standalone speaker sessions (not part of a conference) keep it null.
2. Event-wide metrics are **aggregations** over the per-session data
   (`sessions` aggregates + `session_timeline` + `questions` + `session_feedback`),
   grouped via the new FK.

## Schema changes

```sql
-- Link a live session to the conference slot it was run for (nullable).
alter table public.sessions
  add column conference_slot_id uuid references public.conference_slots(id) on delete set null;
create index on public.sessions (conference_slot_id);
```

- RLS: an organizer can read engagement for sessions whose
  `conference_slot_id → conference_days.conference_id` is a conference they own
  (and, once `docs/multi-admin-plan.md` lands, co-administer). Add a policy that joins through
  the slot/day chain to `conferences.user_id`.

## Where the FK gets set

- During session creation/start from a conference context (verify the exact start path during
  build — likely the "go live" / start-session flow off a conference slot). Stamp
  `conference_slot_id` there.
- Backfill: optional best-effort match for historical sessions by `speaker_id` + schedule
  overlap, run once as a script. Not required for launch.

## App / data changes

- Query helper (extend `lib/analytics.ts`): given a `conference_id`, join sessions via slot,
  aggregate per session (reactions, questions, attendees, rating), compute the engagement
  score, and group by day/track.
- **Plan gate**: reuse the implicit free-tier resolver (see `docs/pricing.md` and `lib/plans.ts`).
  Resolve the conference owner's active plan; event-wide analytics require Growth/Scale.
  Free/one-time get a locked state + upgrade CTA.

## Engagement score

Define a single normalized score so sessions are comparable regardless of size/length, e.g.:

```
score = (reactions + questions * W_Q) / max(peak_attendees, 1)
```

- `W_Q` weights a question heavier than a reaction (questions are higher-effort signal).
- Keep the formula in one place in `lib/analytics.ts` so it's tunable. Document the chosen
  weights when implemented.

## UI

- New view: `app/dashboard/conferences/[id]/analytics` (verify conference dashboard route during
  build). Sections:
  - Headline totals (cards).
  - Engagement leaderboard (bar list / ranked table, sortable).
  - Day and track breakdowns (use the **`charts` skill**).
  - Row click → per-session report.
- Locked/upsell state for non-paid organizers pointing at `/pricing?for=organizer`.

## Touch list

- `scripts/0XX_sessions_conference_slot.sql` (new migration) — FK + index + RLS policy.
- Session start flow — set `conference_slot_id` when launching from a slot.
- `lib/analytics.ts` — event-wide aggregation + engagement score + plan gate.
- Dashboard conference analytics UI + charts.
- `docs/pricing.md` — confirm event-wide analytics as a Growth/Scale feature.

## Dependencies

- Builds on `docs/post-session-analytics-plan.md` (uses `session_timeline` and per-session
  aggregates). Recommended to ship **post-session first**, then this on top.
- Plan gating leans on the implicit free-tier resolver also used by the cap/seat work.

## Open questions

1. Engagement score weights (`W_Q`, attendee normalization) — what feels right to organizers?
2. Should attendees be **unique** per session or **peak concurrent**? (Peak is what we capture;
   unique needs identity tracking we don't have.)
3. Do we expose track/day filters at launch or just the leaderboard + totals?
