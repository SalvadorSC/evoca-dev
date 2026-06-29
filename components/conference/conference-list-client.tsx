"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { usePaywall } from "@/components/billing/paywall-provider"
import { createConference } from "@/app/dashboard/conference/actions"

export function ConferenceListClient({ canCreate }: { canCreate: boolean }) {
  const router = useRouter()
  const { openPaywall } = usePaywall()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleNewClick() {
    if (!canCreate) {
      openPaywall("Creating a conference requires an organizer plan.")
      return
    }
    setName("")
    setError(null)
    setOpen(true)
  }

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Please enter a conference name.")
      return
    }
    startTransition(async () => {
      try {
        const id = await createConference(trimmed)
        setOpen(false)
        router.push(`/dashboard/conference/${id}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create conference.")
      }
    })
  }

  return (
    <>
      <button
        onClick={handleNewClick}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150 shrink-0"
      >
        <Plus className="h-4 w-4" />
        New Conference
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-jsconf-surface border-jsconf-border text-white">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wide">
              New Conference
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label
              htmlFor="conf-name"
              className="font-mono text-xs text-jsconf-muted uppercase tracking-wider block mb-2"
            >
              Conference name
            </label>
            <input
              id="conf-name"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
              }}
              placeholder="e.g. JSConf EU 2026"
              className="w-full bg-jsconf-bg border border-jsconf-border px-3 py-2.5 font-sans text-sm text-white placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow"
            />
            {error && <p className="font-mono text-xs text-red-400 mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <button
              onClick={handleCreate}
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
