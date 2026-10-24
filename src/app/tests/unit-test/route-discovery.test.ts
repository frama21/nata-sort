import { describe, expect, it } from "vitest"

import { collectFeatureRoutes } from "@/app/routes/route-discovery"

const page = () => Promise.resolve({ Component: () => null })

describe("collectFeatureRoutes", () => {
  it("merges routes from every feature module, sorted by path", () => {
    const { routes, errors } = collectFeatureRoutes({
      "/src/features/b/routes.ts": { routes: [{ path: "/b", lazy: page }] },
      "/src/features/a/routes.ts": { routes: [{ path: "/", lazy: page }] }
    })
    expect(errors).toEqual([])
    expect(routes.map(r => r.path)).toEqual(["/", "/b"])
  })

  it("returns no routes when no feature declares any", () => {
    expect(collectFeatureRoutes({})).toEqual({ routes: [], errors: [] })
  })

  it("rejects a module without a routes array but keeps the others", () => {
    const { routes, errors } = collectFeatureRoutes({
      "/src/features/broken/routes.ts": { default: [] },
      "/src/features/ok/routes.ts": { routes: [{ path: "/ok", lazy: page }] }
    })
    expect(routes.map(r => r.path)).toEqual(["/ok"])
    expect(errors).toEqual(['/src/features/broken/routes.ts: must export a "routes" array'])
  })

  it.each([
    ["a relative path", { path: "relative", lazy: page }],
    ["a missing loader", { path: "/x" }],
    ["a non-object", "nope"]
  ])("rejects a route with %s", (_, route) => {
    const { routes, errors } = collectFeatureRoutes({ "/src/features/x/routes.ts": { routes: [route] } })
    expect(routes).toEqual([])
    expect(errors[0]).toMatch(/invalid route/)
  })

  it("keeps the first declaration of a duplicate path and reports the second", () => {
    const { routes, errors } = collectFeatureRoutes({
      "/src/features/a/routes.ts": { routes: [{ path: "/same", lazy: page, title: "A" }] },
      "/src/features/b/routes.ts": { routes: [{ path: "/same", lazy: page, title: "B" }] }
    })
    expect(routes).toHaveLength(1)
    expect(routes[0].title).toBe("A")
    expect(errors[0]).toMatch(/duplicate path "\/same".*features\/a/)
  })
})
