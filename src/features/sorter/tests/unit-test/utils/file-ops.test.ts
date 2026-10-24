import { describe, expect, it } from "vitest"

import { MemoryDirectoryHandle } from "@/test/global-mocks/file-system"
import { applyAssign, getUniqueFileName } from "../../../utils/file-ops.utils"
import type { PhotoFile } from "../../../types/sorter.types"

const photoIn = (dir: MemoryDirectoryHandle, name: string, content = "data"): PhotoFile => {
  const handle = dir.addFile(name, content)
  return {
    id: 0,
    key: name,
    name,
    handle: handle as unknown as FileSystemFileHandle,
    file: new File([content], name),
    url: null,
    size: content.length,
    format: { extensions: [".jpg"], label: "JPEG", category: "standard", previewable: true },
    metadata: { fileSize: content.length, megapixels: 0, isVideo: false, dimensions: { width: 0, height: 0 } }
  }
}

describe("getUniqueFileName", () => {
  it("keeps the name when it is free", async () => {
    const dir = new MemoryDirectoryHandle()
    expect(await getUniqueFileName(dir.asHandle(), "a.jpg")).toBe("a.jpg")
  })

  it("adds _1, _2 … before the extension on collision", async () => {
    const dir = new MemoryDirectoryHandle()
    dir.addFile("a.jpg", "x")
    expect(await getUniqueFileName(dir.asHandle(), "a.jpg")).toBe("a_1.jpg")
    dir.addFile("a_1.jpg", "x")
    expect(await getUniqueFileName(dir.asHandle(), "a.jpg")).toBe("a_2.jpg")
  })

  it("handles names without an extension and dotfiles", async () => {
    const dir = new MemoryDirectoryHandle()
    dir.addFile("README", "x")
    dir.addFile(".hidden", "x")
    expect(await getUniqueFileName(dir.asHandle(), "README")).toBe("README_1")
    expect(await getUniqueFileName(dir.asHandle(), ".hidden")).toBe(".hidden_1")
  })
})

describe("applyAssign", () => {
  it("copy keeps the original and never overwrites an existing target", async () => {
    const root = new MemoryDirectoryHandle()
    const target = await root.getDirectoryHandle("Keep", { create: true })
    target.addFile("a.jpg", "older")
    const photo = photoIn(root, "a.jpg", "new")

    const { createdName } = await applyAssign(photo, target.asHandle(), "copy", root.asHandle())

    expect(createdName).toBe("a_1.jpg")
    expect(await target.files.get("a.jpg")?.text()).toBe("older")
    expect(await target.files.get("a_1.jpg")?.text()).toBe("new")
    expect(root.files.has("a.jpg")).toBe(true)
  })

  it("cut moves the file out of the source folder", async () => {
    const root = new MemoryDirectoryHandle()
    const target = await root.getDirectoryHandle("Keep", { create: true })
    const photo = photoIn(root, "a.jpg", "pixels")

    const { createdName } = await applyAssign(photo, target.asHandle(), "cut", root.asHandle())

    expect(createdName).toBe("a.jpg")
    expect(root.files.has("a.jpg")).toBe(false)
    expect(await target.files.get("a.jpg")?.text()).toBe("pixels")
  })
})
