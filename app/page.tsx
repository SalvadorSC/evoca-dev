"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronDown, QrCode } from "lucide-react"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { InteractivePhoneMockup, HeroBackground } from "@/components/shared/phone-mockup"
import type { LiveItem } from "@/components/shared/phone-mockup"

// ─── Design Tokens ────────────────────────────────────────────────────────────
const ROLES = {
  speaker: {
    accent: "#F7E018",
    accentDim: "rgba(247, 224, 24, 0.12)",
    accentText: "#000",
    wipeDirection: "left" as const,
    label: "I'm a Speaker"
  },
  organizer: {
    accent: "#00E887",
    accentDim: "rgba(0, 232, 135, 0.12)",
    accentText: "#000",
    wipeDirection: "right" as const,
    label: "I'm an Organizer"
  }
}

const ORGANIZER_ACCENTS = [
  { label: "Green", value: "#00E887" },
  { label: "Teal", value: "#00E8E0" },
]

type Role = "speaker" | "organizer"

// ─── Logo Component ───────────────────────────────────────────────────────────
function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Chat bubble SVG */}
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
        <path d="M4 6C4 4.89543 4.89543 4 6 4H22C23.1046 4 24 4.89543 24 6V18C24 19.1046 23.1046 20 22 20H10L6 24V20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="9" cy="12" r="1.5" fill="var(--accent, #F7E018)" />
        <circle cx="14" cy="12" r="1.5" fill="var(--accent, #F7E018)" />
        <circle cx="19" cy="12" r="1.5" fill="var(--accent, #F7E018)" />
      </svg>
      <span className="font-mono text-sm font-bold tracking-wide text-white">
        EVOCA
      </span>
      {/* Pulsing dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--accent, #F7E018)" }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--accent, #F7E018)" }} />
      </span>
    </div>
  )
}

// ─── Split Hero ───────────────────────────────────────────────────────────────
function SplitHero({ onSelectRole }: { onSelectRole: (role: Role) => void }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Center logo - absolutely positioned */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-[#080808] px-4 py-3 hidden lg:block">
        <Logo />
      </div>

      {/* Mobile logo */}
      <div className="lg:hidden py-6 flex justify-center border-b border-[#2a2a2a]">
        <Logo />
      </div>

      {/* Speaker side */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-[#2a2a2a] relative">
        <div className="max-w-md text-center lg:text-left">
          <p className="font-mono text-xs text-[#666] uppercase tracking-widest mb-2">I&apos;m a</p>
          <h1 className="font-display font-bold text-white text-5xl lg:text-6xl xl:text-7xl mb-4">Speaker</h1>
          <p className="font-sans text-[#888] text-base lg:text-lg mb-8">
            Turn any talk into a live experience
          </p>
          <button
            onClick={() => onSelectRole("speaker")}
            className="font-mono text-sm font-bold uppercase tracking-wide px-6 py-3 border-2 border-[#F7E018] text-[#F7E018] hover:bg-[#F7E018] hover:text-black transition-colors"
          >
            Get started free →
          </button>
        </div>
      </div>

      {/* Organizer side */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative">
        <div className="max-w-md text-center lg:text-left">
          <p className="font-mono text-xs text-[#666] uppercase tracking-widest mb-2">I&apos;m an</p>
          <h1 className="font-display font-bold text-white text-5xl lg:text-6xl xl:text-7xl mb-4">Organizer</h1>
          <p className="font-sans text-[#888] text-base lg:text-lg mb-8">
            One platform for your schedule, speakers and live engagement
          </p>
          <button
            onClick={() => onSelectRole("organizer")}
            className="font-mono text-sm font-bold uppercase tracking-wide px-6 py-3 border-2 border-[#00E887] text-[#00E887] hover:bg-[#00E887] hover:text-black transition-colors"
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
  const otherRole = role === "speaker" ? "Organizer" : "Speaker"

  return (
    <nav className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur border-b border-[#1f1f1f] px-6 py-4 flex items-center justify-between">
      <Logo />
      <div className="flex items-center gap-4">
        <button
          onClick={onSwitchRole}
          className="font-mono text-xs text-[#666] hover:text-white transition-colors"
        >
          Switch to {otherRole}
        </button>
        <Link
          href="/login"
          className="font-mono text-sm font-bold px-4 py-2 transition-colors"
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
        >
          Get started free →
        </Link>
      </div>
    </nav>
  )
}



// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, description, badge }: { icon: string; title: string; description: string; badge?: string }) {
  return (
    <div className="bg-[#111] border-l-[3px] p-5" style={{ borderLeftColor: "var(--accent)" }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {badge && (
          <span className="font-mono text-[10px] px-2 py-0.5 border" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-display font-bold text-white text-base mb-1">{title}</h3>
      <p className="font-sans text-sm text-[#888] leading-relaxed whitespace-pre-line">{description}</p>
    </div>
  )
}

// ─── Pro Waitlist Form ────────────────────────────────────────────────────────
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
      <p className="font-mono text-xs text-[#00E887] uppercase tracking-wider">
        You&apos;re on the list. We&apos;ll reach out when Pro launches.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row w-full">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle") }}
          placeholder="your@email.com"
          className="flex-1 min-w-0 bg-[#111] border border-[#2a2a2a] text-white font-sans text-sm placeholder:text-[#555] px-3 h-9 focus:outline-none focus:border-[#555] transition-colors sm:border-r-0"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="font-mono text-xs text-[#666] border border-[#2a2a2a] px-4 h-9 hover:text-white hover:border-[#666] transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
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
    <div className="divide-y divide-[#2a2a2a]">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
          >
            <span className="font-sans text-white">{item.q}</span>
            <ChevronDown className={`w-5 h-5 text-[#666] transition-transform shrink-0 ml-4 ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && (
            <p className="font-sans text-[#888] text-sm pb-4 leading-relaxed">{item.a}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Speaker Experience ───────────────────────────────────────────────────────
function SpeakerExperience() {
  const [heroItems, setHeroItems] = useState<LiveItem[]>([])

  const handleActivity = useCallback((item: LiveItem) => {
    setHeroItems((prev) => [...prev.slice(-6), item])
  }, [])

  const speakerFAQ = [
    { q: "Do attendees need an account?", a: "No, they scan a QR and they're in." },
    { q: "What happens to Q&A after the talk?", a: "Saved to your dashboard." },
    { q: "Does it work with my existing slides?", a: "Yes — PPTX, PDF, or Slides.com link." },
    { q: "Is it really free?", a: "Yes, 5 talks free forever. No credit card needed." },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative px-6 py-4 lg:py-12 overflow-hidden min-h-[480px]">
        <HeroBackground items={heroItems} accentColor="var(--accent)" />
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1">
            <h1 className="font-display font-bold text-white text-4xl lg:text-5xl xl:text-6xl mb-6 leading-tight">
              Turn any talk into a live experience
            </h1>
            <p className="font-sans text-[#888] text-lg lg:text-xl mb-8 leading-relaxed">
              Slides, live reactions, Q&A and analytics — all in one place. Your audience participates, you stay in control.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="font-mono text-sm font-bold px-6 py-3"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
              >
                Start for free →
              </Link>
              <Link
                href="/demo"
                className="font-mono text-sm font-bold px-6 py-3 border-2 text-white hover:bg-white/5 transition-colors"
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
      <section className="px-6 py-12 border-t border-[#1f1f1f]">
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
      <section className="px-6 py-8 bg-[#111] border-y border-[#1f1f1f]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <span className="font-mono text-sm font-bold px-3 py-1 border" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
            🏆 Winner — JSConf Espana 2026 Hackathon
          </span>
          <span className="font-sans text-sm text-[#666]">Built at JSConf. Loved by the community.</span>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-6" style={{ borderColor: "var(--accent)" }}>
            <h3 className="font-display font-bold text-white text-xl mb-3">Free</h3>
            <p className="font-sans text-[#888] text-sm leading-relaxed">
              5 talks · Live Wall watermark · Core features
            </p>
          </div>
          <div className="border border-[#2a2a2a] p-6">
            <h3 className="font-display font-bold text-white text-xl mb-3">Pro</h3>
            <p className="font-sans text-[#888] text-sm leading-relaxed mb-4">
              Coming soon — unlimited talks, analytics, no watermark
            </p>
            <ProWaitlistForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 border-t border-[#1f1f1f]">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-white text-2xl mb-8">FAQ</h2>
          <FAQ items={speakerFAQ} />
        </div>
      </section>
    </div>
  )
}

// ─── Organizer Experience ─────────────────────────────────────────────────────
function OrganizerExperience() {
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
        <HeroBackground items={heroItems} accentColor="var(--accent)" />
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1">
            <h1 className="font-display font-bold text-white text-4xl lg:text-5xl xl:text-6xl mb-6 leading-tight">
              One platform for your schedule, speakers and live engagement
            </h1>
            <p className="font-sans text-[#888] text-lg lg:text-xl mb-8 leading-relaxed">
              Manage your event, onboard speakers and give every session live engagement — without the Slido price tag.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="font-mono text-sm font-bold px-6 py-3"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
              >
                Set up your event →
              </Link>
              <Link
                href="/demo"
                className="font-mono text-sm font-bold px-6 py-3 border-2 text-white hover:bg-white/5 transition-colors"
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
      <section className="px-6 py-16 border-t border-[#1f1f1f]">
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
      <section className="px-6 py-8 bg-[#111] border-y border-[#1f1f1f]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <span className="font-mono text-sm font-bold px-3 py-1 border" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
            🏆 Winner — JSConf Espana 2026 Hackathon
          </span>
          <span className="font-sans text-sm text-[#666]">Built at JSConf. Loved by the community.</span>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 border-t border-[#1f1f1f]">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-white text-2xl mb-8">FAQ</h2>
          <FAQ items={organizerFAQ} />
        </div>
      </section>
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="px-6 py-8 border-t border-[#1f1f1f]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo />
        <p className="font-sans text-sm text-[#666]">Built by Salvador Sanchez</p>
        <div className="flex items-center gap-6">
          <Link href="/demo" className="font-mono text-xs text-[#666] hover:text-white transition-colors">Demo</Link>
          <Link href="/login" className="font-mono text-xs text-[#666] hover:text-white transition-colors">Login</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Dev Color Toggle ─────────────────────────────────────────────────────────
function DevColorToggle({ onColorChange }: { onColorChange: (color: string) => void }) {
  const [active, setActive] = useState(ORGANIZER_ACCENTS[0].value)

  return (
    <div className="fixed bottom-6 left-6 z-[9999] bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-2 flex items-center gap-2">
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
          <span className="font-mono text-[10px] text-[#888]">{accent.label}</span>
        </button>
      ))}
    </div>
  )
}



// ─── Main Landing Content ─────────────────────────────────────────────────────
function LandingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [role, setRole] = useState<Role | null>(null)
  const [organizerAccent, setOrganizerAccent] = useState(ORGANIZER_ACCENTS[0].value)

  // Check URL and localStorage on mount
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
    document.documentElement.style.setProperty("--accent-dim", r === "organizer" ? `rgba(0, 232, 135, 0.12)` : tokens.accentDim)
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
    <div className="min-h-screen bg-[#080808] text-white">
      {!role ? (
        <SplitHero onSelectRole={handleSelectRole} />
      ) : (
        <>
          <Nav role={role} onSwitchRole={handleSwitchRole} />
          {role === "speaker" ? <SpeakerExperience /> : <OrganizerExperience />}
          <Footer />
        </>
      )}

      {showDevToggle && role === "organizer" && (
        <DevColorToggle onColorChange={handleOrganizerColorChange} />
      )}
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <span className="font-mono text-[#666] text-sm uppercase tracking-widest">Loading...</span>
      </div>
    }>
      <LandingContent />
    </Suspense>
  )
}
