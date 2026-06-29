# Transactional Emails

All transactional email is sent through **Resend** via `lib/email.ts`.

## How it works

- `sendEmail({ to, subject, html, replyTo })` is the single low-level sender.
- The Resend client is created **lazily**. If `RESEND_API_KEY` is not set, every
  send becomes a logged no-op (`{ sent: false, skipped: true }`) — the app keeps
  working and CFP/invite actions never fail because email is unconfigured.
- All callers send **best-effort**: failures are caught and logged, never thrown,
  so an email problem can't roll back a database action.

## Configuration

| Env var | Purpose | Default |
|---|---|---|
| `RESEND_API_KEY` | Enables sending. Unset = no-op. | — |
| `CFP_EMAIL_FROM` | `From` address/name. | `Evoca <onboarding@resend.dev>` |

> For production, set `CFP_EMAIL_FROM` to a verified domain sender
> (e.g. `Evoca <hello@yourdomain.com>`), otherwise Resend's shared
> `onboarding@resend.dev` sender is used (fine for testing only).

## Design system

Every template is wrapped in one shared `shell()` so they stay on-brand and
consistent. Tokens mirror `app/globals.css` (inlined because email clients strip
`<style>` and CSS variables):

- Brand yellow `#F7E018`, background `#080808`, surface `#111111`, border `#2a2a2a`
- **Sharp 0px corners** (matches `--radius: 0`)
- Mono `EVOCA.` wordmark with a 4px yellow accent bar
- Mono uppercase CTA buttons; no emoji
- Helpers: `button(href, label)` and `detailBox([[label, value]])`

## Email types

| # | Template fn | Trigger | Recipient | Subject |
|---|---|---|---|---|
| 1 | `cfpConfirmationEmail` | A proposal is submitted (`POST /api/cfp/submit`) | Submitter | We received your submission to {conference} |
| 2 | `cfpAcceptEmail` | Organizer accepts a submission (CFP review board) | Submitter | Your talk was accepted for {conference} |
| 3 | `cfpWaitlistEmail` | Organizer waitlists a submission | Submitter | Your submission to {conference} is waitlisted |
| 4 | `cfpRejectEmail` | Organizer declines a submission | Submitter | Update on your submission to {conference} |
| 5 | `speakerInviteEmail` | Speaker assigned to a slot (`/api/conference/assign-speaker`) — also the Phase 2 backfill | Invited speaker | You've been added as a speaker for {conference} |

### Notes per template

- **Confirmation (1)** — includes a `detailBox` summary (talk + format) and sets
  expectations that a decision email will follow. No CTA.
- **Accept (2)** & **Invite (5)** — branch on `hasAccount`: existing users get a
  "View in dashboard" CTA; new emails get a "Set up your account" CTA pointing at
  signup. This mirrors the accept→slot+affiliation flow.
- **Waitlist (3)** — neutral accent, no action required.
- **Reject (4)** — uses the muted accent bar (not yellow) to soften the message.

## Adding a new email

1. Add a `xxxEmail(opts): { subject, html }` factory in `lib/email.ts` using
   `shell()` + the shared helpers.
2. Call it from the relevant route/server action wrapped in try/catch with
   `sendEmail(...)`.
3. Add a row to the table above.
