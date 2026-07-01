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

/** Phone remote controller (mint token, QR code in presenter view).
 *  Set NEXT_PUBLIC_FEATURE_PHONE_CONTROLLER=true to enable. */
export const PHONE_CONTROLLER_ENABLED =
  process.env.NEXT_PUBLIC_FEATURE_PHONE_CONTROLLER?.toLowerCase() === "true"

/** PDF slide extraction and display.
 *  Set NEXT_PUBLIC_FEATURE_PDF=true to enable. */
export const PDF_ENABLED =
  process.env.NEXT_PUBLIC_FEATURE_PDF?.toLowerCase() === "true"

/** PowerPoint (PPTX) slide extraction and display.
 *  Set NEXT_PUBLIC_FEATURE_PPT=true to enable. */
export const PPT_ENABLED =
  process.env.NEXT_PUBLIC_FEATURE_PPT?.toLowerCase() === "true"

/** Call for Papers (CFP) — public submission form + organizer review.
 *  Set NEXT_PUBLIC_FEATURE_CFP=true to enable. */
export const CFP_ENABLED =
  process.env.NEXT_PUBLIC_FEATURE_CFP?.toLowerCase() === "true"
