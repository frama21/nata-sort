import { expect, test, type Page } from "@playwright/test"

// Same OPFS stand-in for the native folder picker as sorting-flow.spec.ts.
const FOLDER = "e2e-motion"

/** Seeds a three-photo folder and leaves the page on the start screen. */
const seedProject = async (page: Page) => {
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
}

const openProject = async (page: Page) => {
  await seedProject(page)
  await page.getByRole("button", { name: "Choose Photo Folder" }).click()
  await expect(page.getByRole("img", { name: "photo_1.png" })).toBeVisible()
}

test("while the app loads, a splash with the NATA mark and a moving bar is shown, then replaced", async ({
  page
}) => {
  // Hold the entry script back so the static splash in index.html is what the user sees.
  let release!: () => void
  const held = new Promise<void>(resolve => (release = resolve))
  await page.route("**/assets/index-*.js", async route => {
    await held
    await route.continue()
  })
  await page.goto("/", { waitUntil: "commit" })

  const splash = page.locator(".boot")
  await expect(splash).toHaveAttribute("role", "status")
  await expect(splash.locator("svg.boot-mark")).toBeVisible()
  await expect(splash.locator(".boot-bar")).toHaveCSS("animation-name", "boot-slide")

  release()
  await expect(page.getByRole("button", { name: "Choose Photo Folder" })).toBeVisible()
  await expect(splash).toHaveCount(0)
})

test("under reduced motion the splash bar pulses instead of sliding", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.route("**/assets/index-*.js", () => new Promise(() => {})) // never loads
  await page.goto("/", { waitUntil: "commit" })
  await expect(page.locator(".boot-bar")).toHaveCSS("animation-name", "boot-pulse")
})

test("a dialog fades out instead of vanishing, and focus returns to its trigger", async ({ page }) => {
  await page.goto("/")
  const trigger = page.getByRole("button", { name: "Help & settings" })
  await trigger.click()
  const dialog = page.locator("dialog[open]")
  await expect(dialog).toBeVisible()

  // Closing flips `open` at once, but the dialog stays displayed while it transitions out.
  const display = await dialog.evaluate(async (el: HTMLDialogElement) => {
    el.close()
    await new Promise(resolve => requestAnimationFrame(resolve))
    return { open: el.open, display: getComputedStyle(el).display }
  })
  expect(display).toEqual({ open: false, display: "block" })
  await expect(page.locator("dialog[data-slot=dialog]").first()).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("under reduced motion a dialog closes instantly", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await page.getByRole("button", { name: "Help & settings" }).click()
  const display = await page.locator("dialog[open]").evaluate(async (el: HTMLDialogElement) => {
    el.close()
    await new Promise(resolve => requestAnimationFrame(resolve))
    return getComputedStyle(el).display
  })
  expect(display).toBe("none")
})

test("a toast slides out before it is removed", async ({ page }) => {
  await openProject(page)
  const input = page.getByLabel("Add Folder", { exact: true })
  await input.fill("Keep")
  await input.press("Enter")

  const toast = page.locator("div.pointer-events-auto", { hasText: "Keep" })
  await expect(toast).toHaveCSS("animation-name", "slide-in-bottom")
  // The exit lasts ~200 ms, too short to poll for: watch the class instead.
  const slidOut = await page.evaluate(
    () =>
      new Promise<boolean>(resolve => {
        const timer = setTimeout(() => resolve(false), 6000)
        new MutationObserver(() => {
          if (document.querySelector(".animate-toast-out")) {
            clearTimeout(timer)
            resolve(true)
          }
        }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] })
      })
  )
  expect(slidOut).toBe(true)
  await expect(toast).toHaveCount(0)
})

test("stepping to a photo that is still decoding keeps the previous one on screen, then fades the new one in", async ({
  page
}) => {
  await openProject(page)
  // The first photo counts as "shown" once its fade-in has finished.
  await expect
    .poll(() => page.getByRole("img", { name: "photo_1.png" }).evaluate(el => el.getAnimations().length))
    .toBe(0)

  // Hold the next photo's decode open (the viewer's own images only, not the neighbour warm-up).
  await page.evaluate(() => {
    const decode = HTMLImageElement.prototype.decode
    let release: () => void = () => {}
    const gate = new Promise<void>(resolve => (release = resolve))
    HTMLImageElement.prototype.decode = function (this: HTMLImageElement) {
      return this.alt.startsWith("photo_") ? gate.then(() => decode.call(this)) : decode.call(this)
    }
    ;(window as unknown as { __release: () => void }).__release = release
  })

  await page.getByRole("button", { name: "Single" }).focus()
  await page.keyboard.press("ArrowRight")

  const viewer = page.locator("section", { has: page.getByText("photo_2.png", { exact: true }) })
  // The photo that was on screen stays, with a (delayed) loading chip, and nothing blank or skeleton in between.
  await expect(viewer.locator("img[aria-hidden=true]")).toBeVisible()
  await expect(viewer.getByText("Loading…")).toBeVisible()
  await expect(viewer.locator(".skeleton")).toHaveCount(0)
  await expect(viewer.getByRole("img", { name: "photo_2.png" })).toHaveCSS("opacity", "0")

  await page.evaluate(() => (window as unknown as { __release: () => void }).__release())
  await expect(viewer.getByRole("img", { name: "photo_2.png" })).toHaveCSS("opacity", "1")
  await expect(viewer.getByText("Loading…")).toHaveCount(0)
  await expect(viewer.locator("img[aria-hidden=true]")).toHaveCount(0)
})

test("opening a project lifts the start screen away while the workspace slides in", async ({ page }) => {
  await seedProject(page)
  // The overlay lives ~300 ms, too short to poll for: watch the DOM from before the click.
  const seen = page.evaluate(
    () =>
      new Promise<{ inert: boolean; text: boolean; left: boolean; right: boolean }>(resolve => {
        const timer = setTimeout(() => resolve({ inert: false, text: false, left: false, right: false }), 5000)
        new MutationObserver(() => {
          const overlay = document.querySelector(".animate-welcome-out")
          const nav = document.querySelector("nav.animate-slide-in-left")
          const aside = document.querySelector("aside.animate-slide-in-right")
          if (overlay && nav && aside) {
            clearTimeout(timer)
            resolve({
              inert: overlay.hasAttribute("inert"),
              text: !!overlay.textContent?.includes("Choose Photo Folder"),
              left: true,
              right: true
            })
          }
        }).observe(document.body, { subtree: true, childList: true, attributes: true })
      })
  )
  await page.getByRole("button", { name: "Choose Photo Folder" }).click()
  expect(await seen).toEqual({ inert: true, text: true, left: true, right: true })

  await expect(page.locator(".animate-welcome-out")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Choose Photo Folder" })).toHaveCount(0)
})

test.describe("on a short screen", () => {
  test.use({ viewport: { width: 1280, height: 520 } })

  test("the side panels scroll instead of squeezing their cards", async ({ page }) => {
    await openProject(page)
    for (const name of ["One", "Two", "Three"]) {
      const input = page.getByLabel("Add Folder", { exact: true })
      await input.fill(name)
      await input.press("Enter")
      await expect(page.getByLabel(`Change shortcut for folder ${name}`)).toBeVisible()
    }

    for (const panel of [
      page.getByRole("navigation", { name: "Sort Folders" }),
      page.getByRole("complementary", { name: "Photo details" })
    ]) {
      const result = await panel.evaluate(el => ({
        scrolls: el.scrollHeight > el.clientHeight,
        // A card that was squeezed hides part of its content (and clips its buttons).
        squeezed: [...el.querySelectorAll(":scope > [data-slot=card]")].some(
          c => c.scrollHeight > c.clientHeight + 1
        )
      }))
      expect(result.scrolls).toBe(true)
      expect(result.squeezed).toBe(false)
    }
    // The last control of the folders panel is reachable by scrolling.
    await page.getByRole("button", { name: "Unsorted", exact: true }).scrollIntoViewIfNeeded()
    await expect(page.getByRole("button", { name: "Unsorted", exact: true })).toBeInViewport({ ratio: 1 })
  })
})
