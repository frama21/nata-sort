import { defineConfig, devices } from "@playwright/test"

const PORT = 4173

// E2E specs live next to the feature they cover: src/**/tests/e2e-test/*.spec.ts.
// Chromium only: the app requires the File System Access API.
export default defineConfig({
  testDir: "src",
  testMatch: "**/tests/e2e-test/**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Test the production build, served by Vite's preview server.
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
})
