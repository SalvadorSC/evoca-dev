"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Radio } from "lucide-react"

export function StartSessionButton({ talkId }: { talkId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      // Generate the room name locally — do NOT rely on .select() after insert
      // because RLS blocks the read-back and .single() returns empty data silently.
      const roomId = `lw-${talkId.slice(0, 8)}-${Date.now().toString(36)}`

      const { error: insertError } = await supabase
        .from("sessions")
        .insert({
          talk_id: talkId,
          partykit_room: roomId,
          scheduled_at: new Date().toISOString(),
        })

      if (insertError) {
        setError(insertError.message)
        return
      }

      // Now fetch the session we just inserted by its unique room name
      const { data: newSession, error: fetchError } = await supabase
        .from("sessions")
        .select("id")
        .eq("partykit_room", roomId)
        .single()

      if (fetchError || !newSession) {
        setError("Session created but could not navigate to it. Please refresh.")
        return
      }

      router.push(`/present/${newSession.id}`)
    } catch {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5 shrink-0">
      <button
        onClick={handleStart}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-3 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Radio className="h-4 w-4" />
        {loading ? "Starting..." : "Start New Session"}
      </button>
      {error && (
        <p className="font-mono text-[10px] text-red-400">{error}</p>
      )}
    </div>
  )
}
