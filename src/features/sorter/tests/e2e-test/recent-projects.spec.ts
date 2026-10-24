import { existsSync } from "node:fs"
import { expect, test } from "@playwright/test"

// Reopening a recent project reads a directory handle back from IndexedDB. Playwright's bundled
// Chromium (153) crashes the whole browser on that read for OPFS handles, so this spec runs in
// the system Google Chrome instead and is skipped where it isn't installed.
const CHROME = process.env.CHROME_PATH ?? "/opt/google/chrome/chrome"
test.skip(!existsSync(CHROME), `needs Google Chrome at ${CHROME} (set CHROME_PATH)`)
test.use({ launchOptions: { executablePath: CHROME } })

const FOLDER = "e2e-recent"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(folder => {
    window.showDirectoryPicker = async () =>
      (await navigator.storage.getDirectory()).getDirectoryHandle(folder, { create: true })
  }, FOLDER)
  await page.goto("/")
  await page.evaluate(async folder => {
    const root = await navigator.storage.getDirectory()
    await root.removeEntry(folder, { recursive: true }).catch(() => {})
    const dir = await root.getDirectoryHandle(folder, { create: true })
    for (const [i, color] of ["#e11d48", "#2563eb", "#16a34a"].entries()) {
      const canvas = new OffscreenCanvas(64, 48)
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 64, 48)
      const file = await dir.getFileHandle(`photo_${i + 1}.png`, { create: true })
      const writable = await file.createWritable()
      await writable.write(await canvas.convertToBlob({ type: "image/png" }))
      await writable.close()
    }
  }, FOLDER)
})

test("closing a project lists it under recent projects, which can reopen or remove it", async ({ page }) => {
  await page.getByRole("button", { name: "Choose Photo Folder" }).click()
  await expect(page.getByRole("img", { name: "photo_1.png" })).toBeVisible()
  await page.getByLabel("Add Folder", { exact: true }).fill("Keep")
  await page.getByLabel("Add Folder", { exact: true }).press("Enter")
  await expect(page.getByLabel("Change shortcut for folder Keep")).toHaveText("1")

  await page.getByRole("button", { name: "Close project" }).click()
  await expect(page.getByRole("heading", { name: "NATA", level: 1 })).toBeAttached()
  await expect(page.getByRole("button", { name: "Close project" })).toHaveCount(0)

  const recent = page.getByRole("region", { name: "Recent projects" })
  const row = recent.getByRole("button", { name: new RegExp(`^${FOLDER}`) })
  await expect(row).toContainText("3 photos")
  await expect(page.getByText(/^Version \d+\.\d+\.\d+/)).toBeVisible()

  await row.click()
  await expect(page.getByRole("img", { name: "photo_1.png" })).toBeVisible()
  await expect(page.getByLabel("Change shortcut for folder Keep")).toHaveText("1") // progress restored

  await page.getByRole("button", { name: "Close project" }).click()
  await recent.getByRole("button", { name: `Actions for ${FOLDER}` }).click()
  await page.getByRole("menuitem", { name: "Remove from recent" }).click()
  await expect(recent).toHaveCount(0)
  // Only the list entry went; the folder is untouched.
  const names = await page.evaluate(async folder => {
    const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle(folder)
    const out: string[] = []
    for await (const [name] of dir as unknown as AsyncIterable<[string, FileSystemHandle]>) out.push(name)
    return out.filter(n => n.endsWith(".png")).sort()
  }, FOLDER)
  expect(names).toEqual(["photo_1.png", "photo_2.png", "photo_3.png"])
})
