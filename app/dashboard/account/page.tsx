"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { User, Twitter, Linkedin, Github, Globe, Save, Sparkles, AtSign, CheckCircle2 } from "lucide-react"
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
  plan: "free" | "pro"
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
  plan: "free",
}

// ─── Plan features ────────────────────────────────────────────────────────────
const FREE_FEATURES = [
  "Up to 3 active talks",
  "Live reactions & Q&A",
  "Evoca branding on session page",
]

const PRO_FEATURES = [
  "Unlimited talks",
  "Advanced analytics & engagement stats",
  "Custom branding — remove Evoca watermark",
  "Social links shown on feedback screen",
  "Priority support",
]

function PlanCard({
  title,
  price,
  features,
  isCurrent,
  isUpgrade,
  onAction,
  accent,
}: {
  title: string
  price: string
  features: string[]
  isCurrent: boolean
  isUpgrade: boolean
  onAction?: () => void
  accent: string
}) {
  return (
    <div
      className={`flex-1 border p-5 flex flex-col gap-4 transition-colors ${
        isCurrent ? `border-[${accent}]` : "border-jsconf-border"
      }`}
      style={isCurrent ? { borderColor: accent } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white text-lg">{title}</span>
            {isCurrent && (
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5"
                style={{ background: accent, color: title === "Pro" ? "#000" : "#fff" }}
              >
                Current
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-jsconf-muted mt-0.5">{price}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: accent }} />
            <span className="font-sans text-sm text-white/80">{f}</span>
          </li>
        ))}
      </ul>

      {!isCurrent && onAction && (
        <button
          onClick={onAction}
          className="w-full font-mono text-xs font-bold uppercase tracking-wider py-2.5 border-2 transition-colors"
          style={{
            borderColor: accent,
            color: isUpgrade ? "#000" : accent,
            background: isUpgrade ? accent : "transparent",
          }}
          onMouseEnter={(e) => {
            if (!isUpgrade) {
              e.currentTarget.style.background = accent
              e.currentTarget.style.color = "#000"
            }
          }}
          onMouseLeave={(e) => {
            if (!isUpgrade) {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = accent
            }
          }}
        >
          {isUpgrade ? "Upgrade to Pro" : "Downgrade to Free"}
        </button>
      )}
    </div>
  )
}

function PlanSection({ isPro }: { isPro: boolean }) {
  const [notice, setNotice] = useState<string | null>(null)

  function handleUpgrade() {
    setNotice("Pro plan via Stripe is coming soon. You'll be notified when it's available.")
  }

  function handleDowngrade() {
    setNotice("To downgrade, please contact support@evoca.live and we'll process it within 24 hours.")
  }

  return (
    <div className="border-t border-jsconf-border pt-8 mt-8">
      <div className="mb-5">
        <h2 className="font-display font-bold text-white uppercase tracking-wide text-lg">Plan</h2>
        <p className="font-mono text-xs text-jsconf-muted mt-1">
          You are currently on the{" "}
          <span className="text-white font-bold">{isPro ? "Pro" : "Free"}</span> plan.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <PlanCard
          title="Free"
          price="$0 / month"
          features={FREE_FEATURES}
          isCurrent={!isPro}
          isUpgrade={false}
          onAction={isPro ? handleDowngrade : undefined}
          accent="#888"
        />
        <PlanCard
          title="Pro"
          price="Coming soon"
          features={PRO_FEATURES}
          isCurrent={isPro}
          isUpgrade={true}
          onAction={!isPro ? handleUpgrade : undefined}
          accent="#F7E018"
        />
      </div>

      {notice && (
        <p className="font-mono text-xs text-jsconf-muted mt-4 border border-jsconf-border px-4 py-3 leading-relaxed">
          {notice}
        </p>
      )}
    </div>
  )
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
        {profile.is_pro && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            PRO
          </div>
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

      <PlanSection isPro={profile.is_pro} />
    </div>
  )
}
