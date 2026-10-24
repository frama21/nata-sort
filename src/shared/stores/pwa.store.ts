import { create } from "zustand"

import { t } from "@/shared/i18n"
import { useSaveStore } from "./save.store"
import { addStatus } from "./status.store"

/** Chromium's install prompt event; not in the DOM typings. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/** How often an open tab asks the server whether a new version exists. */
const UPDATE_CHECK_MS = 60 * 60 * 1000

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

/** Single owner of PWA state: a waiting update, and whether the browser can show its install prompt. */
export const usePwaStore = create<{
  updateReady: boolean
  updateDismissed: boolean
  installEvent: BeforeInstallPromptEvent | null
  installed: boolean
}>(() => ({ updateReady: false, updateDismissed: false, installEvent: null, installed: false }))

let started = false
let reloading = false
let registration: ServiceWorkerRegistration | undefined

/**
 * Hides the update banner until the next page load.
 * @returns Nothing.
 */
export const dismissUpdate = () => usePwaStore.setState({ updateDismissed: true })

/**
 * Activates the waiting service worker; the page reloads once it takes over (see `registerPwa`).
 * Does nothing while a project write is in flight (the banner disables its button) or after the
 * reload has started, so it cannot loop.
 */
export const applyUpdate = () => {
  if (reloading || useSaveStore.getState().pending > 0 || !registration?.waiting) return
  reloading = true
  registration.waiting.postMessage({ type: "SKIP_WAITING" }) // the generated worker listens for this
}

/**
 * Shows the browser's install prompt (only possible after `beforeinstallprompt`). Dismissing it is
 * not an error. The event is single-use, so it is dropped either way.
 */
export const promptInstall = async () => {
  const event = usePwaStore.getState().installEvent
  if (!event) return
  usePwaStore.setState({ installEvent: null })
  try {
    await event.prompt()
    await event.userChoice
  } catch (err) {
    console.error("[PWA] Install prompt failed:", err)
  }
}

/**
 * Registers the service worker (production only: `vite dev` emits no /sw.js and a worker would
 * fight HMR) and starts listening for the install events. Safe to call more than once.
 */
export const registerPwa = () => {
  if (started || typeof window === "undefined") return
  started = true

  usePwaStore.setState({ installed: isStandalone() })
  window.addEventListener("beforeinstallprompt", e => {
    // Not prevented: Chrome may show its own small, dismissible install hint, and the event can
    // still be kept for the Settings button.
    usePwaStore.setState({ installEvent: e as BeforeInstallPromptEvent })
  })
  window.addEventListener("appinstalled", () => usePwaStore.setState({ installEvent: null, installed: true }))

  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return
  const sw = navigator.serviceWorker
  // Only the tab that asked for the update reloads; other tabs keep their version until the user chooses.
  sw.addEventListener("controllerchange", () => reloading && location.reload())

  const hadController = !!sw.controller
  const track = (worker: ServiceWorker | null) =>
    worker?.addEventListener("statechange", () => {
      // Installed while another version runs: it waits for the user. Activated with nothing running
      // before: the first install, so every file is cached.
      if (worker.state === "installed" && sw.controller)
        usePwaStore.setState({ updateReady: true, updateDismissed: false })
      if (worker.state === "activated" && !hadController)
        addStatus({ type: "success", message: t("pwa.offlineReady"), icon: "folder" })
    })
  const register = () =>
    sw
      .register("/sw.js")
      .then(reg => {
        registration = reg
        if (reg.waiting && sw.controller) usePwaStore.setState({ updateReady: true })
        track(reg.installing)
        reg.addEventListener("updatefound", () => track(reg.installing))

        const check = () => {
          if (navigator.onLine) reg.update().catch(() => undefined) // offline or server down: try again later
        }
        setInterval(check, UPDATE_CHECK_MS)
        // A tab left open for days checks again when the user returns to it.
        let last = Date.now()
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState !== "visible" || Date.now() - last < UPDATE_CHECK_MS / 6) return
          last = Date.now()
          check()
        })
      })
      .catch(err => console.error("[PWA] Service worker registration failed:", err))
  // After the page has loaded, so the worker's precache downloads never compete with it.
  if (document.readyState === "complete") register()
  else window.addEventListener("load", register, { once: true })
}
