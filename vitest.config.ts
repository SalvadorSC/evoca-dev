import { defineConfig } from "vitest/config"
import path from "node:path"

/**
 * Vitest configuration for Evoca's unit test suite.
 *
 * Scope: fast, deterministic unit tests over pure business logic in `lib/`
 * (billing access tiers, plan pricing, event-window validation, Dailymotion
 * parsing, currency selection, remote-control tokens). These map directly to
 * the areas in docs/evoca-test-plan.xlsx and guard against regressions in the
 * rules that the rest of the app depends on.
 *
 * DB-backed code (Supabase admin queries) and React components are intentionally
 * out of scope here — those are covered by the manual test plan and browser QA.
 */
export default defineConfig({
  resolve: {
    alias: {
      // Mirror the tsconfig "@/*" -> project root path alias.
      "@": path.resolve(__dirname, "."),
      // `server-only` is a guard package that throws in client bundles; in the
      // test runner we stub it to a no-op so server-marked modules can import.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Playwright E2E specs (tests/e2e/*.spec.ts) are run by Playwright, not Vitest.
    exclude: ["tests/e2e/**", "node_modules/**"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      // Scope coverage to the pure business-logic modules in lib/. SDK/server
      // bound files (Supabase admin, Stripe, Next server APIs) and browser-only
      // modules (pdf.js/canvas) can't be meaningfully unit-covered and are
      // excluded so the gate stays honest and enforceable.
      include: [
        "lib/billing.ts",
        "lib/plans.ts",
        "lib/locale.ts",
        "lib/dailymotion.ts",
        "lib/remote-token.ts",
        "lib/email.ts",
        "lib/utils.ts",
        "lib/anon-id.ts",
        "lib/storage-keys.ts",
        "lib/party.ts",
        "lib/sessions.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
})
