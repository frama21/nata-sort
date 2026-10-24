import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, ScrollRestoration, useMatches } from "react-router"

import type { FeatureRoute } from "@/shared/types/route.types"
import { appConfig } from "../config"
import { Navbar } from "./Navbar"

interface MainLayoutProps {
  navRoutes: FeatureRoute[]
}

/** App shell: navbar + the active route, with the document title following the route. */
export const MainLayout = ({ navRoutes }: MainLayoutProps) => {
  const { t, i18n } = useTranslation()
  const matches = useMatches()
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

  return (
    <div className="min-h-screen text-gray-900 dark:text-white transition-colors duration-300">
      <Navbar navRoutes={navRoutes} />
      <main className="container mx-auto px-3 py-6 md:px-6">
        <Outlet />
      </main>
      {/* New pages start at the top; back/forward restores the previous position. */}
      <ScrollRestoration />
    </div>
  )
}
