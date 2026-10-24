/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"
import path from "path"

/**
 * "/" is the only page and its chunk is lazy, so the browser would otherwise only discover it after
 * the entry script has downloaded and run. Preloading it (and the chunks it imports) in index.html
 * lets it download in parallel with the entry. Same-origin, so the CSP is unaffected.
 */
const preloadSorterPage = (): Plugin => ({
  name: "preload-sorter-page",
  transformIndexHtml: {
    order: "post",
    handler(html, ctx) {
      const chunk = Object.values(ctx.bundle ?? {}).find(c => c.type === "chunk" && c.name === "SorterPage")
      if (!chunk || chunk.type !== "chunk") return
      return [chunk.fileName, ...chunk.imports]
        .filter(file => !html.includes(`/${file}"`)) // Vite already preloads the entry's own imports
        .map(file => ({
          tag: "link",
          attrs: { rel: "modulepreload", crossorigin: true, href: `/${file}` },
          injectTo: "head" as const
        }))
    }
  }
})

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    preloadSorterPage(),
    VitePWA({
      // A new service worker waits until the user accepts it in the update banner, so an open
      // page never runs against a half-swapped set of chunks. No skipWaiting/clientsClaim.
      registerType: "prompt",
      // Registered from pwa.store.ts via `virtual:pwa-register` so no inline
      // <script> is injected — keeps it compatible with the strict CSP.
      injectRegister: false,
      manifest: {
        id: "/",
        name: "NATA — Sortir Foto & Video Lokal",
        short_name: "NATA",
        description:
          "Sortir foto dan video lokal ke folder dengan cepat lewat shortcut keyboard. Berjalan sepenuhnya di browser tanpa upload.",
        lang: "id",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        categories: ["photo", "utilities"],
        // One window owns the open project: launching the installed app focuses it.
        launch_handler: { client_mode: "navigate-existing" },
        theme_color: "#1C1C1C",
        background_color: "#1C1C1C",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],
        screenshots: [
          {
            src: "/screenshots/wide.png",
            sizes: "1280x800",
            type: "image/png",
            form_factor: "wide",
            label: "NATA sorting a folder"
          },
          {
            src: "/screenshots/narrow.png",
            sizes: "540x960",
            type: "image/png",
            form_factor: "narrow",
            label: "NATA on a phone"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,wasm,svg,png,ico,woff2}"],
        // libraw wasm is ~1.3 MB; raise the precache size limit to cover it.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Install-dialog images are fetched by the browser, never by the app: keep them out of the precache.
        globIgnores: ["screenshots/**"],
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        // A missing asset must 404, not turn into index.html (the server does the same).
        navigateFallbackDenylist: [/^\/assets\//, /\.[a-z0-9]+$/i]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  optimizeDeps: {
    exclude: ["mediainfo.js"]
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") }
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  // Unit and integration tests live in each feature's tests/ folder. Playwright
  // specs (tests/e2e-test/*.spec.ts) are not matched, so Vitest never runs them.
  test: {
    projects: ["unit", "integration"].map(name => ({
      extends: true,
      test: {
        name,
        include: [`src/**/tests/${name}-test/**/*.test.{ts,tsx}`],
        environment: "jsdom",
        setupFiles: ["src/test/setup.ts"],
        restoreMocks: true
      }
    }))
  }
})
