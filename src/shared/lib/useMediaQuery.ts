import { useSyncExternalStore } from "react"

/**
 * Tracks a CSS media query; used where a panel must render in exactly one place.
 * @param query - A media query string, e.g. `(min-width: 1024px)`.
 * @returns Whether the query currently matches.
 */
export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    notify => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", notify)
      return () => mql.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
