"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Zap, MessageCircleQuestion, Calendar, Monitor, Shield, Mic, Code2, ExternalLink } from "lucide-react"

const ROUTES = [
  { path: "/app", name: "Attendee", icon: Zap, description: "React, ask questions, plan schedule" },
  { path: "/wall", name: "Wall", icon: Monitor, description: "Projector view — live reactions & Q&A" },
  { path: "/speaker", name: "Speaker", icon: Mic, description: "Q&A dashboard with timer" },
  { path: "/admin", name: "Admin", icon: Shield, description: "Moderation & control panel" },
  { path: "/dev", name: "Dev", icon: Code2, description: "Debug dashboard", disabled: true },
]

interface HeaderProps {
  pageName?: string
  connectionCount?: number
  isConnected?: boolean
  currentTalk?: string
}

export function Header({ pageName, connectionCount, isConnected = true, currentTalk }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 h-14 bg-jsconf-bg border-b border-jsconf-border">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg tracking-wide text-white">EVOCA</span>
          </div>

          {/* Right: page name + connection + hamburger */}
          <div className="flex items-center gap-4">
            {pageName && (
              <span className="font-mono text-sm text-jsconf-muted uppercase tracking-wide">
                {pageName}
              </span>
            )}
            {typeof connectionCount === "number" && (
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-jsconf-red"}`} />
                <span className="text-jsconf-muted">{connectionCount}</span>
              </div>
            )}

            {/* Hamburger button */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center w-9 h-9 border border-jsconf-border bg-jsconf-surface hover:border-jsconf-yellow hover:text-jsconf-yellow text-jsconf-muted transition-all duration-150"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Current Talk Sub-header */}
        {currentTalk && (
          <div className="px-4 py-2 bg-jsconf-surface border-b border-jsconf-border">
            <p className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">Now speaking</p>
            <p className="font-medium text-white truncate">{currentTalk}</p>
          </div>
        )}
      </header>

      {/* Floating Menu Overlay */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-16 right-4 z-50 w-72 bg-jsconf-surface border border-jsconf-border shadow-2xl">
            {/* Menu Header */}
            <div className="px-4 py-3 border-b border-jsconf-border">
              <p className="font-mono text-xs text-jsconf-muted uppercase tracking-widest">Navigation</p>
            </div>

            {/* Routes */}
            <div className="p-2 space-y-1">
              {ROUTES.map((route) => (
                <Link
                  key={route.path}
                  href={route.path}
                  onClick={() => { if (!route.disabled) { setMenuOpen(false) } }}
                  className="flex items-center gap-3 px-3 py-2.5 border border-transparent hover:border-jsconf-yellow hover:bg-jsconf-surface-2 transition-all duration-150 group"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-jsconf-bg border border-jsconf-border group-hover:border-jsconf-yellow flex-shrink-0">
                    <route.icon className="h-4 w-4 text-jsconf-yellow" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-jsconf-muted">{route.path} {route.disabled && '(Route disabled :D)'}</span>
                    </div>
                    <p className="font-display font-bold text-sm text-white uppercase tracking-wide">{route.name}</p>
                    <p className="font-sans text-xs text-jsconf-muted truncate">{route.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-jsconf-border flex items-center justify-between">
              <span className="font-mono text-xs text-jsconf-muted">Built by:</span>
              <a
                href="https://www.salvasc.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-xs text-jsconf-yellow hover:underline"
              >
                salvasc.dev
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </>
      )
      }
    </>
  )
}
