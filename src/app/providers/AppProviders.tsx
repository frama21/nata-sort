import type { ReactNode } from "react"

import { GlobalErrorBoundary } from "../errors"
import { ThemeProvider } from "./ThemeProvider"

/** App-wide providers. Feature state stays inside features, not here. */
export const AppProviders = ({ children }: { children: ReactNode }) => (
  <GlobalErrorBoundary>
    <ThemeProvider defaultTheme="dark" storageKey="nata-sort-theme">
      {children}
    </ThemeProvider>
  </GlobalErrorBoundary>
)
