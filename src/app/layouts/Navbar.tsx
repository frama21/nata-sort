import { useTranslation } from "react-i18next"
import { Link, NavLink } from "react-router"

import { ShortcutsDialog } from "@/features/sorter"
import { StatusIndicator } from "@/shared/components/feedback/StatusIndicator"
import { cn } from "@/shared/lib/utils"
import type { FeatureRoute } from "@/shared/types/route.types"
import { appConfig } from "../config"
import { LanguageToggle } from "./LanguageToggle"
import { ThemeToggle } from "./ThemeToggle"

interface NavbarProps {
  /** Discovered routes that asked for a nav link. */
  navRoutes: FeatureRoute[]
}

export const Navbar = ({ navRoutes }: NavbarProps) => {
  const { t } = useTranslation()
  const links = [...navRoutes].sort((a, b) => (a.nav?.order ?? 0) - (b.nav?.order ?? 0))

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 glass">
      <div className="max-w-7xl mx-auto px-3 md:px-6 h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-3">
          {/* Brand mark: a warm gradient tile with the app initial. */}
          <div className="relative grid place-items-center size-9 rounded-xl bg-gradient-to-br from-primary to-chart-5 shadow-lg shadow-primary/25 ring-1 ring-white/15">
            <span
              aria-hidden
              className="font-display text-lg font-extrabold text-primary-foreground leading-none select-none"
            >
              {appConfig.name.charAt(0)}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-chart-2 ring-2 ring-background" />
          </div>
          <div className="leading-none">
            <h1 className="font-display font-extrabold text-base md:text-xl tracking-tight">{appConfig.name}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground">
              <span className="font-mono">v{appConfig.version}</span>
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              <span className="hidden sm:inline">{t("nav.tagline")}</span>
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 md:gap-2">
          {links.length > 1 && (
            <nav aria-label={t("nav.primary")} className="flex items-center gap-1">
              {links.map(r => (
                <NavLink
                  key={r.path}
                  to={r.path}
                  end
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent",
                      isActive && "bg-accent font-medium"
                    )
                  }
                >
                  {r.nav ? t(r.nav.label) : null}
                </NavLink>
              ))}
            </nav>
          )}
          <StatusIndicator />
          <ShortcutsDialog />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
