import { expect, test } from "@playwright/test"

test("help page loads directly by URL with its own title", async ({ page }) => {
  await page.goto("/help")
  await expect(page.getByRole("heading", { level: 2, name: "Help" })).toBeVisible()
  await expect(page).toHaveTitle("Help — NATA")
  await expect(page.getByRole("heading", { level: 3, name: "Privacy" })).toBeVisible()
})
