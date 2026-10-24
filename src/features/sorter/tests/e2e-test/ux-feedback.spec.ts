import { expect, test, type Page } from "@playwright/test"

// Same OPFS stand-in for the native folder picker as sorting-flow.spec.ts.
const FOLDER = "e2e-feedback"

type Seed = { name: string; kind: "png" | "text" }[]

const open = async (page: Page, files: Seed) => {
  await page.addInitScript(folder => {
    window.showDirectoryPicker = async () =>
      (await navigator.storage.getDirectory()).getDirectoryHandle(folder, { create: true })
  }, FOLDER)
  await page.goto("/")
  await page.evaluate(
    async ([folder, seed]) => {
      const root = await navigator.storage.getDirectory()
      await root.removeEntry(folder, { recursive: true }).catch(() => {})
      const dir = await root.getDirectoryHandle(folder, { create: true })
      for (const { name, kind } of seed as Seed) {
        let data: Blob | string = "not an image"
        if (kind === "png") {
          const canvas = new OffscreenCanvas(64, 48)
          canvas.getContext("2d")!.fillRect(0, 0, 64, 48)
          data = await canvas.convertToBlob({ type: "image/png" })
        }
        const writable = await (await dir.getFileHandle(name, { create: true })).createWritable()
        await writable.write(data)
        await writable.close()
      }
    },
    [FOLDER, files] as const
  )
  await page.getByRole("button", { name: "Choose Photo Folder" }).click()
}

const addFolder = async (page: Page, name: string) => {
  const input = page.getByLabel("Add Folder", { exact: true })
  await input.fill(name)
  await input.press("Enter")
  await expect(page.getByLabel(`Change shortcut for folder ${name}`)).toBeVisible()
}

test("a folder with nothing to sort explains why, and the message can be dismissed", async ({ page }) => {
  await open(page, [{ name: "notes.txt", kind: "text" }])

  const alert = page.getByRole("main").getByRole("alert")
  await expect(alert).toContainText(`No supported photos found in "${FOLDER}"`)
  await expect(page.getByText("Project loaded successfully")).toHaveCount(0)

  await alert.getByRole("button", { name: "Close" }).click()
  await expect(alert).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Choose Photo Folder" })).toBeVisible()
})

test("a photo that cannot be decoded shows an error with a working retry, not a broken image", async ({
  page
}) => {
  await open(page, [
    { name: "a_good.png", kind: "png" },
    { name: "b_bad.png", kind: "text" }
  ])
  await expect(page.getByRole("img", { name: "a_good.png" })).toBeVisible()

  await page.getByRole("button", { name: "View b_bad.png" }).click()
  await expect(page.getByText("This file could not be displayed")).toBeVisible()
  const retry = page.getByRole("button", { name: "Try again" })
  await expect(retry).toBeVisible()

  // Retry runs a fresh decode attempt and settles back into the error (bounded, no loop).
  await retry.click()
  await expect(page.getByText("This file could not be displayed")).toBeVisible()
})

test("a sort that fails keeps the photo on screen so it can be retried", async ({ page }) => {
  await open(page, [
    { name: "photo_1.png", kind: "png" },
    { name: "photo_2.png", kind: "png" }
  ])
  await expect(page.getByRole("img", { name: "photo_1.png" })).toBeVisible()
  await addFolder(page, "Keep")

  // The sort folder disappears from disk behind the app's back, so the copy fails.
  await page.evaluate(async folder => {
    const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(folder)
    await root.removeEntry("Keep", { recursive: true })
  }, FOLDER)

  await page.getByRole("button", { name: "Single" }).focus()
  await page.keyboard.press("1")
  // Shown in the top bar and announced through the assertive live region.
  await expect(page.getByRole("alert").filter({ hasText: "Failed to process the file" })).toHaveCount(1)
  await expect(page.getByRole("img", { name: "photo_1.png" })).toBeVisible()
  await expect(page.getByRole("img", { name: "photo_2.png" })).toHaveCount(0)
})

test("closing the tab is only blocked while a write is in flight", async ({ page }) => {
  await open(page, [
    { name: "photo_1.png", kind: "png" },
    { name: "photo_2.png", kind: "png" }
  ])
  await expect(page.getByRole("img", { name: "photo_1.png" })).toBeVisible()
  await addFolder(page, "Keep")

  const wouldBlockUnload = () =>
    page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    })
  await expect(page.getByRole("banner").getByRole("status")).toHaveText("Saved")
  expect(await wouldBlockUnload()).toBe(false)

  // Make writes slow enough to observe the in-flight window.
  await page.evaluate(() => {
    const original = FileSystemFileHandle.prototype.createWritable
    FileSystemFileHandle.prototype.createWritable = async function (...args) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return original.apply(this, args)
    }
  })
  await page.getByRole("button", { name: "Single" }).focus()
  await page.keyboard.press("1")
  expect(await wouldBlockUnload()).toBe(true)

  await expect(page.getByRole("img", { name: "photo_2.png" })).toBeVisible()
  await expect(page.getByRole("banner").getByRole("status")).toHaveText("Saved")
  expect(await wouldBlockUnload()).toBe(false)
})

test("under reduced motion a loading spinner pulses instead of freezing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  const animation = await page.evaluate(() => {
    const el = document.createElement("div")
    el.className = "animate-spin"
    document.body.appendChild(el)
    const { animationName, animationIterationCount } = getComputedStyle(el)
    el.remove()
    return { animationName, animationIterationCount }
  })
  expect(animation).toEqual({ animationName: "spinner-pulse", animationIterationCount: "infinite" })
})
