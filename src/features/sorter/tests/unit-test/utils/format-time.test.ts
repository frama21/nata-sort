import { describe, expect, it } from "vitest"

import { formatRelativeTime } from "../../../utils/format-time.utils"

const NOW = Date.UTC(2026, 9, 24, 12, 0, 0)
const ago = (seconds: number) => NOW - seconds * 1000

describe("formatRelativeTime", () => {
  it("says 'now' under a minute, including clock skew into the future", () => {
    expect(formatRelativeTime(ago(20), "en", NOW)).toBe("now")
    expect(formatRelativeTime(NOW + 5000, "en", NOW)).toBe("now")
  })

  it("picks the largest whole unit", () => {
    expect(formatRelativeTime(ago(5 * 60), "en", NOW)).toBe("5 minutes ago")
    expect(formatRelativeTime(ago(3 * 3600), "en", NOW)).toBe("3 hours ago")
    expect(formatRelativeTime(ago(86400), "en", NOW)).toBe("yesterday")
    expect(formatRelativeTime(ago(9 * 86400), "en", NOW)).toBe("9 days ago")
    expect(formatRelativeTime(ago(400 * 86400), "en", NOW)).toBe("last year")
  })

  it("follows the UI language", () => {
    expect(formatRelativeTime(ago(3 * 3600), "id", NOW)).toBe("3 jam yang lalu")
  })
})
