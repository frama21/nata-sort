// Short vibration patterns (ms). Subtle on purpose; the visual feedback is always shown as well.
const PATTERNS = { success: 12, error: [30, 40, 30] } as const

/**
 * A brief vibration confirming (or rejecting) an action. Only Chromium on Android implements
 * `navigator.vibrate`; everywhere else this does nothing. Skipped when the user asked for reduced motion.
 * @param kind "success" is a single short tick; "error" is a double pulse.
 */
export const haptic = (kind: keyof typeof PATTERNS) => {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  navigator.vibrate(PATTERNS[kind] as number | number[])
}
