import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./styles/globals.css"
import { App } from "./App"

// Register the PWA service worker. The generated SW uses skipWaiting +
// clientsClaim (registerType: "autoUpdate"), so it self-updates on reload.
if ("serviceWorker" in navigator) {
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
