"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronDown, Trophy, Flame, BarChart2, Smartphone, Gift, CalendarDays, Mic, WallpaperIcon, TrendingUp } from "lucide-react"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { InteractivePhoneMockup, HeroBackground } from "@/components/shared/phone-mockup"
import { Logo } from "@/components/shared/logo"
import { CtaButton } from "@/components/shared/cta-button"
import type { LiveItem, WaveAnimation } from "@/components/shared/phone-mockup"
import { ReducedMotionToggle } from "@/components/shared/wave-background"
import { OrganizerPricing } from "@/components/landing/organizer-pricing"
import { InteractivePhoneHint } from "@/components/landing/interactive-phone-hint"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

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

// ─── Navigation ───────────────────────────────────────────────────────────────
function Nav({ role }: { role: Role }) {
  // The primary CTA only appears once the visitor has scrolled past the hero
  // section (the hero carries its own CTAs). It stays mounted and fades in so
  // the appearance is smooth rather than a harsh pop.
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    const hero = document.querySelector("[data-hero]")
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-jsconf-bg/95 backdrop-blur border-b border-jsconf-border px-6 py-4 flex items-center justify-between">
      <Logo size="sm" />
      <div className="flex items-center gap-4">

        <CtaButton
          variant="solid"
          accent={ROLES[role].accent}
          accentText={ROLES[role].accentText}
          href="/login"
          className={cn(
            "text-sm px-4 py-2 hidden sm:inline-flex transition-all duration-300 ease-out",
            pastHero ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none",
          )}
        >
          Get started free →
        </CtaButton>
        <CtaButton
          variant="solid"
          accent={ROLES[role].accent}
          accentText={ROLES[role].accentText}
          href="/login"
          className={cn(
            "text-sm px-4 py-2 sm:inline-flex transition-all duration-300 ease-out",
          )}
        >
          Log in
        </CtaButton>
        <div className="hidden sm:block">
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  )
}



// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, description, badge }: { icon: React.ReactNode; title: string; description: string; badge?: string }) {
  return (
    <div className="bg-jsconf-surface border-l-[3px] p-5" style={{ borderLeftColor: "var(--accent)" }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-jsconf-yellow" style={{ color: "var(--accent)" }}>{icon}</span>
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

// ─── Pro Waitlist Form ─────────────────────────────���─────────���────────────────
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
function SpeakerExperience({ waveAnimation, onSwitchRole }: { waveAnimation: WaveAnimation; onSwitchRole: () => void }) {
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
    { q: "Does it work with my existing slides?", a: "Yes. PPTX, PDF, or Slides.com link." },
    { q: "Is it really free?", a: "Yes, 5 talks free forever. No credit card needed. See full pricing for what's included." },
  ]

  return (
    <div>
      {/* Hero */}
      <section data-hero className="relative px-6 py-4 lg:py-12 overflow-hidden min-h-[480px]">
        <HeroBackground items={heroItems} accentColor="var(--wave-color, var(--accent))" waveAnimation={waveAnimation} />
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1">
            <h1 className="font-display font-bold text-foreground text-4xl lg:text-5xl xl:text-6xl mb-6 leading-tight">
              Turn any talk into a live experience
            </h1>
            <p className="font-sans text-jsconf-muted text-lg lg:text-xl mb-8 leading-relaxed">
              Slides, live reactions, Q&A and analytics. All in one place. Your audience participates, you stay in control.
            </p>
            <div className="flex flex-wrap gap-4">
              <CtaButton variant="solid" href="/login" className="text-sm">
                Start for free →
              </CtaButton>
              <CtaButton variant="ghost" href={demoHref} className="text-sm">
                See it live
              </CtaButton>
            </div>
            <div className="mt-4">
              <CtaButton variant="ghost" onClick={onSwitchRole} className="text-sm">
                {ROLES.organizer.action}
              </CtaButton>
            </div>
          </div>
          <div className="flex-shrink-0 hidden lg:block relative">
            <InteractivePhoneMockup onActivity={handleActivity} currentItems={heroItems} />
            <InteractivePhoneHint />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 border-t border-jsconf-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={<Flame className="h-6 w-6" />}
              title="Live reactions + Q&A"
              description={"Your audience reacts in real time.\nQuestions are upvoted to the top."}
            />
            <FeatureCard
              icon={<BarChart2 className="h-6 w-6" />}
              title="Post-session analytics"
              description={"Engagement over time, top questions\nand reaction peaks after every talk."}
              badge="PAID"
            />
            <FeatureCard
              icon={<Smartphone className="h-6 w-6" />}
              title="No sign-up for attendees"
              description={"Attendees join by scanning a QR.\nNo app, no account, no friction."}
            />
            <FeatureCard
              icon={<Gift className="h-6 w-6" />}
              title="Free to start"
              description={"5 talks free forever.\nUpgrade only when you need more."}
            />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-8 bg-jsconf-surface border-y border-jsconf-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center">
          <span
            className="inline-flex items-center justify-center gap-1.5 font-mono text-xs sm:text-sm font-bold px-3 py-1.5 leading-snug text-balance"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
          >
            <Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Winner at JSConf España 2026 Hackathon
          </span>
          <span className="font-sans text-sm text-jsconf-muted text-balance">Built at JSConf. Loved by the community.</span>
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
                Coming soon: unlimited talks, analytics, no watermark
              </p>
              <ProWaitlistForm />
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/pricing?for=speaker"
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
function OrganizerExperience({ waveAnimation, onSwitchRole }: { waveAnimation: WaveAnimation; onSwitchRole: () => void }) {
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
    { q: "Is there a free plan?", a: "Yes. Small events run free with up to 100 attendees and one admin. Paid plans add unlimited attendees and more admin seats." },
    { q: "Can I add more admins?", a: "Growth includes up to 3 admin users and Scale is unlimited, so your team can co-manage the event." },
    { q: "Can I brand it with my event colors?", a: "Coming soon." },
    { q: "Do I need technical setup?", a: "No. Create event, invite speakers, share the link." },
  ]

  return (
    <div>
      {/* Hero */}
      <section data-hero className="relative px-6 py-16 lg:py-12 overflow-hidden min-h-[480px]">
        <HeroBackground items={heroItems} accentColor="var(--wave-color, var(--accent))" waveAnimation={waveAnimation} />
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1">
            <h1 className="font-display font-bold text-foreground text-4xl lg:text-5xl xl:text-6xl mb-6 leading-tight">
              One platform for your schedule, speakers and live engagement
            </h1>
            <p className="font-sans text-jsconf-muted text-lg lg:text-xl mb-8 leading-relaxed">
              Manage your event, onboard speakers and give every session live engagement. Simple pricing, no hidden fees.
            </p>
            <div className="flex flex-wrap gap-4">
              <CtaButton variant="solid" href="/login" className="text-sm">
                Set up your event →
              </CtaButton>
              <CtaButton variant="ghost" href={demoHref} className="text-sm">
                See it live
              </CtaButton>
            </div>
            <div className="mt-4">
              <CtaButton variant="ghost" onClick={onSwitchRole} className="text-sm">
                {ROLES.speaker.action}
              </CtaButton>
            </div>
          </div>
          <div className="flex-shrink-0 hidden lg:block relative">
            <InteractivePhoneMockup onActivity={handleActivity} currentItems={heroItems} />
            <InteractivePhoneHint />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-jsconf-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={<CalendarDays className="h-6 w-6" />}
              title="Schedule management"
              description={"Build your event schedule.\nAttendees see it live and plan their day."}
            />
            <FeatureCard
              icon={<Mic className="h-6 w-6" />}
              title="Speaker onboarding"
              description={"Invite speakers by email or join link.\nThey set up their own talks in minutes."}
            />
            <FeatureCard
              icon={<WallpaperIcon className="h-6 w-6" />}
              title="Live Wall for every session"
              description={"Every talk gets reactions, Q&A and a\nprojector wall automatically."}
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Engagement metrics"
              description={"See which sessions drove the most\nengagement across your entire event."}
            />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-8 bg-jsconf-surface border-y border-jsconf-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center">
          <span
            className="inline-flex items-center justify-center gap-1.5 font-mono text-xs sm:text-sm font-bold px-3 py-1.5 leading-snug text-balance"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
          >
            <Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Winner at JSConf España 2026 Hackathon
          </span>
          <span className="font-sans text-sm text-jsconf-muted text-balance">Built at JSConf. Loved by the community.</span>
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

// ─── Main Landing Content ──────────────────────────────────────────────────────
function LandingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize role synchronously from the URL on the first client render so
  // `?role=speaker` is honored immediately. Otherwise default to "organizer" —
  // organizers bring speakers + attendees with them, so it's the primary audience.
  const urlRoleParam = searchParams.get("role")
  const initialRole: Role =
    urlRoleParam === "speaker" || urlRoleParam === "organizer" ? urlRoleParam : "organizer"

  const [role, setRole] = useState<Role>(initialRole)
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
      return
    }

    // No URL or stored preference: apply the default organizer accent.
    const storedAccent = localStorage.getItem(STORAGE_KEYS.organizerAccent) || ORGANIZER_ACCENTS[0].value
    setOrganizerAccent(storedAccent)
    applyAccent("organizer", storedAccent)
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

  // Show dev toggle only in development or with ?dev=true
  const showDevToggle = process.env.NODE_ENV === "development" || searchParams.get("dev") === "true"

  return (
    <div className="min-h-screen bg-jsconf-bg text-foreground">
      <Nav role={role} />
      {role === "speaker"
        ? <SpeakerExperience waveAnimation={waveAnimation} onSwitchRole={handleSwitchRole} />
        : <OrganizerExperience waveAnimation={waveAnimation} onSwitchRole={handleSwitchRole} />}

      {showDevToggle && (
        <ReducedMotionToggle value={waveAnimation} onChange={setWaveAnimation} />
      )}
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
