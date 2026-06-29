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
pnpm test          # unit tests, run once (CI mode)
pnpm test:watch    # unit tests, watch mode while developing

pnpm test:e2e      # Playwright E2E (reuses the running dev server)
pnpm test:e2e:ui   # Playwright interactive UI mode
```

## What's covered

| Test file                         | Module under test     | Test-plan area |
| --------------------------------- | --------------------- | -------------- |
| `unit/billing.test.ts`            | `lib/billing.ts`      | Billing & access (organizer tiers, event windows, speaker affiliation Pro, conference-talk lifecycle, window validation) |
| `unit/plans.test.ts`              | `lib/plans.ts`        | Billing (plan catalog integrity, live flags, price formatting) |
| `unit/locale.test.ts`             | `lib/locale.ts`       | Billing (EUR/USD currency selection by country) |
| `unit/dailymotion.test.ts`        | `lib/dailymotion.ts`  | Streams / public conference page (URL & id parsing, embed URL) |
| `unit/remote-token.test.ts`       | `lib/remote-token.ts` | Presentation & remote control (signed token mint/verify, tampering) |

### E2E (Playwright, `tests/e2e/*.spec.ts`)

| Test file              | Flow covered |
| ---------------------- | ------------ |
| `e2e/public.spec.ts`   | Landing page renders, login page + dev-account panel, public conference page (stream + schedule + live marker), unknown slug → 404 |
| `e2e/dashboard.spec.ts`| Dev-login auth, dashboard navigation (Talks/Events/Account), protected-route redirect to `/login`, free-account upgrade affordance |
| `e2e/helpers.ts`       | Shared `devLogin()` (uses `/api/dev-login`) + seeded public conference slug |

E2E tests depend on the **dev server** (`NODE_ENV=development`, for the
dev-login bypass) and **seeded test accounts** (`scripts/seed-test-accounts.mjs`)
plus the seeded published conference. If the seed is cleared, the public
conference test skips itself rather than failing.

These map to the areas tracked in `docs/evoca-test-plan.xlsx`. The manual test
plan and browser QA still cover deeper flows, RLS, realtime (PartyKit), and
Stripe webhooks.

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
