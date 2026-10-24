import { expect, test } from "@playwright/test"

test("unknown URLs show the not-found page with a way home", async ({ page }) => {
  await page.goto("/does/not/exist")
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
  await page.getByRole("link", { name: "Back to home" }).click()
  await expect(page).toHaveURL("/")
})

test("the main navigation is hidden while there is only one view", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Help & settings" })).toBeVisible()
})
