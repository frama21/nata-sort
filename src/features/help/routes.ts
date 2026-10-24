import type { FeatureRoute } from "@/shared/types/route.types"

export const routes: FeatureRoute[] = [
  {
    path: "/help",
    lazy: () => import("./pages/HelpPage").then(m => ({ Component: m.HelpPage })),
    title: "nav.help",
    nav: { label: "nav.help", order: 10 }
  }
]
