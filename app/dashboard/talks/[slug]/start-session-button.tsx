"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Radio, Settings, MessageSquare, Smile, HelpCircle, Droplets, Lock, ChevronDown, ChevronUp } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface Props {
  talkId: string
  speakerIsPro?: boolean
}

interface SessionSettings {
  allow_reactions: boolean
  allow_text_reactions: boolean
  allow_questions: boolean
  show_watermark: boolean
}

const DEFAULT_SETTINGS: SessionSettings = {
  allow_reactions: true,
  allow_text_reactions: true,
  allow_questions: true,
  show_watermark: true,
}

function SettingRow({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  lockedReason,
}: {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
  lockedReason?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-jsconf-border last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <span className="text-jsconf-muted mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-white uppercase tracking-wide">{label}</span>
            {disabled && <Lock className="h-3 w-3 text-jsconf-yellow shrink-0" />}
          </div>
          <p className="font-sans text-xs text-jsconf-muted mt-0.5 leading-relaxed">
            {disabled && lockedReason ? lockedReason : description}
          </p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={disabled ? undefined : onCheckedChange}
        disabled={disabled}
        className="shrink-0 mt-0.5"
      />
    </div>
  )
}

export function StartSessionButton({ talkId, speakerIsPro = false }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<SessionSettings>(DEFAULT_SETTINGS)

  const set = (key: keyof SessionSettings) => (v: boolean) =>
    setSettings((s) => ({ ...s, [key]: v }))

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push("/login"); return }

      const roomId = `evoca-${talkId.slice(0, 8)}-${Date.now().toString(36)}`

      const { error: insertError } = await supabase.from("sessions").insert({
        talk_id: talkId,
        partykit_room: roomId,
        scheduled_at: new Date().toISOString(),
        status: "active",
        allow_reactions: settings.allow_reactions,
        allow_text_reactions: settings.allow_text_reactions && settings.allow_reactions,
        allow_questions: settings.allow_questions,
        show_watermark: speakerIsPro ? settings.show_watermark : true,
      })

      if (insertError) { setError(insertError.message); return }

      const { data: newSession, error: fetchError } = await supabase
        .from("sessions")
        .select("id")
        .eq("partykit_room", roomId)
        .single()

      if (fetchError || !newSession) {
        setError("Session created but could not navigate. Please refresh.")
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
    <div className="flex flex-col items-end gap-2 shrink-0">
      {showSettings && (
        <div className="w-80 border border-jsconf-border bg-jsconf-surface p-4 shadow-xl">
          <p className="font-mono text-[10px] text-jsconf-muted uppercase tracking-widest mb-1">
            Session settings
          </p>
          <p className="font-sans text-xs text-jsconf-muted mb-4">
            These apply for the duration of this session.
          </p>

          <SettingRow
            icon={<Smile className="h-4 w-4" />}
            label="Reactions"
            description="Allow attendees to send emoji reactions."
            checked={settings.allow_reactions}
            onCheckedChange={(v) => {
              set("allow_reactions")(v)
              if (!v) set("allow_text_reactions")(false)
            }}
          />
          <SettingRow
            icon={<MessageSquare className="h-4 w-4" />}
            label="Text reactions"
            description="Allow attendees to attach text to reactions."
            checked={settings.allow_text_reactions && settings.allow_reactions}
            onCheckedChange={set("allow_text_reactions")}
            disabled={!settings.allow_reactions}
            lockedReason="Enable reactions first."
          />
          <SettingRow
            icon={<HelpCircle className="h-4 w-4" />}
            label="Questions"
            description="Allow attendees to submit and vote on questions."
            checked={settings.allow_questions}
            onCheckedChange={set("allow_questions")}
          />
          <SettingRow
            icon={<Droplets className="h-4 w-4" />}
            label="EVOCA watermark"
            description="Show the EVOCA branding on the present view."
            checked={settings.show_watermark}
            onCheckedChange={(v) => {
              if (!speakerIsPro) return // not applied; UI shows lock
              set("show_watermark")(v)
            }}
            disabled={!speakerIsPro}
            lockedReason="Upgrade to PRO to hide the watermark."
          />
        </div>
      )}

      <div className="flex items-stretch gap-0">
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 border border-r-0 border-jsconf-border text-jsconf-muted hover:text-white hover:border-jsconf-muted transition-colors font-mono text-xs uppercase tracking-wider"
          title="Session settings"
        >
          <Settings className="h-3.5 w-3.5" />
          {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <button
          onClick={handleStart}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-3 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Radio className="h-4 w-4" />
          {loading ? "Starting..." : "Start Session"}
        </button>
      </div>

      {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
    </div>
  )
}
