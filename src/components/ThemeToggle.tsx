import { useEffect, useState } from 'react'
import { applyTheme, getInitialTheme, type Theme } from '../lib/theme'
import { IconMoon, IconSun } from './icons'

export function ThemeToggle(): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      className="tool-btn"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      data-tooltip={`${next === 'dark' ? 'Dark' : 'Light'} theme`}
    >
      {theme === 'dark' ? <IconSun /> : <IconMoon />}
    </button>
  )
}
