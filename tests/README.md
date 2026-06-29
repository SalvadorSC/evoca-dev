# Evoca Automated Tests

Fast, deterministic **unit tests** over the app's pure business logic. They run
in milliseconds with no database, network, or browser, and guard the rules the
rest of the app depends on so we don't break core behavior between changes.

## Running

```bash
pnpm test        # run once (CI mode)
pnpm test:watch  # watch mode while developing
```

## What's covered

| Test file                         | Module under test     | Test-plan area |
| --------------------------------- | --------------------- | -------------- |
| `unit/billing.test.ts`            | `lib/billing.ts`      | Billing & access (organizer tiers, event windows, speaker affiliation Pro, conference-talk lifecycle, window validation) |
| `unit/plans.test.ts`              | `lib/plans.ts`        | Billing (plan catalog integrity, live flags, price formatting) |
| `unit/locale.test.ts`             | `lib/locale.ts`       | Billing (EUR/USD currency selection by country) |
| `unit/dailymotion.test.ts`        | `lib/dailymotion.ts`  | Streams / public conference page (URL & id parsing, embed URL) |
| `unit/remote-token.test.ts`       | `lib/remote-token.ts` | Presentation & remote control (signed token mint/verify, tampering) |

These map to the areas tracked in `docs/evoca-test-plan.xlsx`. The manual test
plan and browser QA still cover end-to-end flows, RLS, realtime (PartyKit),
Stripe webhooks, and React components — those are intentionally **out of scope**
for this unit layer.

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
