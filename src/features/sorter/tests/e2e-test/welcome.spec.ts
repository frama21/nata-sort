import { expect, test } from "@playwright/test"

// Picking a real folder needs a native picker, which Playwright can't drive, so
// the sorting flow itself is covered by unit and integration tests.
test("shows the start screen with the folder picker", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle("NATA — Sortir Foto & Video Lokal")
  await expect(page.getByText("Mulai Sortir Foto")).toBeVisible()
  await expect(page.getByRole("button", { name: "Pilih Folder Foto" })).toBeEnabled()
})

test("the theme toggle switches between dark and light", async ({ page }) => {
  await page.goto("/")
  const html = page.locator("html")
  await expect(html).toHaveClass(/dark/)
  await page.getByRole("button", { name: "Toggle theme" }).click()
  await expect(html).not.toHaveClass(/dark/)
})
