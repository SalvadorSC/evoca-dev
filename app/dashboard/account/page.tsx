"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { User, Twitter, Linkedin, Github, Globe, Save, Sparkles, AtSign } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Profile {
  id?: string
  user_id?: string
  display_name: string
  username: string
  bio: string
  twitter: string
  linkedin: string
  github: string
  website: string
  is_pro: boolean
}

const EMPTY: Profile = {
  display_name: "",
  username: "",
  bio: "",
  twitter: "",
  linkedin: "",
  github: "",
  website: "",
  is_pro: false,
}

const USERNAME_RE = /^[a-z0-9_-]{3,32}$/

function validate(profile: Profile): string | null {
  if (!profile.display_name.trim()) return "Display name is required."
  if (profile.username && !USERNAME_RE.test(profile.username))
    return "Username must be 3–32 characters and only contain lowercase letters, numbers, hyphens, or underscores."
  return null
}

function FieldRow({
  icon,
  label,
  value,
  onChange,
  placeholder,
  prefix,
  error,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  prefix?: string
  error?: string | null
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-xs text-jsconf-muted uppercase tracking-wider flex items-center gap-2">
        {icon}
        {label}
      </label>
      <div className={`flex items-center border bg-jsconf-surface focus-within:border-jsconf-yellow transition-colors ${error ? "border-red-500" : "border-jsconf-border"}`}>
        {prefix && (
          <span className="font-mono text-xs text-jsconf-muted px-3 border-r border-jsconf-border bg-jsconf-bg h-10 flex items-center select-none">
            {prefix}
          </span>
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-none border-0 bg-transparent text-white font-sans text-sm placeholder:text-jsconf-muted focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
        />
      </div>
      {error && <p className="font-mono text-[11px] text-red-400">{error}</p>}
      {hint && !error && <p className="font-mono text-[11px] text-jsconf-muted">{hint}</p>}
    </div>
  )
}

type SaveState = "idle" | "saving" | "saved" | "error"

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from("speakers")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (data) setProfile({ ...EMPTY, ...data })
      setLoading(false)
    }
    load()
  }, [])

  const set = (key: keyof Profile) => (v: string) => {
    setProfile((p) => ({ ...p, [key]: v }))
    // Clear field error on change
    setFieldErrors((e) => { const n = { ...e }; delete n[key]; return n })
    if (saveState === "saved" || saveState === "error") setSaveState("idle")
    setServerError(null)
  }

  async function handleSave() {
    const validationError = validate(profile)
    if (validationError) {
      if (validationError.includes("Display name")) {
        setFieldErrors({ display_name: validationError })
      } else if (validationError.includes("Username")) {
        setFieldErrors({ username: validationError })
      }
      return
    }

    setSaveState("saving")
    setServerError(null)
    setFieldErrors({})

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const username = profile.username.trim().toLowerCase() || null

      // Check username uniqueness (only if changed)
      if (username) {
        const { data: existing } = await supabase
          .from("speakers")
          .select("user_id")
          .eq("username", username)
          .neq("user_id", session.user.id)
          .maybeSingle()

        if (existing) {
          setFieldErrors({ username: "This username is already taken." })
          setSaveState("idle")
          return
        }
      }

      const payload = {
        user_id: session.user.id,
        display_name: profile.display_name.trim(),
        username,
        bio: profile.bio.trim(),
        twitter: profile.twitter.trim(),
        linkedin: profile.linkedin.trim(),
        github: profile.github.trim(),
        website: profile.website.trim(),
      }

      const { error: upsertError } = await supabase
        .from("speakers")
        .upsert(payload, { onConflict: "user_id" })

      if (upsertError) {
        setServerError(upsertError.message)
        setSaveState("error")
        return
      }

      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 3000)
    } catch {
      setServerError("Something went wrong.")
      setSaveState("error")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-mono text-xs text-jsconf-muted animate-pulse uppercase tracking-widest">Loading...</span>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-white uppercase tracking-wide">Account</h1>
          <p className="font-mono text-xs text-jsconf-muted mt-1">Your speaker profile and socials.</p>
        </div>
        {profile.is_pro ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            PRO
          </div>
        ) : (
          <button
            onClick={() => alert("Pro upgrade coming soon!")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-jsconf-yellow text-jsconf-yellow font-mono text-xs uppercase tracking-wider hover:bg-jsconf-yellow hover:text-black transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Upgrade to PRO
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {/* Identity */}
        <FieldRow
          icon={<User className="h-3.5 w-3.5" />}
          label="Display name"
          value={profile.display_name}
          onChange={set("display_name")}
          placeholder="Your name as shown to attendees"
          error={fieldErrors.display_name}
        />

        <FieldRow
          icon={<AtSign className="h-3.5 w-3.5" />}
          label="Username"
          value={profile.username ?? ""}
          onChange={set("username")}
          placeholder="your-handle"
          prefix="evoca.live/"
          error={fieldErrors.username}
          hint="3–32 chars. Lowercase letters, numbers, hyphens, underscores."
        />

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs text-jsconf-muted uppercase tracking-wider">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            placeholder="A short bio shown on your feedback page..."
            rows={3}
            className="bg-jsconf-surface border border-jsconf-border text-white font-sans text-sm placeholder:text-jsconf-muted p-3 resize-none focus:outline-none focus:border-jsconf-yellow transition-colors"
          />
        </div>

        {/* Socials */}
        <div className="border-t border-jsconf-border pt-5">
          <p className="font-mono text-[10px] text-jsconf-muted uppercase tracking-widest mb-4">
            Socials — shown on the post-session feedback screen (PRO)
          </p>
          <div className="flex flex-col gap-4">
            <FieldRow
              icon={<Twitter className="h-3.5 w-3.5" />}
              label="X / Twitter"
              value={profile.twitter}
              onChange={set("twitter")}
              prefix="x.com/"
              placeholder="username"
            />
            <FieldRow
              icon={<Linkedin className="h-3.5 w-3.5" />}
              label="LinkedIn"
              value={profile.linkedin}
              onChange={set("linkedin")}
              prefix="linkedin.com/in/"
              placeholder="username"
            />
            <FieldRow
              icon={<Github className="h-3.5 w-3.5" />}
              label="GitHub"
              value={profile.github}
              onChange={set("github")}
              prefix="github.com/"
              placeholder="username"
            />
            <FieldRow
              icon={<Globe className="h-3.5 w-3.5" />}
              label="Website"
              value={profile.website}
              onChange={set("website")}
              placeholder="https://yoursite.com"
            />
          </div>
          {!profile.is_pro && (
            <p className="font-mono text-[10px] text-jsconf-muted mt-3">
              Socials are saved but only shown to attendees on PRO accounts.
            </p>
          )}
        </div>
      </div>

      {/* Save row */}
      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="inline-flex items-center gap-2 px-5 py-3 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 disabled:opacity-60 transition-colors"
        >
          <Save className="h-4 w-4" />
          {saveState === "saving" ? "Saving..." : "Save profile"}
        </button>

        {saveState === "saved" && (
          <span className="font-mono text-xs text-green-400 uppercase tracking-wider">
            Profile saved.
          </span>
        )}
        {(saveState === "error" || serverError) && (
          <span className="font-mono text-xs text-red-400">{serverError ?? "Something went wrong."}</span>
        )}
      </div>
    </div>
  )
}
