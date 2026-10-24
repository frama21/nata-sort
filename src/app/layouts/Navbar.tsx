import { useTranslation } from "react-i18next"
import { Link, NavLink, useLocation } from "react-router"
import { FolderX } from "lucide-react"

import { NataMark, NataWordmark } from "@/shared/components/brand/NataMark"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import { useProjectStore } from "@/shared/stores/project.store"
import type { FeatureRoute } from "@/shared/types/route.types"
import { appConfig } from "../config"
import { SettingsDialog } from "./settings/SettingsDialog"

interface NavbarProps {
  /** Discovered routes that asked for a nav link. */
  navRoutes: FeatureRoute[]
}

/**
 * Top bar: mark + name, main views in the centre, then Close project (while one is open) and the
 * Settings/help button. On the start screen it shrinks to just the help button, with no
 * background or border, because the page already shows the logo.
 */
export const Navbar = ({ navRoutes }: NavbarProps) => {
  const { t } = useTranslation()
  const closeProject = useProjectStore(s => s.close)
  const projectOpen = useProjectStore(s => s.name !== null)
  const { pathname } = useLocation()
  // The start screen is the sorter route ("/") with no project open.
  const minimal = !projectOpen && pathname === "/"
  const links = [...navRoutes].sort((a, b) => (a.nav?.order ?? 0) - (b.nav?.order ?? 0))

  return (
    <header
      className={cn(
        "z-50 shrink-0 border-b pt-[env(safe-area-inset-top)]",
        minimal ? "border-transparent bg-transparent" : "border-border bg-surface"
      )}
    >
      <div className="grid h-12 grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 md:px-4">
        {minimal ? (
          <h1 className="sr-only">{appConfig.name}</h1>
        ) : (
          <Link to="/" className="flex w-fit items-center gap-2 rounded-md">
            <NataMark className="size-6 text-brand-ink dark:text-brand-paper" />
            <h1 className="flex">
              <NataWordmark className="h-3.5 w-auto text-brand-ink dark:text-brand-paper" />
              <span className="sr-only">{appConfig.name}</span>
            </h1>
          </Link>
        )}

        {links.length > 1 && !minimal ? (
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

        <div className="col-start-3 flex items-center justify-end gap-1">
          {closeProject && (
            <Button variant="ghost" onClick={closeProject}>
              <FolderX />
              <span className="max-sm:sr-only">{t("project.close")}</span>
            </Button>
          )}
          <SettingsDialog />
        </div>
      </div>
    </header>
  )
}
