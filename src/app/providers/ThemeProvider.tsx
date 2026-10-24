import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

// Default is `undefined` so `useTheme()` can detect (and throw on) usage
// outside a <ThemeProvider>.
const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

const THEMES: readonly Theme[] = ["dark", "light", "system"]

/** Stored value if valid, otherwise the default; storage may be blocked or hold junk. */
const readTheme = (key: string, fallback: Theme): Theme => {
  try {
    const stored = localStorage.getItem(key)
    return THEMES.find(t => t === stored) ?? fallback
  } catch {
    return fallback
  }
}

export const ThemeProvider = ({
  children,
  defaultTheme = "dark",
  storageKey = "nata-sort-theme"
}: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => readTheme(storageKey, defaultTheme))

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem(storageKey, theme)
      } catch {
        // Storage unavailable: the choice still applies for this session.
      }
      setTheme(theme)
    }
  }

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
