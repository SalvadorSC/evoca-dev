"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Mic2, User, Zap, LogOut } from "lucide-react"

const NAV_ITEMS = [
  { label: "Talks", href: "/dashboard", icon: Mic2 },
  { label: "Account", href: "/dashboard/account", icon: User },
]

function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-jsconf-border bg-jsconf-surface min-h-screen">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-jsconf-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-display font-bold text-lg tracking-wide text-white">EVOCA</span>
          </Link>
          <span className="font-mono text-[10px] text-jsconf-muted uppercase tracking-widest mt-0.5 block">
            Speaker Dashboard
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 font-mono text-sm uppercase tracking-wider transition-all duration-150 ${
                  active
                    ? "bg-jsconf-yellow text-black font-bold"
                    : "text-jsconf-muted hover:text-white hover:bg-jsconf-surface-2"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}

          {/* Upgrade */}
          <Link
            href="/dashboard/upgrade"
            className="flex items-center gap-3 px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-jsconf-yellow hover:bg-jsconf-yellow-dim transition-all duration-150 mt-2 border border-jsconf-yellow/30"
          >
            <Zap className="h-4 w-4 shrink-0" />
            Upgrade
          </Link>
        </nav>

        {/* Sign out */}
        <div className="px-2 pb-4 border-t border-jsconf-border pt-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-jsconf-muted hover:text-white hover:bg-jsconf-surface-2 transition-all duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-jsconf-surface border-t border-jsconf-border flex">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 font-mono text-[10px] uppercase tracking-wider transition-all duration-150 ${
                active ? "text-jsconf-yellow" : "text-jsconf-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center gap-1 py-3 font-mono text-[10px] uppercase tracking-wider text-jsconf-muted"
        >
          <LogOut className="h-5 w-5" />
          Out
        </button>
      </nav>
    </>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-jsconf-bg flex">
      <SidebarNav />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
