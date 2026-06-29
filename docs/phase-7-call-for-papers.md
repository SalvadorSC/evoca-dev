# Phase 7 — Call for Papers (CFP)

> Status: **Draft / Empty plan** — scope not yet locked.
> Blocker: Phase 2 (Conference Management) complete ✅. Builds directly on
> `conferences` + `event_speaker_affiliations`.

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
3. **Review model:** Single organizer, or multiple reviewers with roles +
   scoring? (Affects schema and RLS.)
4. **Accept → schedule:** Auto-create an unscheduled slot, or just create the
   affiliation and let the organizer place it manually on the timeline?
5. **Notifications:** Requires the transactional email provider that Phase 2
   stubbed. Does Phase 7 own wiring that up, or is it a separate prerequisite?
6. **Public page hosting:** New public route (e.g. `/cfp/[conferenceId]`) vs. a
   shareable slug. Spam/abuse protection (captcha, rate limit)?
7. **Custom questions:** Fixed fields only, or organizer-defined custom fields?

---

## Dependencies

- Phase 2 schedule + affiliation system (done).
- Transactional email provider (currently stubbed — see Phase 2 notes). Likely a
  hard prerequisite for the notifications feature.

---

## Definition of Done (to be filled once scope is locked)

- [ ] _TBD after open questions are resolved._
