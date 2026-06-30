"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronDown, QrCode, Trophy } from "lucide-react"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { InteractivePhoneMockup, HeroBackground } from "@/components/shared/phone-mockup"
import { Logo } from "@/components/shared/logo"
import type { LiveItem, WaveAnimation } from "@/components/shared/phone-mockup"
import { ReducedMotionToggle } from "@/components/shared/wave-background"
import { OrganizerPricing } from "@/components/landing/organizer-pricing"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import { useIsMobile } from "@/hooks/use-mobile"

// ─── Design Tokens ────────────────────────────────────────────────────────────
const ROLES = {
  speaker: {
    accent: "#F7E018",
    accentDim: "rgba(247, 224, 24, 0.12)",
    accentText: "#000",
    wipeDirection: "left" as const,
    label: "I'm a Speaker",
    action: "I'm giving a talk"
  },
  organizer: {
    accent: "#F7E018",
    accentDim: "rgba(247, 224, 24, 0.12)",
    accentText: "#000",
    wipeDirection: "right" as const,
    label: "I'm an Organizer",
    action: "I want to host an event"
  }
}

const ORGANIZER_ACCENTS = [
  { label: "Yellow", value: "#F7E018" },
  { label: "Green", value: "#00E887" },
  { label: "Teal", value: "#00E8E0" },
]

// Convert a hex accent into a dim rgba(…, 0.12) for backgrounds.
function accentDim(hex: string): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0.12)`
}

type Role = "speaker" | "organizer"

// ─── Split Hero ───────────────────────────────────────────────────────────────
function SplitHero({ onSelectRole }: { onSelectRole: (role: Role) => void }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Center logo - absolutely positioned */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-jsconf-bg px-4 py-3 hidden lg:block">
        <Logo size="sm" />
      </div>

      {/* Mobile logo */}
      <div className="lg:hidden py-6 flex justify-center border-b border-jsconf-border">
        <Logo size="sm" />
      </div>

      {/* Speaker side */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-jsconf-border relative">
        <div className="max-w-md text-center lg:text-left">
          <p className="font-mono text-xs text-jsconf-muted uppercase tracking-widest mb-2">I&apos;m a</p>
          <h1 className="font-display font-bold text-foreground text-5xl lg:text-6xl xl:text-7xl mb-4">Speaker</h1>
          <p className="font-sans text-jsconf-muted text-base lg:text-lg mb-8">
            Turn any talk into a live experience
          </p>
          <button
            onClick={() => onSelectRole("speaker")}
            className="font-mono text-sm font-bold uppercase tracking-wide px-6 py-3 border-2 border-jsconf-yellow text-jsconf-yellow hover:bg-jsconf-yellow hover:text-jsconf-bg transition-colors"
          >
            Get started free →
          </button>
        </div>
      </div>

      {/* Organizer side */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative">
        <div className="max-w-md text-center lg:text-left">
          <p className="font-mono text-xs text-jsconf-muted uppercase tracking-widest mb-2">I&apos;m an</p>
          <h1 className="font-display font-bold text-foreground text-5xl lg:text-6xl xl:text-7xl mb-4">Organizer</h1>
          <p className="font-sans text-jsconf-muted text-base lg:text-lg mb-8">
            One platform for your schedule, speakers and live engagement
          </p>
          <button
            onClick={() => onSelectRole("organizer")}
            className="font-mono text-sm font-bold uppercase tracking-wide px-6 py-3 border-2 border-jsconf-yellow text-jsconf-yellow hover:bg-jsconf-yellow hover:text-jsconf-bg transition-colors"
          >
            Get started free →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function Nav({ role, onSwitchRole }: { role: Role; onSwitchRole: () => void }) {
  const otherRole: Role = role === "speaker" ? "organizer" : "speaker"
  const otherAccent = ROLES[otherRole].accent

  return (
    <nav className="sticky top-0 z-50 bg-jsconf-bg/95 backdrop-blur border-b border-jsconf-border px-6 py-4 flex items-center justify-between">
      <Logo size="sm" />
      <div className="flex items-center gap-4">
        <Link
          href="/pricing"
          className="font-mono text-xs text-jsconf-muted hover:text-foreground transition-colors hidden sm:inline"
        >
          Pricing
        </Link>
        <button
          onClick={onSwitchRole}
          className="role-switch-btn font-mono text-xs font-bold px-3 py-2 border-2 transition-colors hidden sm:inline-block"
          style={{
            "--switch-accent": otherAccent,
            "--switch-accent-text": ROLES[otherRole].accentText,
            borderColor: otherAccent,
            color: otherAccent,
          } as React.CSSProperties}
        >
          {ROLES[otherRole].action} →
        </button>
        <Link
          href="/login"
          className="font-mono text-sm font-bold px-4 py-2 transition-opacity hover:opacity-90 hidden sm:inline-block"
          style={{ backgroundColor: ROLES[role].accent, color: ROLES[role].accentText }}
        >
          Get started free →
        </Link>
        <div className="hidden sm:block">
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  )
}



// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, description, badge }: { icon: string; title: string; description: string; badge?: string }) {
  return (
    <div className="bg-jsconf-surface border-l-[3px] p-5" style={{ borderLeftColor: "var(--accent)" }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {badge && (
          <span className="font-mono text-[10px] px-2 py-0.5 border" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-display font-bold text-foreground text-base mb-1">{title}</h3>
      <p className="font-sans text-sm text-jsconf-muted leading-relaxed whitespace-pre-line">{description}</p>
    </div>
  )
}

// ─── Pro Waitlist Form ─────────────────────────────���──────────────────────────
function ProWaitlistForm() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.")
      setState("error")
      return
    }
    setState("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })
      if (res.ok) {
        setState("done")
      } else {
        const body = await res.json().catch(() => ({}))
        setErrorMsg(body.error ?? "Something went wrong.")
        setState("error")
      }
    } catch {
      setErrorMsg("Something went wrong.")
      setState("error")
    }
  }

  if (state === "done") {
    return (
      <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--accent)" }}>
        You&apos;re on the list. We&apos;ll reach out when Pro launches.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row w-full">
        <input
          type="email"
          aria-label="Email address for Speaker Pro waitlist"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle") }}
          placeholder="your@email.com"
          className="flex-1 min-w-0 bg-jsconf-surface border border-jsconf-border text-foreground font-sans text-sm placeholder:text-jsconf-muted px-3 h-9 focus:outline-none focus:border-jsconf-muted transition-colors sm:border-r-0"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="font-mono text-xs text-jsconf-muted border border-jsconf-border px-4 h-9 hover:text-foreground hover:border-jsconf-muted transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {state === "loading" ? "..." : "Notify me"}
        </button>
      </div>
      {state === "error" && (
        <p className="font-mono text-[11px] text-red-400">{errorMsg}</p>
      )}
    </form>
  )
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="divide-y divide-jsconf-border">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
          >
            <span className="font-sans text-foreground">{item.q}</span>
            <ChevronDown className={`w-5 h-5 text-jsconf-muted transition-transform shrink-0 ml-4 ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && (
            <p className="font-sans text-jsconf-muted text-sm pb-4 leading-relaxed">{item.a}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Speaker Experience ───────────────────────────────────────────────────────
function SpeakerExperience({ waveAnimation }: { waveAnimation: WaveAnimation }) {
  const isMobile = useIsMobile()
  // On phones, "See it live" sends visitors to the guided story tour instead
  // of the desktop-oriented demo page.
  const demoHref = isMobile ? "/demo/tour" : "/demo"
  const [heroItems, setHeroItems] = useState<LiveItem[]>([])

  const handleActivity = useCallback((item: LiveItem) => {
    setHeroItems((prev) => [...prev.slice(-6), item])
  }, [])

  const speakerFAQ = [
    { q: "Do attendees need an account?", a: "No, they scan a QR and they're in." },
    { q: "What happens to Q&A after the talk?", a: "When you end a session, the questions are saved to your dashboard under the talk's Q&A History." },
    { q: "Does it work with my existing slides?", a: "Yes — PPTX, PDF, or Slides.com link." },
    { q: "Is it really free?", a: "Yes, 5 talks free forever. No credit card needed. See full pricing for what's included." },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative px-6 py-4 lg:py-12 overflow-hidden min-h-[480px]">
        <HeroBackground items={heroItems} accentColor="var(--wave-color, var(--accent))" waveAnimation={waveAnimation} />
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1">
            <h1 className="font-display font-bold text-foreground text-4xl lg:text-5xl xl:text-6xl mb-6 leading-tight">
              Turn any talk into a live experience
            </h1>
            <p className="font-sans text-jsconf-muted text-lg lg:text-xl mb-8 leading-relaxed">
              Slides, live reactions, Q&A and analytics — all in one place. Your audience participates, you stay in control.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="font-mono text-sm font-bold px-6 py-3 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
              >
                Start for free →
              </Link>
              <Link
                href={demoHref}
                className="font-mono text-sm font-bold px-6 py-3 border-2 text-foreground hover:bg-white/5 transition-colors"
                style={{ borderColor: "var(--accent)" }}
              >
                See it live →
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0 hidden lg:block">
            <InteractivePhoneMockup onActivity={handleActivity} currentItems={heroItems} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 border-t border-jsconf-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon="🔥"
              title="Live reactions + Q&A"
              description={"Your audience reacts in real time.\nQuestions are upvoted to the top."}
            />
            <FeatureCard
              icon="📊"
              title="Post-session analytics"
              description={"Engagement over time, top questions\nand reaction peaks after every talk."}
              badge="PAID"
            />
            <FeatureCard
              icon="📱"
              title="No sign-up for attendees"
              description={"Attendees join by scanning a QR.\nNo app, no account, no friction."}
            />
            <FeatureCard
              icon="🆓"
              title="Free to start"
              description={"5 talks free forever.\nUpgrade only when you need more."}
            />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-8 bg-jsconf-surface border-y border-jsconf-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <span
            className="inline-flex items-center gap-1.5 font-mono text-sm font-bold px-3 py-1"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
          >
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            Winner — JSConf España 2026 Hackathon
          </span>
          <span className="font-sans text-sm text-jsconf-muted">Built at JSConf. Loved by the community.</span>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border p-6" style={{ borderColor: "var(--accent)" }}>
              <h3 className="font-display font-bold text-foreground text-xl mb-3">Free</h3>
              <p className="font-sans text-jsconf-muted text-sm leading-relaxed">
                5 talks · Live Wall watermark · Core features
              </p>
            </div>
            <div className="border border-jsconf-border p-6">
              <h3 className="font-display font-bold text-foreground text-xl mb-3">Speaker Pro</h3>
              <p className="font-sans text-jsconf-muted text-sm leading-relaxed mb-4">
                Coming soon — unlimited talks, analytics, no watermark
              </p>
              <ProWaitlistForm />
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/pricing"
              className="font-mono text-sm font-bold uppercase tracking-wider text-foreground border-b-2 pb-0.5 hover:opacity-70 transition-opacity"
              style={{ borderColor: "var(--accent)" }}
            >
              See full pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 border-t border-jsconf-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-foreground text-2xl mb-8">FAQ</h2>
          <FAQ items={speakerFAQ} />
        </div>
      </section>
    </div>
  )
}

// ─── Organizer Experience ──────────────────────────────────────────────────���──
function OrganizerExperience({ waveAnimation }: { waveAnimation: WaveAnimation }) {
  const isMobile = useIsMobile()
  // On phones, "See it live" sends visitors to the guided story tour instead
  // of the desktop-oriented demo page.
  const demoHref = isMobile ? "/demo/tour" : "/demo"
  const [heroItems, setHeroItems] = useState<LiveItem[]>([])

  const handleActivity = useCallback((item: LiveItem) => {
    setHeroItems((prev) => [...prev.slice(-6), item])
  }, [])

  const organizerFAQ = [
    { q: "How do I invite speakers?", a: "Send a link or email. They set up their own talks." },
    { q: "Can I brand it with my event colors?", a: "Coming soon." },
    { q: "How many attendees can join?", a: "Unlimited on all plans." },
    { q: "Do I need technical setup?", a: "No. Create event, invite speakers, share the link." },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative px-6 py-16 lg:py-12 overflow-hidden min-h-[480px]">
        <HeroBackground items={heroItems} accentColor="var(--wave-color, var(--accent))" waveAnimation={waveAnimation} />
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1">
            <h1 className="font-display font-bold text-foreground text-4xl lg:text-5xl xl:text-6xl mb-6 leading-tight">
              One platform for your schedule, speakers and live engagement
            </h1>
            <p className="font-sans text-jsconf-muted text-lg lg:text-xl mb-8 leading-relaxed">
              Manage your event, onboard speakers and give every session live engagement — without the Slido price tag.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="font-mono text-sm font-bold px-6 py-3 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
              >
                Set up your event →
              </Link>
              <Link
                href={demoHref}
                className="font-mono text-sm font-bold px-6 py-3 border-2 text-foreground hover:bg-white/5 transition-colors"
                style={{ borderColor: "var(--accent)" }}
              >
                See it live →
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0 hidden lg:block">
            <InteractivePhoneMockup onActivity={handleActivity} currentItems={heroItems} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-jsconf-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon="📅"
              title="Schedule management"
              description={"Build your event schedule.\nAttendees see it live and plan their day."}
            />
            <FeatureCard
              icon="🎤"
              title="Speaker onboarding"
              description={"Invite speakers by email or join link.\nThey set up their own talks in minutes."}
            />
            <FeatureCard
              icon="🔥"
              title="Live Wall for every session"
              description={"Every talk gets reactions, Q&A and a\nprojector wall automatically."}
            />
            <FeatureCard
              icon="📊"
              title="Engagement metrics"
              description={"See which sessions drove the most\nengagement across your entire event."}
            />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-8 bg-jsconf-surface border-y border-jsconf-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <span
            className="inline-flex items-center gap-1.5 font-mono text-sm font-bold px-3 py-1"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
          >
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            Winner — JSConf España 2026 Hackathon
          </span>
          <span className="font-sans text-sm text-jsconf-muted">Built at JSConf. Loved by the community.</span>
        </div>
      </section>

      {/* Pricing */}
      <OrganizerPricing />

      {/* FAQ */}
      <section className="px-6 py-16 border-t border-jsconf-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-foreground text-2xl mb-8">FAQ</h2>
          <FAQ items={organizerFAQ} />
        </div>
      </section>
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="px-6 py-8 border-t border-jsconf-border">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="font-sans text-sm text-jsconf-muted">Built by Salvador Sanchez</p>
        <div className="flex items-center gap-6">
          <Link href="/demo" className="font-mono text-xs text-jsconf-muted hover:text-foreground transition-colors">Demo</Link>
          <Link href="/login" className="font-mono text-xs text-jsconf-muted hover:text-foreground transition-colors">Login</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Dev Color Toggle ─────────────────────────────────────────────────────────
function DevColorToggle({ onColorChange }: { onColorChange: (color: string) => void }) {
  const [active, setActive] = useState(ORGANIZER_ACCENTS[0].value)

  return (
    <div className="fixed bottom-6 left-6 z-[9999] bg-jsconf-surface-2 border border-jsconf-border rounded-full px-3 py-2 flex items-center gap-2">
      <span className="font-mono text-[10px] text-red-500 font-bold">DEV</span>
      {ORGANIZER_ACCENTS.map((accent) => (
        <button
          key={accent.value}
          onClick={() => {
            setActive(accent.value)
            onColorChange(accent.value)
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors"
          style={{
            border: active === accent.value ? `1px solid ${accent.value}` : "1px solid transparent"
          }}
        >
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: accent.value }}
          />
          <span className="font-mono text-[10px] text-jsconf-muted">{accent.label}</span>
        </button>
      ))}
    </div>
  )
}



// ─── Main Landing Content ────────────────────────────────────────��────────────
function LandingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize role synchronously from the URL on the first client render so
  // `?role=speaker` never flashes the <SplitHero> chooser before swapping.
  const urlRoleParam = searchParams.get("role")
  const initialRole: Role | null =
    urlRoleParam === "speaker" || urlRoleParam === "organizer" ? urlRoleParam : null

  const [role, setRole] = useState<Role | null>(initialRole)
  const [organizerAccent, setOrganizerAccent] = useState(ORGANIZER_ACCENTS[0].value)
  const [waveAnimation, setWaveAnimation] = useState<WaveAnimation>("drift-cursor")

  // Resolve role + accent: URL wins, then localStorage (only available post-mount).
  useEffect(() => {
    const urlRole = searchParams.get("role") as Role | null
    if (urlRole && (urlRole === "speaker" || urlRole === "organizer")) {
      setRole(urlRole)
      applyAccent(urlRole, urlRole === "organizer" ? organizerAccent : ROLES.speaker.accent)
      return
    }

    const storedRole = localStorage.getItem(STORAGE_KEYS.role) as Role | null
    if (storedRole && (storedRole === "speaker" || storedRole === "organizer")) {
      setRole(storedRole)
      const storedAccent = storedRole === "organizer"
        ? localStorage.getItem(STORAGE_KEYS.organizerAccent) || ROLES.organizer.accent
        : ROLES.speaker.accent
      if (storedRole === "organizer") setOrganizerAccent(storedAccent)
      applyAccent(storedRole, storedAccent)
    }
  }, [searchParams, organizerAccent])

  const applyAccent = useCallback((r: Role, accent?: string) => {
    const tokens = ROLES[r]
    const finalAccent = accent || tokens.accent
    document.documentElement.style.setProperty("--accent", finalAccent)
    document.documentElement.style.setProperty("--accent-dim", accentDim(finalAccent))
    document.documentElement.style.setProperty("--accent-text", tokens.accentText)
  }, [])

  const handleSelectRole = useCallback((newRole: Role) => {
    setRole(newRole)
    localStorage.setItem(STORAGE_KEYS.role, newRole)
    router.push(`/?role=${newRole}`, { scroll: false })
    applyAccent(newRole, newRole === "organizer" ? organizerAccent : undefined)
  }, [organizerAccent, router, applyAccent])

  const handleSwitchRole = useCallback(() => {
    const newRole = role === "speaker" ? "organizer" : "speaker"
    handleSelectRole(newRole)
  }, [role, handleSelectRole])

  const handleOrganizerColorChange = useCallback((color: string) => {
    setOrganizerAccent(color)
    localStorage.setItem(STORAGE_KEYS.organizerAccent, color)
    if (role === "organizer") {
      applyAccent("organizer", color)
    }
  }, [role, applyAccent])

  // Show dev toggle only in development or with ?dev=true
  const showDevToggle = process.env.NODE_ENV === "development" || searchParams.get("dev") === "true"

  return (
    <div className="min-h-screen bg-jsconf-bg text-foreground">
      {!role ? (
        <SplitHero onSelectRole={handleSelectRole} />
      ) : (
        <>
          <Nav role={role} onSwitchRole={handleSwitchRole} />
          {role === "speaker"
            ? <SpeakerExperience waveAnimation={waveAnimation} />
            : <OrganizerExperience waveAnimation={waveAnimation} />}


          {showDevToggle && role === "organizer" && (
            <DevColorToggle onColorChange={handleOrganizerColorChange} />
          )}
      {showDevToggle && role && (
        <ReducedMotionToggle value={waveAnimation} onChange={setWaveAnimation} />
      )}

          {showDevToggle && role === "organizer" && (
            <DevColorToggle onColorChange={handleOrganizerColorChange} />
          )}
        </>)}
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-jsconf-bg flex items-center justify-center">
        <span className="font-mono text-jsconf-muted text-sm uppercase tracking-widest">Loading...</span>
      </div>
    }>
      <LandingContent />
    </Suspense>
  )
}
