'use client'

import { useTheme } from './theme-provider'
import { Moon, Sun } from 'lucide-react'

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center justify-center h-9 w-9 border border-jsconf-border text-jsconf-muted hover:text-foreground hover:border-jsconf-muted transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
