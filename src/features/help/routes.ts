import type { FeatureRoute } from "@/shared/types/route.types"

export const routes: FeatureRoute[] = [
  {
    path: "/help",
    lazy: () => import("./pages/HelpPage").then(m => ({ Component: m.HelpPage })),
    title: "Bantuan",
    nav: { label: "Bantuan", order: 10 }
  }
]
