// Captures the install-dialog screenshots in public/screenshots/ from the running production
// build (pnpm build && STATIC_DIR=dist node server/index.js). Uses generated gradient "photos" in
// the browser's private storage, so no real photo ends up in the repo.
// Usage: node scripts/capture-screenshots.mjs [baseUrl]
import { chromium } from "@playwright/test"
import { mkdir } from "node:fs/promises"

const base = process.argv[2] ?? "http://localhost:4180"
const out = new URL("../public/screenshots/", import.meta.url).pathname
await mkdir(out, { recursive: true })

const shots = [
  { file: "wide.png", viewport: { width: 1280, height: 800 }, scale: 1 },
  { file: "narrow.png", viewport: { width: 360, height: 640 }, scale: 1.5, isMobile: true, hasTouch: true }
]

const browser = await chromium.launch()
for (const { file, viewport, scale, ...rest } of shots) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: scale, colorScheme: "dark", ...rest })
  const page = await context.newPage()
  await page.addInitScript(() => {
    window.showDirectoryPicker = async () =>
      (await navigator.storage.getDirectory()).getDirectoryHandle("shots", { create: true })
  })
  await page.goto(base)
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory()
    await root.removeEntry("shots", { recursive: true }).catch(() => {})
    const dir = await root.getDirectoryHandle("shots", { create: true })
    const hues = [200, 28, 150, 330, 55, 260, 10, 180]
    for (const [i, hue] of hues.entries()) {
      const canvas = new OffscreenCanvas(1200, 800)
      const ctx = canvas.getContext("2d")
      const g = ctx.createLinearGradient(0, 0, 1200, 800)
      g.addColorStop(0, `hsl(${hue} 70% 62%)`)
      g.addColorStop(1, `hsl(${(hue + 50) % 360} 60% 22%)`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 1200, 800)
      ctx.fillStyle = `hsl(${hue} 80% 85% / .5)`
      ctx.beginPath()
      ctx.arc(820, 300, 150, 0, Math.PI * 2)
      ctx.fill()
      const w = await (
        await dir.getFileHandle(`IMG_${String(i + 1).padStart(4, "0")}.png`, { create: true })
      ).createWritable()
      await w.write(await canvas.convertToBlob({ type: "image/png" }))
      await w.close()
    }
  })
  await page.getByRole("button", { name: "Choose Photo Folder" }).click()
  await page.getByRole("img", { name: "IMG_0001.png" }).waitFor()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${out}${file}` })
  await context.close()
}
await browser.close()
