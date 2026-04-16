import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-jsconf-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display font-bold text-3xl tracking-wide mb-2 text-white">
            EVOCA
          </h1>
          <p className="font-mono text-xs text-jsconf-muted uppercase tracking-wider">
            Authentication Error
          </p>
        </div>

        {/* Card */}
        <div className="bg-jsconf-surface border border-jsconf-border">
          <div className="p-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-jsconf-red/10 text-jsconf-red font-mono text-2xl">
              ✕
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-white mb-2">
                Authentication failed
              </h2>
              <p className="text-sm text-jsconf-muted">
                There was a problem signing you in. Please try again.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block bg-jsconf-yellow text-black hover:bg-jsconf-yellow/90 font-mono font-bold uppercase tracking-wider px-6 py-3 transition-colors"
            >
              Try again
            </Link>
          </div>
        </div>

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
