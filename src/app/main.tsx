import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./styles/globals.css"
import "@/shared/i18n" // initialize i18next (side-effectful) before first render
import { registerPwa } from "@/shared/stores/pwa.store"
import { App } from "./App"

// Service worker + install events (production only; see pwa.store.ts). A new version waits for
// the user to accept it in the update banner (registerType: "prompt").
registerPwa()

const root = document.getElementById("root")
if (!root) throw new Error('Missing <div id="root"> in index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
