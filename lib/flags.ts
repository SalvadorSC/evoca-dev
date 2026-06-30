/**
 * lib/flags.ts — feature flags
 *
 * Each flag reads a single environment variable. The variable must be set to
 * the string "true" (case-insensitive) to enable the feature; anything else
 * (including absence) leaves the feature disabled.
 *
 * Usage:
 *   import { DAILYMOTION_ENABLED } from "@/lib/flags"
 *   if (!DAILYMOTION_ENABLED) { ... }
 *
 * To turn on Dailymotion in your environment:
 *   NEXT_PUBLIC_FEATURE_DAILYMOTION=true
 *
 * The NEXT_PUBLIC_ prefix makes the flag available to both server and client
 * bundles, which is required because the flag is read by client components
 * (StreamsSection, PublicConferenceView) as well as server actions.
 */
export const DAILYMOTION_ENABLED =
  process.env.NEXT_PUBLIC_FEATURE_DAILYMOTION?.toLowerCase() === "true"
