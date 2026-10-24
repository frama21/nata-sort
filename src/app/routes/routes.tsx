import type { RouteObject } from "react-router"

import type { FeatureRoute } from "@/shared/types/route.types"
import { MainLayout } from "../layouts/MainLayout"
import { NotFoundPage, RouteErrorBoundary, RouteLoading } from "./route-fallbacks"

/**
 * Turn discovered feature routes into React Router route objects under the main
 * layout. Each feature route gets its own error boundary; unknown paths fall
 * through to the not-found page.
 * @param featureRoutes Routes from `collectFeatureRoutes`.
 * @returns The route tree for `createBrowserRouter` / `createMemoryRouter`.
 */
export const createAppRoutes = (featureRoutes: FeatureRoute[]): RouteObject[] => [
  {
    element: <MainLayout navRoutes={featureRoutes.filter(r => r.nav)} />,
    HydrateFallback: RouteLoading,
    errorElement: <RouteErrorBoundary />,
    children: [
      ...featureRoutes.map((r): RouteObject => ({
        path: r.path,
        // A rejected lazy() (e.g. a chunk that failed to download) doesn't reach the
        // route's errorElement on its own; rethrowing at render time routes it there.
        lazy: () =>
          r.lazy().catch((error: unknown) => ({
            Component: () => {
              throw error
            }
          })),
        handle: { title: r.title },
        errorElement: <RouteErrorBoundary />
      })),
      { path: "*", element: <NotFoundPage />, handle: { title: "Halaman tidak ditemukan" } }
    ]
  }
]
