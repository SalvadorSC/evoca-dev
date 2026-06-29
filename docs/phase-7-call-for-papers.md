# Phase 7 — Call for Papers (CFP)

> Status: **Scope locked — in progress.**
> Builds directly on Phase 2 `conferences` / `conference_slots` /
> `event_speaker_affiliations`.

---

## Locked decisions (v1)

| # | Decision |
|---|---|
| Submitters | **Anyone with an email** — no account required. Account linked later if they sign up (reuses `linkAffiliationsOnSignup`). |
| Accept flow | **Auto-create an unscheduled slot + pending affiliation** (reuses `assignSpeakerToSlot` pattern). |
| Email provider | **Resend** (`resend` npm + `RESEND_API_KEY`). Cheapest reliable option; also backfills the Phase 2 invite stub at `assign-speaker/route.ts`. |
| Form fields | **Fixed core fields + organizer custom questions.** |
| Custom question types | `short_text`, `long_text`, `select`, `multi_select`, `checkbox`. |
| Review outcomes | **Accept / Reject / Waitlist** (+ `submitted` / `under_review`). |
| Gating | Available to **any organizer that owns the conference** (CFP runs before the event window, so not gated to LIVE access). |
| Public hosting | Slug-based route **`/cfp/[slug]`**. Spam protection v1: honeypot field + per-email submission cap (`max_submissions_per_email`). No external captcha dependency. |
| Review model | **Single reviewer (organizer)** for v1; schema leaves room for multi-reviewer later (see Future suggestions). |

---

## Goal

Let organizers open a public **Call for Papers** for a conference: prospective
speakers submit talk proposals, organizers review and accept/reject them, and
accepted proposals flow into the existing conference schedule + speaker
affiliation system (Phase 2).

---

## Features in this phase (proposed — TBD)

| Feature | Status |
|---|---|
| Public CFP submission page (per conference) | TBD |
| Organizer CFP settings (open/close window, fields, limits) | TBD |
| Submission review dashboard (list, filter, rate, accept/reject) | TBD |
| Accept → create slot + speaker affiliation | TBD |
| Submitter notifications (accepted / rejected / waitlisted) | TBD |
| **Wire transactional email provider** (also backfills Phase 2 invite emails) | TBD |

---

## Proposed data model (draft)

> Not yet migrated. Sketch only — confirm before building.

- **`cfp_settings`** (1:1 with `conferences`): `is_open bool`, `opens_at`,
  `closes_at`, `description`, `max_submissions_per_email`, custom field config.
- **`cfp_submissions`**: `conference_id`, submitter `email` + `name`,
  `title`, `abstract`, `talk_format` (talk/keynote/workshop/lightning),
  `status` (`submitted` | `under_review` | `accepted` | `rejected` |
  `waitlisted`), `rating`, `reviewer_notes`, `created_at`.
- On **accept**: create a `conference_slots` row (unscheduled / unassigned day)
  and an `event_speaker_affiliations` row (`pending`) for the submitter email,
  reusing the Phase 2 invite + signup-linking flow.

---

## Open questions (resolve before implementation)

1. **Who can submit?** Anyone with the public link (email only), or must they
   have an Evoca account first?
2. **Gating:** Is CFP an organizer feature gated behind LIVE/PREP access, or
   available to any paying organizer regardless of event window?
3. ~~**Review model:** Single organizer, or multiple reviewers?~~ **Decided:**
   ship **single-reviewer** (the organizer) for v1. **Multi-reviewer with roles +
   scoring is a desired future enhancement** — see "Future suggestions" below.
   Design the schema so it can extend to multi-reviewer without a breaking change.
4. **Accept → schedule:** Auto-create an unscheduled slot, or just create the
   affiliation and let the organizer place it manually on the timeline?
5. ~~**Notifications:** separate prerequisite?~~ **Decided:** **Phase 7 owns
   wiring the transactional email provider.** Submitter notifications (accepted /
   rejected / waitlisted) and the Phase 2 speaker-invite emails (currently
   stubbed) will both be sent through it.
6. **Public page hosting:** New public route (e.g. `/cfp/[conferenceId]`) vs. a
   shareable slug. Spam/abuse protection (captcha, rate limit)?
7. **Custom questions:** Fixed fields only, or organizer-defined custom fields?

---

## Future suggestions (revisit in later phases — not in v1)

- **Multi-reviewer scoring.** Allow the organizer to invite co-reviewers, each
  scoring submissions independently, with an aggregate/average rating and
  per-reviewer notes. Requires a `cfp_reviewers` table and a `cfp_reviews` table
  (reviewer_id × submission_id), plus RLS that lets invited reviewers see only
  submissions for conferences they're assigned to. v1 schema should leave room
  for this (e.g. keep ratings/notes in a separate concept rather than a single
  column hard-bound to the organizer).
- **Reviewer roles/permissions** (e.g. lead reviewer vs. reviewer; tie-break /
  final-decision authority).
- **Blind review** (hide submitter identity from reviewers to reduce bias).

---

## Dependencies

- Phase 2 schedule + affiliation system (done).
- **Transactional email provider — now in scope for Phase 7** (see decision #5).
  Phase 7 wires it and backfills the Phase 2 speaker-invite emails that are
  currently stubbed.

---

## Definition of Done

- [ ] Schema migrated: `cfp_settings`, `cfp_custom_questions`, `cfp_submissions`, `cfp_submission_answers` (+ RLS).
- [ ] Public `/cfp/[slug]` page: core fields + dynamic custom questions, honeypot, closed/not-found states.
- [ ] Submission API: validates, enforces per-email cap + window, stores answers (admin client, no anon RLS).
- [ ] Organizer CFP settings: enable/disable, open/close window, description, custom question builder.
- [ ] Review dashboard: list + filter by status, rating (1–5), notes, accept/reject/waitlist actions.
- [ ] Accept → unscheduled slot + pending affiliation created (reuses Phase 2 flow).
- [ ] Resend wired: accept/reject/waitlist emails + Phase 2 invite stub backfilled.
- [ ] `features.json` CFP entries marked complete.

## Data model (final)

- **`cfp_settings`** (1:1 conference): `slug` (unique, public URL), `is_open`, `opens_at`, `closes_at`, `title`, `description`, `max_submissions_per_email`.
- **`cfp_custom_questions`**: `conference_id`, `label`, `type`, `options jsonb`, `required`, `sort_order`.
- **`cfp_submissions`**: `conference_id`, `name`, `email`, `title`, `abstract`, `talk_format`, `bio`, `status`, `rating`, `reviewer_notes`.
- **`cfp_submission_answers`**: `submission_id`, `question_id`, `answer jsonb`.
- RLS: organizer-scoped (owns the conference) on all four. Public reads + submission inserts go through server routes using the admin client — no anon policies.
