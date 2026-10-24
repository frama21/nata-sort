import type { FeatureRoute } from "@/shared/types/route.types"

export const routes: FeatureRoute[] = [
  {
    path: "/",
    lazy: () => import("./pages/SorterPage").then(m => ({ Component: m.SorterPage })),
    nav: { label: "Sortir", order: 0 }
  }
]
