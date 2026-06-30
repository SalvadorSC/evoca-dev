# Evoca Automated Tests

Two layers:

1. **Unit tests** (Vitest) — fast, deterministic checks over the app's pure
   business logic. No database, network, or browser.
2. **E2E tests** (Playwright) — browser smoke tests over the critical user
   flows against the running dev server.

Together they guard the rules and flows the rest of the app depends on so we
don't break core behavior between changes.

## Running

```bash
pnpm test           # unit tests, run once (CI mode)
pnpm test:watch     # unit tests, watch mode while developing
pnpm test:coverage  # unit tests + coverage (80% gate on lib/ business logic)

pnpm test:e2e       # Playwright E2E (reuses the running dev server)
pnpm test:e2e:ui    # Playwright interactive UI mode
```

### Coverage gate

`pnpm test:coverage` enforces **80%** (statements/branches/functions/lines) over
the pure business-logic modules in `lib/` (see `coverage.include` in
`vitest.config.ts`). SDK/server-bound files (Supabase admin, Stripe, Next server
APIs) and browser-only modules (pdf.js/canvas) are intentionally excluded so the
gate stays honest and enforceable.

## What's covered

| Test file                         | Module under test     | Test-plan area |
| --------------------------------- | --------------------- | -------------- |
| `unit/billing.test.ts`            | `lib/billing.ts`      | Billing & access (organizer tiers, event windows, speaker affiliation Pro, conference-talk lifecycle, window validation) |
| `unit/plans.test.ts`              | `lib/plans.ts`        | Billing (plan catalog integrity, live flags, price formatting) |
| `unit/locale.test.ts`             | `lib/locale.ts`       | Billing (EUR/USD currency selection by country) |
| `unit/dailymotion.test.ts`        | `lib/dailymotion.ts`  | Streams / public conference page (URL & id parsing, embed URL) |
| `unit/remote-token.test.ts`       | `lib/remote-token.ts` | Presentation & remote control (signed token mint/verify, tampering) |
| `unit/email.test.ts`              | `lib/email.ts`        | Email templates (CFP accept/reject/waitlist subjects & bodies) |
| `unit/anon-id.test.ts`            | `lib/anon-id.ts`      | Anonymous attendee identity (generation, persistence, reuse) |
| `unit/lib-misc.test.ts`           | `lib/utils.ts`, `lib/storage-keys.ts`, `lib/party.ts`, `lib/sessions.ts` | Shared helpers (classnames, storage keys, party room ids, session helpers) |

### E2E (Playwright, `tests/e2e/*.spec.ts`)

Auth uses pre-saved storage state: `auth.setup.ts` signs in each seeded account
**once** (serially) and saves cookies under `tests/e2e/.auth/`. Test projects
reuse that state, which avoids the magic-link token race that occurs when many
parallel workers hit `/api/dev-login` for the same email.

| Test file                      | Flow covered |
| ------------------------------ | ------------ |
| `e2e/auth.setup.ts`            | Authenticates `organizer-live`, `free`, `affiliated-speaker`; saves storage state |
| `e2e/public.spec.ts`          | Landing page, login page + dev-account panel, public conference page, unknown slug → 404 |
| `e2e/features-public.spec.ts` | Public conference page (stream/schedule/track switch), theme switcher (feat-011), pricing (feat-023), Pro waitlist real flow — empty/valid/duplicate states (feat-020), CFP public submission real flow — renders/validation/confirmation (feat-021) |
| `e2e/features-authed.spec.ts` | Account profile + plan (feat-004/005), Stripe upgrade (feat-010, smoke), conference scheduling/slots/speakers (feat-006/007/008), speaker portal (feat-009), slides upload + embed (feat-013/014), CFP organizer area (feat-021), Q&A history (feat-022) |
| `e2e/features-live.spec.ts`   | Phone remote invalid-token gate (feat-015). Realtime moderation (feat-016/017/018) is intentionally **not** here — it needs two synchronized PartyKit clients and is tracked as Manual |
| `e2e/dashboard.spec.ts`       | Dashboard navigation, protected-route redirect, free-account upgrade affordance |
| `e2e/helpers.ts`              | Account keys, `statePath()`, `devLogin()` (setup-only), seeded public conference + open CFP slugs |

E2E tests depend on the **dev server** (`NODE_ENV=development`, for the
dev-login bypass) and **seeded test accounts** (`scripts/seed-test-accounts.mjs`)
plus the seeded published conference and an open CFP (`e2e-open-cfp`).

Where a flow's success path would otherwise write to the database (waitlist
sign-up, CFP proposal), the test drives the **real form and client-side
validation** but mocks only the final `POST` response via `page.route`, so every
UI state (error / success / duplicate) is asserted deterministically without
polluting data.

These map to the areas tracked in `docs/evoca-test-plan.xlsx`. Features were
evaluated case-by-case: realtime multi-client moderation, live presenter
rendering, Stripe completion, and visual/responsive/a11y judgment remain
**Manual** because a single-browser assertion would give false confidence.

## Conventions

- Tests live in `tests/**/*.test.ts` and import app code via the `@/` alias
  (configured in `vitest.config.ts` to mirror `tsconfig.json`).
- Logic that depends on "now" accepts an injectable `now: Date`, so window/time
  tests pass a fixed date and never flake.
- `server-only`-marked modules are unit-testable: the runner stubs that guard
  package via `tests/stubs/server-only.ts`.

## Adding tests

When you add or change a **pure** function in `lib/`, add cases here. For new
DB-backed or UI behavior, add a row to `docs/evoca-test-plan.xlsx` instead.
