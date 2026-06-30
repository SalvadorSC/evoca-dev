import { Tv } from "lucide-react"

/**
 * StreamPlayer — responsive 16:9 embed for a live stream.
 *
 * Renders a sandboxed iframe for the given embed URL. Shows a neutral
 * placeholder when no stream is configured. Server-safe (no client hooks) so
 * it can be used on both the dashboard and the public conference page.
 */
export function StreamPlayer({
  embedUrl,
  title = "Live stream",
  className = "",
}: {
  embedUrl: string | null
  title?: string
  className?: string
}) {
  return (
    <div
      className={`relative w-full aspect-video bg-jsconf-bg border border-jsconf-border overflow-hidden ${className}`}
    >
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-jsconf-muted">
          <Tv className="h-6 w-6" />
          <span className="font-mono text-xs uppercase tracking-wider">No stream yet</span>
        </div>
      )}
    </div>
  )
}
