import { describe, expect, it } from "vitest"

import { getFileFormatInfo, isPreviewable, isSupportedImage } from "../../../config/file-formats"

describe("file format registry", () => {
  it.each(["photo.jpg", "PHOTO.JPG", "clip.mp4", "IMG_0001.CR3", "scan.dng", "logo.svg"])("supports %s", name => {
    expect(isSupportedImage(name)).toBe(true)
    expect(getFileFormatInfo(name)).not.toBeNull()
  })

  it.each(["notes.txt", "archive.zip", "noextension", "photo-sorter-db.json"])("ignores %s", name => {
    expect(isSupportedImage(name)).toBe(false)
    expect(getFileFormatInfo(name)).toBeNull()
  })

  it("classifies RAW files as RAW", () => {
    expect(getFileFormatInfo("IMG_0001.NEF")?.category).toBe("raw")
  })

  it("marks HEIC as supported but not previewable", () => {
    expect(isSupportedImage("IMG_1234.heic")).toBe(true)
    expect(isPreviewable("IMG_1234.heic")).toBe(false)
  })
})
