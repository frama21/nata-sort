import { afterEach, describe, expect, it, vi } from "vitest"

import { haptic } from "@/shared/lib/haptics"

const setReducedMotion = (reduce: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reduce && query.includes("reduce") }))

describe("haptic", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(navigator, "vibrate")
  })

  it("does nothing where vibration is unsupported", () => {
    setReducedMotion(false)
    expect(() => haptic("success")).not.toThrow()
  })

  it("vibrates briefly on success and in a pattern on error", () => {
    setReducedMotion(false)
    const vibrate = vi.fn()
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true })
    haptic("success")
    haptic("error")
    expect(vibrate).toHaveBeenNthCalledWith(1, 12)
    expect(vibrate).toHaveBeenNthCalledWith(2, [30, 40, 30])
  })

  it("stays silent when the user prefers reduced motion", () => {
    setReducedMotion(true)
    const vibrate = vi.fn()
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true })
    haptic("success")
    expect(vibrate).not.toHaveBeenCalled()
  })
})
