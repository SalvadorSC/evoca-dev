/**
 * lib/storage-keys.ts — Central registry for all localStorage key strings.
 *
 * Using constants prevents typo-driven bugs and makes it trivial to rename
 * a key in one place without grepping the entire codebase.
 */

export const STORAGE_KEYS = {
  /** Set of question IDs the attendee has already voted on. JSON string[]. */
  votedQuestions: "evoca-voted-questions",

  /** The attendee's chosen role on the landing page ("speaker" | "organizer"). */
  role: "evoca-role",

  /** Whether the intro modal has been dismissed. */
  introSeen: "evoca-intro-seen",

  /** Whether the live banner on the attendee app has been dismissed. */
  bannerDismissed: "jsconf-banner-dismissed",

  /** Persistent anonymous token for the attendee (used for feedback dedup). */
  attendeeToken: "evoca-attendee-token",

  /** Persistent user ID for schedule attendance tracking. */
  userId: "evoca-user-id",

  /** Display name chosen by the attendee for attendance visibility. */
  displayName: "evoca-display-name",

  /** Organizer accent color override. */
  organizerAccent: "evoca-organizer-accent",
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
