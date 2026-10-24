import { useTranslation } from "react-i18next"
import { Link, NavLink } from "react-router"

import { ShortcutsDialog } from "@/features/sorter"
import { NataMark, NataWordmark } from "@/shared/components/brand/NataMark"
import { cn } from "@/shared/lib/utils"
import type { FeatureRoute } from "@/shared/types/route.types"
import { appConfig } from "../config"
import { LanguageToggle } from "./LanguageToggle"
import { ThemeToggle } from "./ThemeToggle"

interface NavbarProps {
  /** Discovered routes that asked for a nav link. */
  navRoutes: FeatureRoute[]
}

/** Top bar: mark + name, main views in the centre, then Help, language and theme. */
export const Navbar = ({ navRoutes }: NavbarProps) => {
  const { t } = useTranslation()
  const links = [...navRoutes].sort((a, b) => (a.nav?.order ?? 0) - (b.nav?.order ?? 0))

  return (
    <header className="z-50 shrink-0 border-b border-border bg-surface pt-[env(safe-area-inset-top)]">
      <div className="grid h-12 grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 md:px-4">
        <Link to="/" className="flex w-fit items-center gap-2 rounded-md">
          <NataMark className="size-6 text-brand-ink dark:text-brand-paper" />
          <h1 className="flex">
            <NataWordmark className="h-3.5 w-auto text-brand-ink max-sm:hidden dark:text-brand-paper" />
            <span className="sr-only">{appConfig.name}</span>
          </h1>
        </Link>

        {links.length > 1 ? (
          <nav
            aria-label={t("nav.primary")}
            className="flex items-center rounded-md border border-border bg-surface p-0.5"
          >
            {links.map(r => (
              <NavLink
                key={r.path}
                to={r.path}
                end
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1 text-[13px] font-medium text-muted-foreground transition-[color,background-color,scale] duration-(--dur-base) ease-(--ease) hover:text-foreground active:scale-[.97] pointer-coarse:py-2.5",
                    isActive && "bg-surface-raised text-foreground"
                  )
                }
              >
                {r.nav ? t(r.nav.label) : null}
              </NavLink>
            ))}
          </nav>
        ) : (
          <span />
        )}

        <div className="flex items-center justify-end gap-1">
          <ShortcutsDialog />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
