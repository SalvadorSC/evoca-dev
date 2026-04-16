'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
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
          <h1 className="font-display font-bold text-3xl tracking-wide mb-2 text-white">
            EVOCA
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
                  <h2 className="font-display font-bold text-xl text-white mb-2">
                    Check your email
                  </h2>
                  <p className="text-sm text-jsconf-muted">
                    We sent a magic link to <span className="text-white">{email}</span>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-xl text-white mb-1">
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
                    className="bg-jsconf-bg border-jsconf-border text-white placeholder:text-jsconf-muted focus:border-jsconf-yellow h-12"
                  />
                </div>

                {error && (
                  <div className="bg-jsconf-red/10 border border-jsconf-red/20 px-4 py-3">
                    <p className="text-sm text-jsconf-red font-mono">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-jsconf-yellow text-black hover:bg-jsconf-yellow/90 font-mono font-bold uppercase tracking-wider h-12"
                  disabled={isLoading}
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
              Dev only
            </p>
            <a
              href="/api/dev-login"
              className="flex items-center justify-center w-full h-10 bg-jsconf-surface border border-jsconf-border text-jsconf-muted hover:text-white hover:border-jsconf-muted font-mono text-xs uppercase tracking-wider transition-colors"
            >
              Skip magic link — sign in as test user
            </a>
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
