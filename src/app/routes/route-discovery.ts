import type { FeatureRoute } from "@/shared/types/route.types"

export interface DiscoveryResult {
  routes: FeatureRoute[]
  errors: string[]
}

const isRoute = (value: unknown): value is FeatureRoute => {
  if (typeof value !== "object" || value === null) return false
  const r = value as Record<string, unknown>
  return typeof r.path === "string" && r.path.startsWith("/") && typeof r.lazy === "function"
}

/**
 * Validate and merge the route modules found by `import.meta.glob`. Invalid
 * modules or routes and duplicate paths are reported in `errors` and skipped,
 * so one broken feature can't take down the others' routes.
 * @param modules Glob result keyed by module path (e.g. "/src/features/help/routes.ts").
 * @returns The valid routes, sorted by path, plus a message per rejected entry.
 */
export const collectFeatureRoutes = (modules: Record<string, unknown>): DiscoveryResult => {
  const routes: FeatureRoute[] = []
  const errors: string[] = []
  const owners = new Map<string, string>()

  for (const [file, mod] of Object.entries(modules).sort(([a], [b]) => a.localeCompare(b))) {
    const list = (mod as { routes?: unknown } | null)?.routes
    if (!Array.isArray(list)) {
      errors.push(`${file}: must export a "routes" array`)
      continue
    }
    for (const route of list) {
      if (!isRoute(route)) {
        errors.push(
          `${file}: invalid route ${JSON.stringify(route)} (needs an absolute "path" and a "lazy" loader)`
        )
        continue
      }
      const owner = owners.get(route.path)
      if (owner) {
        errors.push(`${file}: duplicate path "${route.path}" (already declared in ${owner})`)
        continue
      }
      owners.set(route.path, file)
      routes.push(route)
    }
  }

  return { routes: routes.sort((a, b) => a.path.localeCompare(b.path)), errors }
}
