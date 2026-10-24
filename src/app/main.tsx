import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./styles/globals.css"
import "@/shared/i18n" // initialize i18next (side-effectful) before first render
import { App } from "./App"

// Register the PWA service worker. The generated SW uses skipWaiting +
// clientsClaim (registerType: "autoUpdate"), so it self-updates on reload.
// Production only: `vite dev` does not emit /sw.js (the dev server answers with index.html,
// which the browser rejects as "unsupported MIME type text/html"), and a SW would fight HMR.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(err => {
      console.error("[PWA] Service worker registration failed:", err)
    })
  })
}

const root = document.getElementById("root")
if (!root) throw new Error('Missing <div id="root"> in index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
