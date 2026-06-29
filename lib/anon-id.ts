/**
 * lib/anon-id.ts — stable per-browser anonymous identifier.
 *
 * Used as the `authorId` on questions so moderators can ban a specific author
 * even when they post anonymously. For signed-in users we prefer their Supabase
 * user id (passed separately); this anon id is the fallback for everyone else.
 *
 * Reuses the existing persistent attendee token key so we don't create a second
 * competing identifier.
 */
import { STORAGE_KEYS } from "@/lib/storage-keys"

/**
 * Returns a stable anonymous id for this browser, creating and persisting one
 * on first use. Safe to call on the client only; returns an ephemeral id during
 * SSR (no localStorage) which will be replaced on the client.
 */
export function getAnonId(): string {
  if (typeof window === "undefined") return "ssr-anon"
  try {
    let id = localStorage.getItem(STORAGE_KEYS.attendeeToken)
    if (!id) {
      id = `anon_${crypto.randomUUID()}`
      localStorage.setItem(STORAGE_KEYS.attendeeToken, id)
    }
    return id
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to ephemeral id.
    return `anon_${crypto.randomUUID()}`
  }
}
