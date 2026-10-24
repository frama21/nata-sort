import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

/** A service worker whose state the tests drive. */
class FakeWorker extends EventTarget {
  state = "installing"
  postMessage = vi.fn()
  setState(state: string) {
    this.state = state
    this.dispatchEvent(new Event("statechange"))
  }
}
class FakeRegistration extends EventTarget {
  installing: FakeWorker | null = null
  waiting: FakeWorker | null = null
  update = vi.fn().mockResolvedValue(undefined)
}
class FakeContainer extends EventTarget {
  controller: object | null = null
  registration = new FakeRegistration()
  register = vi.fn(() => Promise.resolve(this.registration))
}
let sw: FakeContainer

// Fresh module state (started / reloading flags) for every test. The stores are re-imported
// together so the store under test and the ones it reads are the same instances.
const load = async () => {
  vi.resetModules()
  return {
    ...(await import("@/shared/stores/pwa.store")),
    ...(await import("@/shared/stores/save.store")),
    ...(await import("@/shared/stores/status.store")),
    ...(await import("@/shared/components/feedback/UpdateBanner"))
  }
}

/** Lets the mocked `register()` promise settle. */
const settle = () => act(() => Promise.resolve())

beforeEach(() => {
  vi.stubEnv("PROD", true)
  sw = new FakeContainer()
  Object.defineProperty(navigator, "serviceWorker", { value: sw, configurable: true })
  vi.stubGlobal("matchMedia", () => ({ matches: false }))
})

describe("registerPwa", () => {
  it("registers the worker once, however many times it is called", async () => {
    const { registerPwa } = await load()
    registerPwa()
    registerPwa()
    await settle()
    expect(sw.register).toHaveBeenCalledExactlyOnceWith("/sw.js")
  })

  it("does not register outside production", async () => {
    vi.stubEnv("PROD", false)
    const { registerPwa } = await load()
    registerPwa()
    await settle()
    expect(sw.register).not.toHaveBeenCalled()
  })

  it("on the first install it announces offline use once and shows no update banner", async () => {
    const { registerPwa, usePwaStore, useStatusStore } = await load()
    registerPwa()
    await settle()
    const worker = new FakeWorker()
    sw.registration.installing = worker
    sw.registration.dispatchEvent(new Event("updatefound"))
    worker.setState("installed")
    worker.setState("activated")
    expect(useStatusStore.getState().statuses).toHaveLength(1)
    expect(usePwaStore.getState().updateReady).toBe(false)
  })

  it("a new version installed under a running one waits for the user", async () => {
    sw.controller = {}
    const { registerPwa, usePwaStore, useStatusStore } = await load()
    registerPwa()
    await settle()
    const worker = new FakeWorker()
    sw.registration.installing = worker
    sw.registration.dispatchEvent(new Event("updatefound"))
    worker.setState("installed")
    expect(usePwaStore.getState().updateReady).toBe(true)
    expect(useStatusStore.getState().statuses).toHaveLength(0)
  })

  it("keeps the install prompt for the button and drops it after use or install", async () => {
    const { registerPwa, usePwaStore, promptInstall } = await load()
    registerPwa()
    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: "dismissed" })
    })
    window.dispatchEvent(event)
    expect(usePwaStore.getState().installEvent).toBe(event)

    await promptInstall() // dismissing is not an error
    expect(prompt).toHaveBeenCalledOnce()
    expect(usePwaStore.getState().installEvent).toBeNull()

    window.dispatchEvent(new Event("appinstalled"))
    expect(usePwaStore.getState().installed).toBe(true)
  })
})

describe("applyUpdate", () => {
  const withWaitingUpdate = async () => {
    sw.controller = {}
    sw.registration.waiting = new FakeWorker()
    const modules = await load()
    modules.registerPwa()
    await settle()
    return modules
  }

  it("flags a worker that was already waiting when the page opened", async () => {
    const { usePwaStore } = await withWaitingUpdate()
    expect(usePwaStore.getState().updateReady).toBe(true)
  })

  it("waits while a save is running, then asks the worker to take over once", async () => {
    const { applyUpdate, useSaveStore } = await withWaitingUpdate()
    useSaveStore.setState({ pending: 1 })
    applyUpdate()
    expect(sw.registration.waiting!.postMessage).not.toHaveBeenCalled()

    useSaveStore.setState({ pending: 0 })
    applyUpdate()
    applyUpdate()
    expect(sw.registration.waiting!.postMessage).toHaveBeenCalledExactlyOnceWith({ type: "SKIP_WAITING" })
  })

  it("reloads only the tab that asked, and only once control changes", async () => {
    const reload = vi.fn()
    vi.stubGlobal("location", { reload })
    const { applyUpdate } = await withWaitingUpdate()
    sw.dispatchEvent(new Event("controllerchange")) // another tab updated
    expect(reload).not.toHaveBeenCalled()

    applyUpdate()
    sw.dispatchEvent(new Event("controllerchange"))
    expect(reload).toHaveBeenCalledOnce()
  })
})

describe("UpdateBanner", () => {
  it("shows once an update is ready, disables Reload while saving, and hides on Later", async () => {
    const { registerPwa, usePwaStore, useSaveStore, UpdateBanner } = await load()
    registerPwa()
    render(<UpdateBanner />)
    expect(screen.queryByRole("button", { name: "Reload" })).toBeNull()

    act(() => usePwaStore.setState({ updateReady: true }))
    expect(screen.getByRole("button", { name: "Reload" })).toBeEnabled()

    act(() => useSaveStore.setState({ pending: 1 }))
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled()
    act(() => useSaveStore.setState({ pending: 0 }))

    await userEvent.click(screen.getByRole("button", { name: "Later" }))
    expect(screen.queryByRole("button", { name: "Reload" })).toBeNull()
  })
})
