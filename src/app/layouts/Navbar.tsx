import { useTranslation } from "react-i18next"
import { Link, NavLink, useLocation } from "react-router"
import { FolderX } from "lucide-react"

import { NataMark, NataWordmark } from "@/shared/components/brand/NataMark"
import { ActivityIndicator } from "@/shared/components/feedback/ActivityIndicator"
import { Button } from "@/shared/components/ui/button"
import { isBusy } from "@/shared/lib/activity"
import { useActivity } from "@/shared/lib/useActivity"
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
 * Settings/help button, with the file-activity indicator beside them. On the start screen it shrinks to just the help button, with no
 * background or border, because the page already shows the logo.
 */
export const Navbar = ({ navRoutes }: NavbarProps) => {
  const { t } = useTranslation()
  const closeProject = useProjectStore(s => s.close)
  const projectOpen = useProjectStore(s => s.name !== null)
  const { pathname } = useLocation()
  const activity = useActivity()
  // The start screen is the sorter route ("/") with no project open.
  const minimal = !projectOpen && pathname === "/"
  // Phones: while the activity indicator has a message, the wordmark steps aside to give it room.
  const messageShown = activity.message !== null
  const links = [...navRoutes].sort((a, b) => (a.nav?.order ?? 0) - (b.nav?.order ?? 0))

  return (
    <header
      className={cn(
        "z-50 shrink-0 border-b pt-[env(safe-area-inset-top)]",
        minimal ? "border-transparent bg-transparent" : "border-border bg-surface"
      )}
    >
      <div className="grid h-12 grid-cols-[auto_1fr_auto] items-center gap-2 px-3 md:px-4">
        {minimal ? (
          <h1 className="sr-only">{appConfig.name}</h1>
        ) : (
          <Link to="/" className="flex w-fit items-center gap-2 rounded-md">
            <NataMark className="size-6 text-brand-ink dark:text-brand-paper" />
            <h1
              className={cn(
                "flex overflow-hidden transition-[max-width,opacity,translate] duration-(--dur-slow) ease-(--ease) max-md:max-w-24",
                messageShown && "max-md:-translate-y-3 max-md:max-w-0 max-md:opacity-0"
              )}
            >
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

        <div className="col-start-3 flex min-w-0 items-center justify-end gap-1">
          {/* Open project: always. Start screen: only while something is happening (e.g. reading a folder). */}
          {(projectOpen || isBusy(activity)) && <ActivityIndicator activity={activity} />}
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
