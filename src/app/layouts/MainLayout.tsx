import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useLocation, useMatches } from "react-router"

import { UpdateBanner } from "@/shared/components/feedback/UpdateBanner"
import { StatusIndicator } from "@/shared/components/feedback/StatusIndicator"
import type { FeatureRoute } from "@/shared/types/route.types"
import { appConfig } from "../config"
import { Navbar } from "./Navbar"

interface MainLayoutProps {
  navRoutes: FeatureRoute[]
}

/** App shell: skip link, top bar, the active route in `main`, and the toast region. */
export const MainLayout = ({ navRoutes }: MainLayoutProps) => {
  const { t, i18n } = useTranslation()
  const matches = useMatches()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const title = matches
    .map(m => (m.handle as { title?: string } | undefined)?.title)
    .filter(Boolean)
    .at(-1)

  useEffect(() => {
    document.title = title ? `${t(title)} — ${appConfig.name}` : appConfig.title
  }, [title, t])
  // Keep the document language in sync for assistive tech and hyphenation.
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? "en"
  }, [i18n.resolvedLanguage])

  // On a screen change `main` scrolls back to the top and takes focus (unless a dialog
  // did), so keyboard and screen-reader users start at the new content. Skipped on first load.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    mainRef.current?.scrollTo(0, 0)
    if (!document.querySelector("dialog[open]")) mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only z-100 rounded-md bg-surface-raised px-3 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {t("nav.skip")}
      </a>
      <Navbar navRoutes={navRoutes} />
      <UpdateBanner />
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="min-h-0 flex-1 overflow-y-auto outline-none focus-visible:shadow-none"
      >
        <div key={pathname} className="animate-page-enter h-full">
          <Outlet />
        </div>
      </main>
      <StatusIndicator />
    </div>
  )
}
