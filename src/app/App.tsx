import { createBrowserRouter, RouterProvider } from "react-router"

import { AppProviders } from "./providers"
import { createAppRoutes, featureRoutes } from "./routes"

const router = createBrowserRouter(createAppRoutes(featureRoutes))

export const App = () => (
  <AppProviders>
    <RouterProvider router={router} />
  </AppProviders>
)
