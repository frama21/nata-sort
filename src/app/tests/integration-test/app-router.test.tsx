import { render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { ThemeProvider } from "@/app/providers"
import { createAppRoutes } from "@/app/routes"
import type { FeatureRoute } from "@/shared/types/route.types"

const pageRoute = (path: string, text: string, extra: Partial<FeatureRoute> = {}): FeatureRoute => ({
  path,
  lazy: async () => ({ Component: () => <h2>{text}</h2> }),
  ...extra
})

const renderAt = (path: string, routes: FeatureRoute[]) => {
  const router = createMemoryRouter(createAppRoutes(routes), { initialEntries: [path] })
  render(
    <ThemeProvider defaultTheme="dark">
      <RouterProvider router={router} />
    </ThemeProvider>
  )
  return router
}

describe("app router", () => {
  it("lazy-loads the feature page for the current path and sets the title", async () => {
    renderAt("/help", [pageRoute("/", "Home"), pageRoute("/help", "Help page", { title: "Bantuan" })])
    expect(await screen.findByRole("heading", { name: "Help page" })).toBeInTheDocument()
    expect(document.title).toBe("Bantuan — Photo Sorter")
  })

  it("lists routes that ask for navigation, in order", async () => {
    renderAt("/", [
      pageRoute("/", "Home", { nav: { label: "Sortir", order: 0 } }),
      pageRoute("/help", "Help", { nav: { label: "Bantuan", order: 10 } }),
      pageRoute("/hidden", "Hidden")
    ])
    const nav = await screen.findByRole("navigation", { name: "Navigasi utama" })
    expect([...nav.querySelectorAll("a")].map(a => a.textContent)).toEqual(["Sortir", "Bantuan"])
  })

  it("shows the not-found page for an unknown path", async () => {
    renderAt("/does-not-exist", [pageRoute("/", "Home")])
    expect(await screen.findByRole("heading", { name: "Halaman tidak ditemukan" })).toBeInTheDocument()
  })

  it("keeps working with no feature routes at all", async () => {
    renderAt("/", [])
    expect(await screen.findByRole("heading", { name: "Halaman tidak ditemukan" })).toBeInTheDocument()
  })

  it("contains a failed lazy route in its own error boundary", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const broken: FeatureRoute = {
      path: "/broken",
      lazy: () => Promise.reject(new Error("chunk failed to load"))
    }
    renderAt("/broken", [pageRoute("/", "Home"), broken])

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("chunk failed to load")
    // The app shell around the route is still rendered.
    expect(screen.getByRole("heading", { name: "Photo Sorter" })).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalled()
  })
})
