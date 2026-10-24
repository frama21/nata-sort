import { expect, test } from "@playwright/test"

// Picking a real folder needs a native picker, which Playwright can't drive, so
// the sorting flow itself is covered by unit and integration tests.
test("shows the start screen with the folder picker", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle("NATA — Local Photo & Video Sorter")
  await expect(page.getByRole("heading", { name: "NATA", level: 1 })).toBeAttached()
  await expect(page.getByRole("button", { name: "Choose Photo Folder" })).toBeEnabled()
})

test("theme and language are set in the Appearance tab of the settings dialog", async ({ page }) => {
  await page.goto("/")
  const html = page.locator("html")
  await expect(html).toHaveClass(/dark/)
  await page.getByRole("button", { name: "Help & settings" }).click()
  await page.getByRole("tab", { name: "Appearance" }).click()

  await page.getByRole("radio", { name: "Light" }).click()
  await expect(html).not.toHaveClass(/dark/)

  await page.getByRole("radio", { name: "Bahasa Indonesia" }).click()
  await expect(page.getByRole("dialog", { name: "Pengaturan" })).toBeVisible()
  await expect(html).toHaveAttribute("lang", "id")
})

test("on a phone the changelog scrolls inside a fixed-height panel and stays virtualized", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await page.getByRole("button", { name: "Help & settings" }).click()
  const dialog = page.getByRole("dialog", { name: "Settings" })
  await dialog.getByRole("tab", { name: "Changelog" }).click()

  const timeline = dialog.getByRole("region", { name: "Changelog" })
  await expect(timeline.getByRole("heading", { name: "Unreleased" })).toBeVisible()
  const { height, scrollHeight, mounted } = await timeline.evaluate(el => ({
    height: el.getBoundingClientRect().height,
    scrollHeight: el.scrollHeight,
    mounted: el.querySelectorAll("[data-index]").length
  }))
  expect(height).toBeLessThan(450) // bounded, not as tall as the whole changelog
  expect(scrollHeight).toBeGreaterThan(height * 3) // there is more to scroll
  expect(mounted).toBeLessThan(40) // only the visible rows (plus overscan) are in the DOM
})
