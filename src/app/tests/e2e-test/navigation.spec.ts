import { expect, test } from "@playwright/test"

test("unknown URLs show the not-found page with a way home", async ({ page }) => {
  await page.goto("/does/not/exist")
  await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible()
  await page.getByRole("link", { name: "Kembali ke beranda" }).click()
  await expect(page).toHaveURL("/")
})

test("main navigation is built from feature routes", async ({ page }) => {
  await page.goto("/")
  const nav = page.getByRole("navigation", { name: "Navigasi utama" })
  await expect(nav.getByRole("link", { name: "Sortir" })).toHaveAttribute("aria-current", "page")
  await nav.getByRole("link", { name: "Bantuan" }).click()
  await expect(page).toHaveURL("/help")
  await expect(nav.getByRole("link", { name: "Bantuan" })).toHaveAttribute("aria-current", "page")
})
