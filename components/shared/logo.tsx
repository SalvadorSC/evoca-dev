import { cn } from "@/lib/utils"

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl"

interface LogoProps {
  /** Controls wordmark + icon scale. Defaults to "md". */
  size?: LogoSize
  /** Show the chat-bubble icon. Defaults to true. */
  showIcon?: boolean
  /** Show the pulsing "live" dot after the wordmark. Defaults to false. */
  showDot?: boolean
  className?: string
}

const SIZE_MAP: Record<LogoSize, { text: string; icon: number; gap: string; dot: string }> = {
  xs: { text: "text-xs", icon: 16, gap: "gap-1.5", dot: "h-1.5 w-1.5" },
  sm: { text: "text-sm", icon: 20, gap: "gap-2", dot: "h-2 w-2" },
  md: { text: "text-base", icon: 24, gap: "gap-2", dot: "h-2 w-2" },
  lg: { text: "text-lg", icon: 28, gap: "gap-2", dot: "h-2.5 w-2.5" },
  xl: { text: "text-3xl", icon: 36, gap: "gap-3", dot: "h-3 w-3" },
}

/**
 * Canonical EVOCA brand mark. Chat-bubble icon + monospace wordmark with the
 * last two letters ("CA") in brand yellow. Use this everywhere EVOCA appears.
 */
export function Logo({ size = "md", showIcon = true, showDot = false, className }: LogoProps) {
  const s = SIZE_MAP[size]

  return (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      {showIcon && (
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 28 28"
          fill="none"
          className="shrink-0 text-foreground"
          aria-hidden="true"
        >
          <path
            d="M4 6C4 4.89543 4.89543 4 6 4H22C23.1046 4 24 4.89543 24 6V18C24 19.1046 23.1046 20 22 20H10L6 24V20H6C4.89543 20 4 19.1046 4 18V6Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="9" cy="12" r="1.5" fill="var(--jsconf-yellow)" />
          <circle cx="14" cy="12" r="1.5" fill="var(--jsconf-yellow)" />
          <circle cx="19" cy="12" r="1.5" fill="var(--jsconf-yellow)" />
        </svg>
      )}
      <span className={cn("font-mono font-bold tracking-wide leading-none text-foreground", s.text)}>
        EVO<span className="text-jsconf-yellow">CA</span>
      </span>
      {showDot && (
        <span className={cn("relative flex", s.dot)}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jsconf-yellow opacity-75" />
          <span className={cn("relative inline-flex rounded-full bg-jsconf-yellow", s.dot)} />
        </span>
      )}
    </span>
  )
}
