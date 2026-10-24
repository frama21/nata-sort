import { expect, test, type Page } from "@playwright/test"

// Same OPFS stand-in for the native folder picker as sorting-flow.spec.ts.
const FOLDER = "e2e-safety"

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
    for (let i = 1; i <= 3; i++) {
      const canvas = new OffscreenCanvas(64, 48)
      canvas.getContext("2d")!.fillRect(0, 0, 64, 48)
      const file = await dir.getFileHandle(`photo_${i}.png`, { create: true })
      const writable = await file.createWritable()
      await writable.write(await canvas.convertToBlob({ type: "image/png" }))
      await writable.close()
    }
  }, FOLDER)
  await page.getByRole("button", { name: "Choose Photo Folder" }).click()
  await expect(page.getByRole("img", { name: "photo_1.png" })).toBeVisible()
})

const addFolder = async (page: Page, name: string) => {
  const input = page.getByLabel("Add Folder", { exact: true })
  await input.fill(name)
  await input.press("Enter")
  await expect(page.getByLabel(`Change shortcut for folder ${name}`)).toBeVisible()
}

/** Files inside the sort folder `name`, read from disk. */
const filesIn = (page: Page, name: string) =>
  page.evaluate(
    async ([folder, sub]) => {
      const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(folder)
      try {
        const dir = await root.getDirectoryHandle(sub)
        const names: string[] = []
        for await (const [n] of dir as unknown as AsyncIterable<[string, FileSystemHandle]>) names.push(n)
        return names.sort()
      } catch {
        return null // the folder does not exist
      }
    },
    [FOLDER, name] as const
  )

for (const [mode, verb] of [
  ["Copy", "Copy"],
  ["Cut", "Move"]
] as const) {
  test(`${mode}: a shortcut that fires twice before the first sort finishes sorts the photo once`, async ({
    page
  }) => {
    await addFolder(page, "Keep")
    await page.getByRole("tab", { name: mode }).click()
    await page.getByRole("button", { name: "Single" }).focus()

    // Two keydowns in the same tick, like key auto-repeat or a double-click on "Sort".
    await page.evaluate(() => {
      for (let i = 0; i < 2; i++) {
        document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true }))
      }
    })
    await expect(page.getByRole("img", { name: "photo_2.png" })).toBeVisible()
    // No spurious failure in the top bar, and exactly one entry in the log.
    await expect(page.getByRole("banner").getByRole("status")).toHaveText("Saved")
    await expect(
      page
        .locator("aside")
        .getByRole("listitem")
        .filter({ hasText: `${verb} → Keep` })
    ).toHaveCount(1)
    expect(await filesIn(page, "Keep")).toEqual(["photo_1.png"])
  })
}

test("a rejected folder name stays in the field with an inline error", async ({ page }) => {
  const input = page.getByLabel("Add Folder", { exact: true })
  await input.fill("a/b")
  await input.press("Enter")

  await expect(input).toHaveValue("a/b")
  await expect(input).toHaveAttribute("aria-invalid", "true")
  const error = page.locator(`#${await input.getAttribute("aria-describedby")}`)
  await expect(error).toBeVisible()
  // Editing the name clears the error.
  await input.fill("ab")
  await expect(input).not.toHaveAttribute("aria-invalid", "true")
})

test("deleting a folder asks first; cancel keeps it and its files", async ({ page }) => {
  await addFolder(page, "Keep")
  await page.getByRole("button", { name: "Single" }).focus()
  await page.keyboard.press("1")
  await expect.poll(() => filesIn(page, "Keep")).toEqual(["photo_1.png"])

  const trigger = page.getByRole("button", { name: "Delete folder Keep" })
  await trigger.click()
  const dialog = page.getByRole("dialog", { name: /Delete folder/ })
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "Keep folder" }).click()

  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused() // focus returns to where the user was
  expect(await filesIn(page, "Keep")).toEqual(["photo_1.png"])

  await trigger.click()
  await dialog.getByRole("button", { name: "Delete folder", exact: true }).click()
  await expect.poll(() => filesIn(page, "Keep")).toBeNull()
  await expect(page.getByLabel("Change shortcut for folder Keep")).toHaveCount(0)
})

test("on a tablet, Escape cancels the delete confirmation but keeps the folders sheet open", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await page.getByRole("button", { name: "Folders" }).click()
  await addFolder(page, "Keep")

  const trigger = page.getByRole("button", { name: "Delete folder Keep" })
  await trigger.click()
  await expect(page.getByRole("dialog", { name: /Delete folder/ })).toBeVisible()
  await page.keyboard.press("Escape")

  await expect(page.getByRole("dialog", { name: /Delete folder/ })).toBeHidden()
  await expect(trigger).toBeVisible() // the sheet is still open, with the folder in it
  await expect(trigger).toBeFocused()
})

test("on a tablet with no folder, the action bar leads to the folders sheet", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await page.getByRole("button", { name: "Add a folder to start sorting" }).click()
  await expect(page.getByLabel("Add Folder", { exact: true })).toBeVisible()
})
