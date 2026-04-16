"use client"

import { useState, useEffect } from "react"

/**
 * hooks/use-party-room.ts
 *
 * Resolves a PartyKit room name from different sources so consumers don't
 * need to know where the room name comes from.
 *
 * Sources (in priority order):
 *  1. `roomName` — a direct room string (e.g. from a `?room=` URL param).
 *     Used by the attendee app (/app).
 *  2. `sessionId` — a DB session id. The hook fetches `partykit_room` from
 *     Supabase. Used by the speaker Q&A page (/qna/[sessionId]).
 *
 * When both are undefined the hook returns null (not yet resolved) until
 * the caller provides valid input.
 */
export function usePartyRoom(
  roomName?: string | null,
  sessionId?: string | null,
): { room: string | null; loading: boolean; error: string | null } {
  const [room, setRoom] = useState<string | null>(roomName ?? null)
  const [loading, setLoading] = useState(!roomName && !!sessionId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If we already have a direct room name, use it immediately.
    if (roomName) {
      setRoom(roomName)
      setLoading(false)
      return
    }

    // Otherwise, look up the room by sessionId.
    if (!sessionId) return

    let cancelled = false
    setLoading(true)

    async function fetchRoom() {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const { getSessionRoom } = await import("@/lib/db")
        const supabase = createClient()
        const result = await getSessionRoom(supabase, sessionId!)
        if (!cancelled) {
          if (result) {
            setRoom(result)
          } else {
            setError("Session not found")
          }
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load session")
          setLoading(false)
        }
      }
    }

    fetchRoom()
    return () => { cancelled = true }
  }, [roomName, sessionId])

  return { room, loading, error }
}
