import { cn } from "@/lib/utils"

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl"

interface LogoProps {
  /** Controls wordmark + icon scale. Defaults to "md". */
  size?: LogoSize
  /** Show the chat-bubble icon. Defaults to true. */
  showIcon?: boolean
  className?: string
}

const SIZE_MAP: Record<LogoSize, { text: string; icon: number; gap: string }> = {
  xs: { text: "text-xs", icon: 16, gap: "gap-1.5" },
  sm: { text: "text-sm", icon: 20, gap: "gap-2" },
  md: { text: "text-base", icon: 24, gap: "gap-2" },
  lg: { text: "text-lg", icon: 28, gap: "gap-2" },
  xl: { text: "text-3xl", icon: 36, gap: "gap-3" },
}

/**
 * Canonical EVOCA brand mark. Chat-bubble icon + monospace wordmark in a single
 * foreground color. Use this everywhere EVOCA appears.
 */
export function Logo({ size = "md", showIcon = true, className }: LogoProps) {
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
          <circle cx="9" cy="12" r="1.5" fill="currentColor" />
          <circle cx="14" cy="12" r="1.5" fill="currentColor" />
          <circle cx="19" cy="12" r="1.5" fill="currentColor" />
        </svg>
      )}
      <span className={cn("font-mono font-bold tracking-wide leading-none text-foreground", s.text)}>
        EVOCA
      </span>
    </span>
  )
}
