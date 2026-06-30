"use client"

import Link from "next/link"
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"

type CtaVariant = "solid" | "outline" | "ghost"

interface CtaButtonBaseProps {
  variant?: CtaVariant
  /** CSS color for the accent. Defaults to the themed `var(--accent)`. */
  accent?: string
  /** Text color when the accent fills the button. Defaults to `var(--accent-text)`. */
  accentText?: string
  className?: string
  children: ReactNode
}

/**
 * Shared call-to-action button for landing/marketing surfaces.
 *
 * Unifies hover feedback across the app: outline buttons fill with the accent,
 * every button lifts slightly with a soft accent-tinted shadow, and presses
 * back down on click. Accent is driven by CSS vars so it adapts to the active
 * role theme, or an explicit color can be passed.
 */
const baseClasses =
  "inline-flex items-center justify-center gap-2 text-center font-mono text-xs font-bold uppercase tracking-wider px-6 py-3 border-2 cursor-pointer select-none " +
  "transition-[transform,box-shadow,background-color,color] duration-150 ease-out " +
  "hover:-translate-y-0.5 hover:shadow-[0_8px_22px_-6px_color-mix(in_srgb,var(--cta-accent)_50%,transparent)] " +
  "active:translate-y-0 active:shadow-none active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-jsconf-bg"

function variantClasses(variant: CtaVariant): string {
  if (variant === "solid") {
    return "bg-[var(--cta-accent)] text-[var(--cta-accent-text)] border-[var(--cta-accent)]"
  }
  if (variant === "ghost") {
    // Subdued secondary: keeps foreground text, only a faint accent tint on hover.
    return "bg-transparent text-foreground border-[var(--cta-accent)] hover:bg-[color-mix(in_srgb,var(--cta-accent)_14%,transparent)]"
  }
  return "bg-transparent text-[var(--cta-accent)] border-[var(--cta-accent)] hover:bg-[var(--cta-accent)] hover:text-[var(--cta-accent-text)]"
}

type CtaButtonProps = CtaButtonBaseProps &
  (
    | ({ href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">)
    | ({ href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">)
  )

export function CtaButton({
  variant = "solid",
  accent = "var(--accent)",
  accentText = "var(--accent-text)",
  className,
  children,
  ...props
}: CtaButtonProps) {
  const styleVars = {
    "--cta-accent": accent,
    "--cta-accent-text": accentText,
  } as CSSProperties

  const classes = cn(baseClasses, variantClasses(variant), className)

  if (props.href) {
    const { href, ...rest } = props
    return (
      <Link href={href} className={classes} style={styleVars} {...rest}>
        {children}
      </Link>
    )
  }

  const { href: _href, ...rest } = props
  return (
    <button className={classes} style={styleVars} {...rest}>
      {children}
    </button>
  )
}
