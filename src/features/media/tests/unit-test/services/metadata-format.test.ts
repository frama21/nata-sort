import { describe, expect, it } from "vitest"

import {
  formatBitrate,
  formatDuration,
  formatFileSize,
  parseCaptureDate
} from "../../../services/metadata.service"

describe("parseCaptureDate", () => {
  const local = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0) =>
    new Date(y, mo - 1, d, h, mi, s).getTime()

  it.each([
    ["EXIF colon format", "2023:01:02 13:04:05", local(2023, 1, 2, 13, 4, 5)],
    ["dashed format", "2023-01-02 13:04:05", local(2023, 1, 2, 13, 4, 5)],
    ["mediainfo UTC prefix", "UTC 2023-01-02 13:04:05", local(2023, 1, 2, 13, 4, 5)],
    ["date only", "2023:01:02", local(2023, 1, 2)]
  ])("parses the %s", (_, input, expected) => {
    expect(parseCaptureDate(input)).toBe(expected)
  })

  it("parses ISO 8601 with a timezone", () => {
    expect(parseCaptureDate("2023-01-02T13:04:05Z")).toBe(Date.UTC(2023, 0, 2, 13, 4, 5))
  })

  it.each([undefined, "", "not a date"])("returns null for %j", input => {
    expect(parseCaptureDate(input)).toBeNull()
  })
})

describe("formatters", () => {
  it.each([
    [0, "0 B"],
    [512, "512 B"],
    [1536, "1.5 KB"],
    [5 * 1024 ** 3, "5 GB"],
    [3 * 1024 ** 5, "3072 TB"]
  ])("formatFileSize(%d) = %s", (bytes, text) => {
    expect(formatFileSize(bytes)).toBe(text)
  })

  it.each([
    [undefined, "-"],
    [0, "-"],
    [65, "1:05"],
    [3723, "1:02:03"]
  ])("formatDuration(%j) = %s", (seconds, text) => {
    expect(formatDuration(seconds)).toBe(text)
  })

  it.each([
    [undefined, "-"],
    [640_000, "640 kbps"],
    [19_500_000, "19.5 Mbps"]
  ])("formatBitrate(%j) = %s", (bps, text) => {
    expect(formatBitrate(bps)).toBe(text)
  })
})
