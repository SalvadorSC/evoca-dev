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
    globals: true,
  },
})
