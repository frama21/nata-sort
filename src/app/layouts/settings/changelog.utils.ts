export interface ReleaseSection {
  title: string
  items: string[]
}

export interface Release {
  version: string
  /** `YYYY-MM-DD`, or whatever the changelog wrote after the dash (e.g. `2025-05`). */
  date?: string
  /** Block quote under the heading (rebrand and breaking-change notices). */
  note?: string
  sections: ReleaseSection[]
}

/** One line of the flattened timeline; this is what the virtual list renders. */
export type ChangelogRow =
  | { kind: "release"; release: Release }
  | { kind: "note"; text: string }
  | { kind: "section"; title: string }
  | { kind: "item"; text: string; last: boolean }

const RELEASE_HEADING = /^## \[([^\]]+)\](?:\s+-\s+(.+))?$/

/**
 * Parses the Keep-a-Changelog subset used by CHANGELOG.md: `## [version] - date`
 * releases, `###` sections, `-` bullets (wrapped lines are joined) and `>` notes.
 * Sections with the same title inside one release are merged.
 * @param markdown Contents of CHANGELOG.md.
 * @returns Releases in file order (newest first); releases with no bullets are dropped.
 */
export function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = []
  let release: Release | undefined
  let section: ReleaseSection | undefined
  let inItem = false

  for (const raw of markdown.split("\n")) {
    const heading = RELEASE_HEADING.exec(raw)
    if (heading) {
      release = { version: heading[1], date: heading[2]?.trim(), sections: [] }
      releases.push(release)
      section = undefined
      inItem = false
    } else if (!release) {
      continue
    } else if (raw.startsWith("### ")) {
      const title = raw.slice(4).trim()
      section = release.sections.find(s => s.title === title)
      if (!section) {
        section = { title, items: [] }
        release.sections.push(section)
      }
      inItem = false
    } else if (raw.startsWith(">")) {
      const text = raw.replace(/^>\s?/, "").trim()
      release.note = release.note ? `${release.note} ${text}` : text
    } else if (raw.startsWith("- ") && section) {
      section.items.push(raw.slice(2).trim())
      inItem = true
    } else if (/^\s+\S/.test(raw) && inItem && section) {
      section.items[section.items.length - 1] += ` ${raw.trim()}`
    } else if (raw.trim() === "") {
      continue
    } else {
      inItem = false
    }
  }

  return releases.filter(r => r.sections.some(s => s.items.length > 0))
}

/**
 * Flattens releases into rows so the list can be virtualized with one element per line.
 * @param releases Output of `parseChangelog`.
 * @returns One row per release heading, note, section title and bullet.
 */
export function toChangelogRows(releases: Release[]): ChangelogRow[] {
  return releases.flatMap(release => {
    const rows: ChangelogRow[] = [{ kind: "release", release }]
    if (release.note) rows.push({ kind: "note", text: release.note })
    for (const section of release.sections) {
      if (section.items.length === 0) continue
      rows.push({ kind: "section", title: section.title })
      for (const text of section.items) rows.push({ kind: "item", text, last: false })
    }
    // The last item of a release carries the gap before the next one.
    const tail = rows[rows.length - 1]
    if (tail.kind === "item") tail.last = true
    return rows
  })
}
