'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Routes where a footer bar would overlap immersive, real-time content.
const HIDDEN_PREFIXES = ['/present', '/wall', '/remote', '/qna']
export function LegalFooter() {
  const pathname = usePathname()

  if (!pathname) return null
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null

  return (
    <footer className="border-t border-jsconf-border bg-jsconf-bg">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-4 sm:flex-row">
        <p className="font-mono text-xs text-jsconf-muted">
          {`© ${new Date().getFullYear()} EVOCA`}
        </p>
        <nav className="flex items-center gap-6" aria-label="Legal">
          <Link
            href="/terms"
            className="font-mono text-xs text-jsconf-muted transition-colors hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="font-mono text-xs text-jsconf-muted transition-colors hover:text-foreground"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  )
}
