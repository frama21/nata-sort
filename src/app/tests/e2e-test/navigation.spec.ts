import { expect, test } from "@playwright/test"

test("unknown URLs show the not-found page with a way home", async ({ page }) => {
  await page.goto("/does/not/exist")
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
  await page.getByRole("link", { name: "Back to home" }).click()
  await expect(page).toHaveURL("/")
})

test("main navigation is built from feature routes", async ({ page }) => {
  await page.goto("/")
  const nav = page.getByRole("navigation", { name: "Main navigation" })
  await expect(nav.getByRole("link", { name: "Sort" })).toHaveAttribute("aria-current", "page")
  await nav.getByRole("link", { name: "Help" }).click()
  await expect(page).toHaveURL("/help")
  await expect(nav.getByRole("link", { name: "Help" })).toHaveAttribute("aria-current", "page")
})
