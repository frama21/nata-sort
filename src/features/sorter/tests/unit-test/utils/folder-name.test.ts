import { describe, expect, it } from "vitest"

import { validateFolderName } from "../../../utils/folder-name.utils"

describe("validateFolderName", () => {
  it("trims and accepts a normal name", () => {
    expect(validateFolderName("  Keep  ")).toEqual({ ok: true, name: "Keep" })
  })

  it.each([
    ["empty", "   "],
    ["too long", "a".repeat(201)],
    ["dot", "."],
    ["dot-dot", ".."],
    ["path separator", "a/b"],
    ["backslash", "a\\b"],
    ["illegal character", "what?"],
    ["control character", "bad\u0007name"],
    ["trailing dot", "name."],
    ["reserved device name", "CON"],
    ["reserved device name with extension", "lpt1.txt"]
  ])("rejects a %s", (_, input) => {
    const result = validateFolderName(input)
    expect(result.ok).toBe(false)
  })

  it("accepts the maximum length", () => {
    expect(validateFolderName("a".repeat(200)).ok).toBe(true)
  })
})
