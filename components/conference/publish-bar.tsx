"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Globe, Lock, Copy, Check, ExternalLink, Loader2 } from "lucide-react"
import { setConferencePublished } from "@/app/dashboard/conference/actions"

export function PublishBar({
  conferenceId,
  initialIsPublic,
  initialSlug,
}: {
  conferenceId: string
  initialIsPublic: boolean
  initialSlug: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [slug, setSlug] = useState<string | null>(initialSlug)
  const [copied, setCopied] = useState(false)

  const publicPath = slug ? `/c/${slug}` : null
  const publicUrl =
    publicPath && typeof window !== "undefined" ? `${window.location.origin}${publicPath}` : publicPath

  function toggle() {
    const next = !isPublic
    startTransition(async () => {
      try {
        const { slug: newSlug } = await setConferencePublished(conferenceId, next)
        setIsPublic(next)
        setSlug(newSlug)
        router.refresh()
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Could not update visibility.")
      }
    })
  }

  function copy() {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-jsconf-surface border border-jsconf-border p-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex items-center justify-center h-9 w-9 shrink-0 ${
            isPublic ? "bg-jsconf-yellow text-primary-foreground" : "bg-jsconf-bg text-jsconf-muted"
          }`}
        >
          {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-sm text-foreground uppercase tracking-wide">
            {isPublic ? "Public" : "Private"}
          </p>
          {isPublic && publicPath ? (
            <a
              href={publicPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-jsconf-muted hover:text-jsconf-yellow transition-colors truncate"
            >
              {publicPath}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <p className="font-mono text-[11px] text-jsconf-muted">
              Not visible to attendees yet.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isPublic && publicUrl && (
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-foreground hover:border-jsconf-yellow transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        )}
        <button
          onClick={toggle}
          disabled={pending}
          className={`inline-flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 disabled:opacity-60 ${
            isPublic
              ? "border border-jsconf-border text-jsconf-muted hover:text-foreground"
              : "bg-jsconf-yellow text-primary-foreground hover:bg-jsconf-yellow/90"
          }`}
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          {isPublic ? "Unpublish" : "Publish"}
        </button>
      </div>
    </div>
  )
}
