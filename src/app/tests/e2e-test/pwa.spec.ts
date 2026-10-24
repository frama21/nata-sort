import { expect, test, type Page } from "@playwright/test"

/** Loads "/" once the service worker is active, then reloads so this page is under its control. */
const installedPage = async (page: Page) => {
  await page.goto("/")
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
}

test("the manifest is linked and every icon and screenshot it lists is served", async ({ page, request }) => {
  await page.goto("/")
  const href = await page.locator('link[rel="manifest"]').getAttribute("href")
  const res = await request.get(href!)
  expect(res.headers()["content-type"]).toContain("manifest+json")
  const manifest = await res.json()

  expect(manifest).toMatchObject({
    id: "/",
    scope: "/",
    start_url: "/",
    display: "standalone",
    short_name: "NATA",
    launch_handler: { client_mode: "navigate-existing" }
  })
  const files = [...manifest.icons, ...manifest.screenshots].map((i: { src: string }) => i.src)
  expect(files.length).toBeGreaterThanOrEqual(5)
  for (const src of files) {
    const file = await request.get(src)
    expect(file.ok(), src).toBe(true)
    expect(file.headers()["content-type"], src).toContain("image/png")
  }
  expect(manifest.icons.map((i: { purpose: string }) => i.purpose)).toContain("maskable")
})

test("a new page shows no update banner and nothing registers twice", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(r => r.length))).toBe(1)
  await expect(page.getByRole("button", { name: "Reload" })).toHaveCount(0)
})

test("once installed, the app opens offline at / and at a nested address", async ({ page, context }) => {
  await installedPage(page)
  await context.setOffline(true)
  await page.goto("/")
  await expect(page.getByRole("button", { name: "Choose Photo Folder" })).toBeVisible()
  // The worker answers a nested address with the app shell, which shows its own not-found page.
  await page.goto("/some/nested/route")
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
})

test("Settings explains how to install, and offers the button only when the browser allows it", async ({
  page
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Help & settings" }).click()
  await page.getByRole("tab", { name: "About" }).click()
  await expect(page.getByText("Use your browser's install option")).toBeVisible()
  await expect(page.getByRole("button", { name: "Install app" })).toHaveCount(0)

  // Chromium's install event: the page keeps it and shows exactly one button.
  await page.evaluate(() => {
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt: () => Promise.resolve(),
      userChoice: Promise.resolve({ outcome: "dismissed" })
    })
    window.dispatchEvent(event)
  })
  await expect(page.getByRole("button", { name: "Install app" })).toHaveCount(1)
  await page.getByRole("button", { name: "Install app" }).click()
  await expect(page.getByRole("button", { name: "Install app" })).toHaveCount(0)
  await expect(page.getByText("Use your browser's install option")).toBeVisible()
})
