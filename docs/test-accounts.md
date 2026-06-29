# Test Accounts

A catalogue of seeded test accounts covering every billing and role state, plus
how to log in as each one in development.

> These accounts exist **only in the connected Supabase project's auth + DB**.
> They use the `@evoca.test` domain and are passwordless (magic-link / dev bypass).

---

## Seeding

Accounts are created/refreshed by an **idempotent** script — re-running updates
existing rows instead of duplicating them:

```bash
node --env-file-if-exists=/vercel/share/.env.project scripts/seed-test-accounts.mjs
```

What it seeds for each account: an `auth.users` row (email confirmed), a
`speakers` profile, an `organizer_subscriptions` row (where applicable), and —
for the affiliated speaker — a `conferences` + `conference_days` +
`conference_slots` + `event_speaker_affiliations` chain owned by
`organizer-live`.

---

## Logging in (development only)

Two ways, both bypassing real email:

1. **Login page switcher** — go to `/login`; the "Dev only" panel lists every
   account. Click one to sign in.
2. **Direct URL** — `GET /api/dev-login?as=<key>` (omit `?as=` for the `owner`
   account). This generates a magic-link token and consumes it server-side via
   `/auth/confirm`, setting session cookies reliably.

Both are gated behind `NODE_ENV === 'development'` and return 404 in production.

---

## The accounts

| Key | Email | Role / plan | Expected access |
|---|---|---|---|
| `free` | test.free@evoca.test | Free speaker, no plan | Free features only; creating a conference triggers the paywall |
| `speaker-pro` | test.speakerpro@evoca.test | Speaker Pro subscription | Speaker Pro features unlocked |
| `organizer-live` | test.orglive@evoca.test | Organizer, **active monthly** sub | Full **LIVE** organizer access (unlimited). Owns the seeded "Evoca Test Conf 2026" |
| `organizer-onetime-live` | test.onetime.live@evoca.test | One-time, window = now | **LIVE** access (within event window) |
| `organizer-onetime-prep` | test.onetime.prep@evoca.test | One-time, window in future | **PREP** only — can set up, cannot present / run reactions / Q&A |
| `organizer-onetime-unset` | test.onetime.unset@evoca.test | One-time, no window chosen | **PREP** only |
| `organizer-expired` | test.expired@evoca.test | Cancelled subscription | **NONE** — content locked, paywall on gated actions |
| `organizer-grace` | test.grace@evoca.test | Subscription `payment_failed` | **PREP** grace access |
| `both` | test.both@evoca.test | Speaker Pro **and** active annual organizer | Full access in both speaker & organizer surfaces |
| `affiliated-speaker` | test.affiliated@evoca.test | Free speaker, **accepted** invite to `organizer-live`'s live conference | Event-scoped Pro (derived at runtime; `speaker_plan` stays `free`) |

---

## Access-state reference

These map to `computeOrganizerAccess` / `accessFromSub` in `lib/billing.ts`:

- **LIVE** — present, reactions, Q&A, full conference management.
- **PREP** — conference setup only; no live/presenting features.
- **NONE** — no paid access; gated actions open the paywall.

Subscription plans (`organizer_monthly`, `organizer_annual`): `active` ⇒ LIVE,
`payment_failed` ⇒ PREP (grace), `cancelled`/`expired` ⇒ NONE.

One-time plan (`organizer_onetime`): LIVE only while `now` is inside
`[event_start, event_end]`; before the window or with no window ⇒ PREP; after
the window or `cancelled`/`expired` ⇒ NONE.

Affiliated speakers get event-scoped Pro via `hasEventScopedPro` when they hold
an `accepted` affiliation to a conference whose organizer is currently LIVE.

---

## Notes / caveats

- **Invitation emails are not sent** (Phase 2 stubs transactional email). The
  affiliation row is created directly; `affiliated-speaker` is pre-`accepted`.
- Re-running the seed **deletes and recreates** each account's speaker,
  subscription, and (for `organizer-live`) conference rows. Don't point it at a
  database with real users sharing these emails.
- To add a new case: add an entry to `ACCOUNTS` in
  `scripts/seed-test-accounts.mjs`, mirror it in `TEST_ACCOUNTS` in
  `app/api/dev-login/route.ts` and `DEV_ACCOUNTS` in `app/login/page.tsx`, then
  re-run the seed.
