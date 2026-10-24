import { expect, test } from "@playwright/test"

// Same OPFS stand-in for the native folder picker as sorting-flow.spec.ts.
const FOLDER = "e2e-context"
const COUNT = 80

test.beforeEach(async ({ page }) => {
  await page.addInitScript(folder => {
    window.showDirectoryPicker = async () =>
      (await navigator.storage.getDirectory()).getDirectoryHandle(folder, { create: true })
    // Record which URLs the viewer decodes ahead of time. The warm-up uses detached `new Image()`s; the
    // displayed image also calls decode() (to fade in once it can paint), which is not a warm-up.
    const decoded: string[] = []
    ;(window as unknown as { __decoded: string[] }).__decoded = decoded
    const decode = HTMLImageElement.prototype.decode
    HTMLImageElement.prototype.decode = function () {
      if (!this.isConnected) decoded.push(this.src)
      return decode.call(this)
    }
  }, FOLDER)
  await page.goto("/")
  await page.evaluate(
    async ([folder, count]) => {
      const root = await navigator.storage.getDirectory()
      await root.removeEntry(folder, { recursive: true }).catch(() => {})
      const dir = await root.getDirectoryHandle(folder, { create: true })
      for (let i = 1; i <= count; i++) {
        const canvas = new OffscreenCanvas(64, 48)
        canvas.getContext("2d")!.fillRect(0, 0, 64, 48)
        const file = await dir.getFileHandle(`photo_${String(i).padStart(3, "0")}.png`, { create: true })
        const writable = await file.createWritable()
        await writable.write(await canvas.convertToBlob({ type: "image/png" }))
        await writable.close()
      }
    },
    [FOLDER, COUNT] as const
  )
  await page.getByRole("button", { name: "Choose Photo Folder" }).click()
  await expect(page.getByRole("img", { name: "photo_001.png" })).toBeVisible()
})

test("the neighbouring photos are decoded ahead of time", async ({ page }) => {
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __decoded: string[] }).__decoded.length))
    .toBeGreaterThanOrEqual(1)
  const shown = await page.getByRole("img", { name: "photo_001.png" }).getAttribute("src")
  const decoded = await page.evaluate(() => (window as unknown as { __decoded: string[] }).__decoded)
  // Photo 1 has no previous photo, so the only warm-up is photo 2, never the one on screen.
  expect(decoded.every(src => src !== shown)).toBe(true)
})

test("returning to the grid centres it on the current photo", async ({ page }) => {
  await page.getByRole("button", { name: "Grid" }).click()
  await page.getByRole("button", { name: "View photo_070.png" }).scrollIntoViewIfNeeded()
  await page.getByRole("button", { name: "View photo_070.png" }).click()
  await expect(page.getByRole("img", { name: "photo_070.png" })).toBeVisible()

  await page.getByRole("button", { name: "Grid" }).click()
  const current = page.getByRole("button", { name: "View photo_070.png" })
  await expect(current).toBeInViewport({ ratio: 1 })
})

test.describe("on a short screen", () => {
  // Short enough that the page scrolls, with the filmstrip below the fold.
  test.use({ viewport: { width: 320, height: 480 } })

  test("stepping through photos keeps the page still and the filmstrip on the current photo", async ({ page }) => {
    const main = page.locator("main")
    expect(await main.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)

    await page.getByRole("button", { name: "Next photo" }).last().focus()
    for (let i = 0; i < 15; i++) await page.keyboard.press("ArrowRight")
    await expect(page.getByRole("img", { name: "photo_016.png" })).toBeVisible()

    // The filmstrip scrolls sideways inside itself; it must not scroll the page.
    expect(await main.evaluate(el => el.scrollTop)).toBe(0)
    // The strip glides to the current photo, so wait for it to settle.
    await expect
      .poll(() =>
        page.getByRole("button", { name: "View photo_016.png" }).evaluate(el => {
          const strip = el.closest('[data-slot="scroll-area-viewport"]')!.getBoundingClientRect()
          const thumb = el.getBoundingClientRect()
          return thumb.left >= strip.left - 1 && thumb.right <= strip.right + 1
        })
      )
      .toBe(true)
    expect(await main.evaluate(el => el.scrollTop)).toBe(0)
  })
})
