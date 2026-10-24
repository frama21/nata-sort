import { collectFeatureRoutes } from "./route-discovery"

// Build-time discovery: Vite resolves this glob when bundling. Each routes.ts
// only holds lazy() thunks, so loading them eagerly doesn't pull in any pages.
// A feature without routes.ts simply isn't matched; deleting a feature folder
// removes its routes with no registry to edit.
const modules = import.meta.glob("/src/features/*/routes.ts", { eager: true })

const discovered = collectFeatureRoutes(modules)

for (const error of discovered.errors) console.error("[routes]", error)

export const featureRoutes = discovered.routes
