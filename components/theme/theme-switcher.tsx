'use client'

import { useTheme } from './theme-provider'
import { Moon, Sun, Monitor } from 'lucide-react'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 border border-jsconf-border rounded-none p-1">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-none transition-colors ${
          theme === 'light'
            ? 'bg-jsconf-yellow text-jsconf-bg'
            : 'text-jsconf-muted hover:text-jsconf-white'
        }`}
        title="Light mode"
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-none transition-colors ${
          theme === 'system'
            ? 'bg-jsconf-yellow text-jsconf-bg'
            : 'text-jsconf-muted hover:text-jsconf-white'
        }`}
        title="System preference"
        aria-label="System preference"
      >
        <Monitor className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-none transition-colors ${
          theme === 'dark'
            ? 'bg-jsconf-yellow text-jsconf-bg'
            : 'text-jsconf-muted hover:text-jsconf-white'
        }`}
        title="Dark mode"
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  )
}
