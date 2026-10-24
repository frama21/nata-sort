import { existsSync } from "node:fs"
import { expect, test, type Page } from "@playwright/test"

// Closing a project shows the start screen, whose Recent projects list reads a directory handle back
// from IndexedDB. Playwright's bundled Chromium (153) crashes the whole browser on that read for OPFS
// handles, so this spec runs in the system Google Chrome (like recent-projects.spec.ts) and is skipped
// where it isn't installed.
const CHROME = process.env.CHROME_PATH ?? "/opt/google/chrome/chrome"
test.skip(!existsSync(CHROME), `needs Google Chrome at ${CHROME} (set CHROME_PATH)`)
test.use({ launchOptions: { executablePath: CHROME } })

const FOLDER = "e2e-close-motion"

const openProject = async (page: Page) => {
  await page.addInitScript(folder => {
    window.showDirectoryPicker = async () =>
      (await navigator.storage.getDirectory()).getDirectoryHandle(folder, { create: true })
  }, FOLDER)
  await page.goto("/")
  await page.evaluate(async folder => {
    const root = await navigator.storage.getDirectory()
    await root.removeEntry(folder, { recursive: true }).catch(() => {})
    const dir = await root.getDirectoryHandle(folder, { create: true })
    for (let i = 1; i <= 3; i++) {
      const canvas = new OffscreenCanvas(64, 48)
      canvas.getContext("2d")!.fillRect(0, 0, 64, 48)
      const writable = await (await dir.getFileHandle(`photo_${i}.png`, { create: true })).createWritable()
      await writable.write(await canvas.convertToBlob({ type: "image/png" }))
      await writable.close()
    }
  }, FOLDER)
  await page.getByRole("button", { name: "Choose Photo Folder" }).click()
  await expect(page.getByRole("img", { name: "photo_1.png" })).toBeVisible()
  // Let the entrance finish so the exit is the only thing animating the panels.
  await expect(page.locator(".animate-welcome-out")).toHaveCount(0)
}

test("closing a project plays the workspace exit before returning to the start screen", async ({ page }) => {
  await openProject(page)

  // The exit lasts ~280 ms, too short to poll for: watch the DOM from before the click.
  const seen = page.evaluate(
    () =>
      new Promise<{ left: boolean; right: boolean; inert: boolean }>(resolve => {
        const timer = setTimeout(() => resolve({ left: false, right: false, inert: false }), 4000)
        new MutationObserver(() => {
          const left = !!document.querySelector("nav.animate-slide-out-left")
          const right = !!document.querySelector("aside.animate-slide-out-right")
          if (left && right) {
            clearTimeout(timer)
            resolve({ left, right, inert: !!document.querySelector("[inert] nav") })
          }
        }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class", "inert"] })
      })
  )
  await page.getByRole("button", { name: "Close project" }).click()
  expect(await seen).toEqual({ left: true, right: true, inert: true })

  await expect(page.getByRole("button", { name: "Choose Photo Folder" })).toBeVisible()
  await expect(page.getByRole("navigation", { name: "Sort Folders" })).toHaveCount(0)
})

test("under reduced motion closing a project is immediate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await openProject(page)
  await page.getByRole("button", { name: "Close project" }).click()
  // No exit to wait for: well under the 280 ms an exit would take.
  await expect(page.getByRole("button", { name: "Choose Photo Folder" })).toBeVisible({ timeout: 200 })
})
