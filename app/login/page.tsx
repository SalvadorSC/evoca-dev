'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/shared/logo'

// Mirrors scripts/seed-test-accounts.mjs + /api/dev-login. See docs/test-accounts.md.
const DEV_ACCOUNTS = [
  { key: 'free', label: 'Free speaker', tag: 'free', note: 'No paid access — triggers paywall.' },
  { key: 'speaker-pro', label: 'Speaker Pro', tag: 'spk pro', note: 'Own Pro subscription.' },
  { key: 'organizer-live', label: 'Organizer (live)', tag: 'monthly', note: 'Active subscription — full live access.' },
  { key: 'organizer-onetime-live', label: 'One-time (live)', tag: 'window now', note: 'Event window is now — live.' },
  { key: 'organizer-onetime-prep', label: 'One-time (prep)', tag: 'future', note: 'Window in future — prep only.' },
  { key: 'organizer-onetime-unset', label: 'One-time (unset)', tag: 'no window', note: 'No window chosen — prep only.' },
  { key: 'organizer-expired', label: 'Organizer (expired)', tag: 'cancelled', note: 'Cancelled — content locked.' },
  { key: 'organizer-grace', label: 'Organizer (grace)', tag: 'past_due', note: 'Payment failed — prep grace.' },
  { key: 'both', label: 'Speaker + Organizer', tag: 'both', note: 'Dual identity, full access.' },
  { key: 'affiliated-speaker', label: 'Affiliated speaker', tag: 'event pro', note: 'Invited to a live conference — event-scoped Pro.' },
  { key: 'owner', label: 'Owner (real)', tag: 'owner', note: 'The primary dev account.' },
] as const

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) {
      setError('Please agree to the Terms of Service to continue.')
      return
    }
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-jsconf-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="flex justify-center mb-2">
            <Logo size="xl" />
          </h1>
          <p className="font-mono text-xs text-jsconf-muted uppercase tracking-wider">
            Sign in to manage your talks
          </p>
        </div>

        {/* Card */}
        <div className="bg-jsconf-surface border border-jsconf-border">
          <div className="p-6">
            {success ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-jsconf-yellow-dim text-jsconf-yellow font-mono text-2xl">
                  ✓
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-foreground mb-2">
                    Check your email
                  </h2>
                  <p className="text-sm text-jsconf-muted">
                    We sent a magic link to <span className="text-foreground">{email}</span>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-xl text-foreground mb-1">
                    Sign in
                  </h2>
                  <p className="text-sm text-jsconf-muted">
                    Enter your email to receive a magic link
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="font-mono text-xs text-jsconf-muted uppercase tracking-wider"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-jsconf-bg border-jsconf-border text-foreground placeholder:text-jsconf-muted focus:border-jsconf-yellow h-12"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agree-terms"
                    checked={agreed}
                    onCheckedChange={(checked) => setAgreed(checked === true)}
                    className="mt-0.5 border-jsconf-border data-[state=checked]:bg-jsconf-yellow data-[state=checked]:border-jsconf-yellow data-[state=checked]:text-black"
                  />
                  <label htmlFor="agree-terms" className="text-sm text-jsconf-muted leading-relaxed">
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-jsconf-yellow underline underline-offset-2 hover:opacity-80"
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-jsconf-yellow underline underline-offset-2 hover:opacity-80"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>

                {error && (
                  <div className="bg-jsconf-red/10 border border-jsconf-red/20 px-4 py-3">
                    <p className="text-sm text-jsconf-red font-mono">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-jsconf-yellow text-black hover:bg-jsconf-yellow/90 font-mono font-bold uppercase tracking-wider h-12 disabled:opacity-50"
                  disabled={isLoading || !agreed}
                >
                  {isLoading ? 'Sending...' : 'Send magic link'}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Dev bypass — only shown in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 border border-dashed border-jsconf-border p-4">
            <p className="font-mono text-xs text-jsconf-muted uppercase tracking-wider mb-3">
              Dev only — sign in as test account
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {DEV_ACCOUNTS.map((acc) => (
                <a
                  key={acc.key}
                  href={`/api/dev-login?as=${acc.key}`}
                  className="flex items-center justify-between gap-2 px-3 h-9 bg-jsconf-surface border border-jsconf-border text-jsconf-muted hover:text-foreground hover:border-jsconf-muted font-mono text-xs transition-colors"
                  title={acc.note}
                >
                  <span className="uppercase tracking-wider truncate">{acc.label}</span>
                  <span className="text-[10px] text-jsconf-muted/70 shrink-0">{acc.tag}</span>
                </a>
              ))}
            </div>
            <p className="font-mono text-[10px] text-jsconf-muted/60 mt-3 leading-relaxed">
              Run{' '}
              <span className="text-jsconf-muted">scripts/seed-test-accounts.mjs</span> first. See
              docs/test-accounts.md.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="font-mono text-xs text-jsconf-muted hover:text-jsconf-yellow transition-colors"
          >
            ← Back to EVOCA
          </a>
        </div>
      </div>
    </div>
  )
}
