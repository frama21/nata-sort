import { expect, test, type Page } from "@playwright/test"

// The native folder picker can't be automated, so showDirectoryPicker() is
// replaced with a folder in the Origin Private File System. OPFS handles are
// real File System Access handles, so copy/move/undo and the project DB run
// against actual files in real Chromium.
const FOLDER = "e2e-photos"

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

  await page.getByRole("button", { name: "Choose Photo Folder" }).click()
  await expect(page.getByRole("img", { name: "photo_1.png" })).toBeVisible()
  await page.getByLabel("Add Folder", { exact: true }).fill("Keep")
  await page.getByLabel("Add Folder", { exact: true }).press("Enter")
  await expect(page.getByLabel("Change shortcut for folder Keep")).toHaveText("1")
  await page.getByRole("button", { name: "Single" }).focus()
})

/** Sorted file tree of the test folder (DB file excluded): files first, then folders. */
const tree = (page: Page) =>
  page.evaluate(async folder => {
    const list = async (dir: FileSystemDirectoryHandle): Promise<unknown[]> => {
      const out: unknown[] = []
      for await (const [name, handle] of dir as unknown as AsyncIterable<[string, FileSystemHandle]>) {
        if (name === "nata-sort-db.json") continue
        out.push(handle.kind === "directory" ? { [name]: await list(handle as FileSystemDirectoryHandle) } : name)
      }
      return out.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
    }
    return list(await (await navigator.storage.getDirectory()).getDirectoryHandle(folder))
  }, FOLDER)

test("sorting reports in the top bar status, not in a toast or the footer", async ({ page }) => {
  const status = page.getByRole("banner").getByRole("status")
  await expect(status).toHaveText("Saved")

  await page.keyboard.press("1")
  await expect(status).toHaveText("photo_1.png done")
  // Only the top bar's live region carries it: no toast, and the footer has no save state.
  await expect(page.getByRole("status").filter({ hasText: "photo_1.png done" })).toHaveCount(1)
  await expect(page.locator("footer")).not.toContainText("Saved")
  // It settles back to idle.
  await expect(status).toHaveText("Saved")
})

test("copy keeps the original; a shortcut sorts and advances", async ({ page }) => {
  await page.keyboard.press("1")
  await expect(page.getByRole("img", { name: "photo_2.png" })).toBeVisible()
  await expect
    .poll(() => tree(page))
    .toEqual(["photo_1.png", "photo_2.png", "photo_3.png", { Keep: ["photo_1.png"] }])
})

test("cut moves the file and undo moves it back", async ({ page }) => {
  await page.getByRole("tab", { name: "Cut" }).click()
  await page.getByRole("button", { name: "Single" }).focus()

  await page.keyboard.press("1")
  await expect.poll(() => tree(page)).toEqual(["photo_2.png", "photo_3.png", { Keep: ["photo_1.png"] }])

  await page.keyboard.press("Control+z")
  await expect.poll(() => tree(page)).toEqual(["photo_1.png", "photo_2.png", "photo_3.png", { Keep: [] }])
  await expect(page.getByRole("img", { name: "photo_1.png" })).toBeVisible()
})

test("arrow keys in the mode tabs switch tabs without changing the photo", async ({ page }) => {
  await page.getByRole("tab", { name: "Copy" }).focus()
  await page.keyboard.press("ArrowRight")
  await expect(page.getByRole("tab", { name: "Cut" })).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("img", { name: "photo_1.png" })).toBeVisible()
})

test("shortcuts are ignored while the shortcuts dialog is open", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Help & settings" })
  await trigger.click()
  const dialog = page.getByRole("dialog", { name: "Settings" })
  await expect(dialog).toBeVisible()

  await page.keyboard.press("1")
  // Negative check: give a (wrongly) triggered sort time to finish before asserting nothing changed.
  await page.waitForTimeout(750)
  expect(await tree(page)).toEqual(["photo_1.png", "photo_2.png", "photo_3.png", { Keep: [] }])
  await expect(page.getByText("0 sorted")).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("the settings dialog opens on Shortcuts and has Appearance, About and Changelog tabs", async ({ page }) => {
  await page.getByRole("button", { name: "Help & settings" }).click()
  const dialog = page.getByRole("dialog", { name: "Settings" })
  await expect(dialog.getByRole("tab", { name: "Shortcuts" })).toHaveAttribute("aria-selected", "true")
  await expect(dialog.getByText("Undo the last action")).toBeVisible()
  await dialog.getByRole("tab", { name: "About" }).click()
  await expect(dialog.getByRole("heading", { name: "Privacy" })).toBeVisible()
  await expect(dialog.getByText(/nata-sort-db\.json/)).toBeVisible()
  await expect(dialog.getByText(/^\d+\.\d+\.\d+$/)).toBeVisible() // app version
  await expect(dialog.getByText("Keep")).toHaveCount(0)
  await expect(dialog.getByText("e2e-photos")).toBeVisible() // the open project

  await dialog.getByRole("tab", { name: "Changelog" }).click()
  const timeline = dialog.getByRole("region", { name: "Changelog" })
  await expect(timeline.getByRole("heading", { name: /^v\d+\.\d+\.\d+$/ }).first()).toBeVisible()
  // Virtualized: the oldest release is not mounted until scrolled to.
  await expect(timeline.getByRole("heading", { name: "v1.1.0" })).toHaveCount(0)
  await timeline.evaluate(el => el.scrollTo({ top: el.scrollHeight }))
  await expect(timeline.getByRole("heading", { name: "v1.1.0" })).toBeVisible()

  // Reopening always lands on Shortcuts, not on the tab that was open last.
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await page.getByRole("button", { name: "Help & settings" }).click()
  await expect(dialog.getByRole("tab", { name: "Shortcuts" })).toHaveAttribute("aria-selected", "true")
})
