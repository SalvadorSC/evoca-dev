"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Zap, MessageCircleQuestion, Calendar, Monitor, Shield, Mic, Code2, ExternalLink } from "lucide-react"
import { STORAGE_KEYS } from "@/lib/storage-keys"

const ROUTES = [
  {
    path: "/app",
    name: "Attendee",
    icon: Zap,
    description: "React to talks, ask questions, and build your schedule",
  },
  {
    path: "/wall",
    name: "Wall",
    icon: Monitor,
    description: "Projector view showing live reactions and Q&A",
  },
  {
    path: "/speaker",
    name: "Speaker",
    icon: Mic,
    description: "Q&A dashboard with timer for managing questions",
  },
  {
    path: "/admin",
    name: "Admin",
    icon: Shield,
    description: "Control panel for moderating content and alerts",
  },
  {
    path: "/dev",
    name: "Dev",
    icon: Code2,
    description: "Debug dashboard for monitoring app state",
  },
]

export function IntroModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check if user has seen the intro before
    const hasSeenIntro = localStorage.getItem(STORAGE_KEYS.introSeen)
    if (!hasSeenIntro) {
      setOpen(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEYS.introSeen, "true")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-jsconf-surface border-jsconf-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-white uppercase tracking-wide text-xl">
            EVOCA
          </DialogTitle>
          <DialogDescription className="sr-only">
            Introduction to EVOCA — conference engagement platform
          </DialogDescription>
        </DialogHeader>

        {/* Author Section */}
        <div className="border border-jsconf-border bg-jsconf-surface-2 p-4 mt-2">
          <p className="font-sans text-sm text-jsconf-muted mb-2">Built by</p>
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-white text-lg">Salva SC</span>
            <a
              href="https://www.salvasc.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-jsconf-yellow text-black font-mono text-sm font-bold hover:bg-jsconf-yellow/90 transition-colors"
            >
              salvasc.dev
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <p className="font-sans text-sm text-white leading-relaxed">
            A real-time conference companion app for JSConf Espana 2026.
            Attendees can react to talks, ask questions, vote on Q&A, and plan their schedule.
            Speakers and organizers get dedicated dashboards for managing sessions.
          </p>
          <br />
          <p className="font-sans text-sm text-white leading-relaxed">
            <b>ATENCIÓN: LA APP FUNCIONA CON DATOS REALES Y A TIEMPO REAL, PERO COMO LA CONFERENCIA YA HA TERMINADO, HE MODIFICADO LOS DATOS PARA QUE SE ADAPTEN AL MOMENTO EN EL QUE EL USUARIO ENTRA. SIMPLEMENTE PARA QUE SE PUEDA INVESTIGAR UN POCO :D.</b>
          </p>
        </div>

        {/* Routes */}
        <div className="mt-6 space-y-2">
          <h3 className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex items-center gap-2 mb-3">
            <span className="w-1 h-4 bg-jsconf-yellow"></span>
            App Routes
          </h3>
          {ROUTES.map((route) => (
            <Link
              key={route.path}
              href={route.path}
              onClick={handleClose}
              target="_blank"
              className="flex items-center gap-3 p-3 border border-jsconf-border bg-jsconf-surface-2 hover:border-jsconf-yellow hover:bg-jsconf-surface transition-all group"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-jsconf-bg border border-jsconf-border group-hover:border-jsconf-yellow">
                <route.icon className="h-5 w-5 text-jsconf-yellow" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white font-bold">{route.path}</span>
                  <span className="font-display text-xs text-jsconf-muted uppercase">{route.name}</span>
                </div>
                <p className="font-sans text-xs text-jsconf-muted truncate">{route.description}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-jsconf-muted group-hover:text-jsconf-yellow transition-colors shrink-0" />
            </Link>
          ))}
        </div>

        {/* Get Started Button */}
        <Button
          onClick={handleClose}
          className="w-full mt-6 h-12 rounded-none bg-jsconf-yellow text-black font-display font-bold uppercase tracking-wide hover:bg-jsconf-yellow/90"
        >
          Get Started
        </Button>
      </DialogContent>
    </Dialog>
  )
}
