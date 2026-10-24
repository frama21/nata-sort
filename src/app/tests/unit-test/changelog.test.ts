import { describe, expect, it } from "vitest"

import changelog from "../../../../CHANGELOG.md?raw"
import { parseChangelog, toChangelogRows } from "../../layouts/settings/changelog.utils"

const SAMPLE = `# Changelog

## [Unreleased]

### Fixed

- First bullet
  wrapped onto a second line.

### Changed

- A change

### Fixed

- Merged into the first Fixed

## [2.0.0] - 2026-06-14

> Breaking note.

### Added

- Something

## [1.0.0] - 2025-05

### Empty
`

describe("parseChangelog", () => {
  const releases = parseChangelog(SAMPLE)

  it("reads versions and dates, dropping releases without bullets", () => {
    expect(releases.map(r => [r.version, r.date])).toEqual([
      ["Unreleased", undefined],
      ["2.0.0", "2026-06-14"]
    ])
  })

  it("joins wrapped lines and merges repeated sections", () => {
    expect(releases[0].sections).toEqual([
      { title: "Fixed", items: ["First bullet wrapped onto a second line.", "Merged into the first Fixed"] },
      { title: "Changed", items: ["A change"] }
    ])
  })

  it("keeps the block quote as the release note", () => {
    expect(releases[1].note).toBe("Breaking note.")
  })

  it("flattens to rows and marks the last bullet of each release", () => {
    const rows = toChangelogRows(releases)
    expect(rows.map(r => r.kind)).toEqual([
      "release",
      "section",
      "item",
      "item",
      "section",
      "item",
      "release",
      "note",
      "section",
      "item"
    ])
    expect(rows.filter(r => r.kind === "item" && r.last)).toHaveLength(2)
  })
})

describe("the real CHANGELOG.md", () => {
  it("parses into releases with content, newest first", () => {
    const releases = parseChangelog(changelog)
    expect(releases[0].version).toBe("Unreleased")
    expect(releases.length).toBeGreaterThan(5)
    expect(releases.at(-1)?.version).toBe("1.1.0")
  })
})
