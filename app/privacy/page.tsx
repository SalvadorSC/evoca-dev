import type { Metadata } from "next"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Logo } from "@/components/shared/logo"
import { PRIVACY_MARKDOWN, PRIVACY_LAST_UPDATED } from "@/lib/legal/privacy"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How EVOCA collects, uses, and protects your personal data — including GDPR and CCPA rights for real-time audience engagement.",
  alternates: {
    canonical: "/privacy",
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-jsconf-bg text-foreground">
      {/* Header */}
      <header className="border-b border-jsconf-border px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" aria-label="Back to EVOCA home">
            <Logo size="sm" />
          </Link>
          <Link
            href="/"
            className="font-mono text-xs text-jsconf-muted hover:text-jsconf-yellow transition-colors"
          >
            ← Back to EVOCA
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 py-12">
        <article className="max-w-3xl mx-auto">
          <p className="font-mono text-xs text-jsconf-muted uppercase tracking-wider mb-8">
            Last updated {PRIVACY_LAST_UPDATED}
          </p>
          <div className="legal-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground mb-6 text-balance">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-foreground mt-12 mb-4 scroll-mt-24">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-display font-semibold text-lg text-foreground mt-8 mb-3">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="font-sans text-sm sm:text-base leading-relaxed text-jsconf-muted mb-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 mb-4 flex flex-col gap-2 text-sm sm:text-base text-jsconf-muted">
                    {children}
                  </ul>
                ),
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-jsconf-yellow underline underline-offset-2 hover:opacity-80"
                  >
                    {children}
                  </a>
                ),
                em: ({ children }) => (
                  <em className="text-jsconf-muted/80">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-jsconf-yellow bg-jsconf-surface px-4 py-3 my-5 text-sm text-foreground [&_p]:mb-0 [&_p]:text-foreground">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="border-jsconf-border my-10" />,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="w-full border-collapse text-sm text-jsconf-muted">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="border-b border-jsconf-border">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="text-left font-semibold text-foreground px-3 py-2 align-top">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 align-top border-b border-jsconf-border/50">
                    {children}
                  </td>
                ),
              }}
            >
              {PRIVACY_MARKDOWN}
            </ReactMarkdown>
          </div>
        </article>
      </main>
    </div>
  )
}
