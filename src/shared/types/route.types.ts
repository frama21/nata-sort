import type { ComponentType } from "react"

/**
 * One route owned by a feature. Declared in `features/<name>/routes.ts` and
 * picked up automatically by the app's route discovery.
 */
export interface FeatureRoute {
  /** Absolute path, e.g. "/" or "/help". Must be unique across features. */
  path: string
  /** Lazily loads the page so the feature's code is split out of the main bundle. */
  lazy: () => Promise<{ Component: ComponentType }>
  /** i18n key of the document title while the route is active. */
  title?: string
  /** When set, the route gets a link in the main navigation. Lower `order` comes first. */
  /** `label` is an i18n key. */
  nav?: { label: string; order?: number }
}

/** Shape every `features/<name>/routes.ts` module must export. */
export interface FeatureRoutesModule {
  routes: FeatureRoute[]
}
