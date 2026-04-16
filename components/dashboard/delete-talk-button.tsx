"use client"

import { useState, useTransition } from "react"
import { Trash2, AlertTriangle } from "lucide-react"
import { deleteTalk } from "@/app/dashboard/talks/actions"

interface DeleteTalkButtonProps {
  talkId: string
  talkTitle: string
  /** If true, renders as a full-width button (used on the talk detail page) */
  variant?: "icon" | "full"
  onDeleted?: () => void
}

export function DeleteTalkButton({
  talkId,
  talkTitle,
  variant = "icon",
  onDeleted,
}: DeleteTalkButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await deleteTalk(talkId)
      setOpen(false)
      onDeleted?.()
    })
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => setOpen(true)}
          title="Delete talk"
          className="inline-flex items-center justify-center w-9 h-9 border border-jsconf-border text-jsconf-muted hover:border-jsconf-red hover:text-jsconf-red transition-all duration-150"
          aria-label="Delete talk"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:border-jsconf-red hover:text-jsconf-red transition-all duration-150"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Talk
        </button>
      )}

      {/* Confirmation modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className="w-full max-w-sm mx-4 bg-jsconf-surface border border-jsconf-border p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + heading */}
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 border border-jsconf-red flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-jsconf-red" />
              </div>
              <div>
                <p className="font-display font-bold text-white uppercase tracking-wide text-base">
                  Delete talk?
                </p>
                <p className="font-mono text-xs text-jsconf-muted mt-1 leading-relaxed">
                  &ldquo;{talkTitle}&rdquo; and all its sessions will be permanently removed. This cannot be undone.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 font-mono text-xs uppercase tracking-wider py-2.5 border border-jsconf-border text-jsconf-muted hover:text-white hover:border-white transition-all duration-150 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 font-mono text-xs uppercase tracking-wider py-2.5 bg-jsconf-red text-white hover:opacity-90 transition-all duration-150 disabled:opacity-40"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
