import { Fragment, useRef, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useVirtualizer } from "@tanstack/react-virtual"

import { cn } from "@/shared/lib/utils"

import changelogMarkdown from "../../../../CHANGELOG.md?raw"
import { parseChangelog, toChangelogRows, type ChangelogRow } from "../utils/changelog.utils"

const ROWS = toChangelogRows(parseChangelog(changelogMarkdown))

// First guess per row kind; the real height is measured once the row is on screen.
const ESTIMATE: Record<ChangelogRow["kind"], number> = { release: 44, note: 48, section: 32, item: 52 }

const SECTION_TONE: Record<string, string> = {
  added: "text-success",
  changed: "text-accent",
  fixed: "text-warning",
  security: "text-destructive"
}

const INLINE = /(`[^`]+`|\*\*.+?\*\*|\[[^\]]+\]\([^)]+\))/

/** `code`, **bold** and [links](url) as React nodes; link targets are repo paths, so only the label is kept. */
function renderInline(text: string): ReactNode {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("`")) {
      return (
        <code key={i} className="rounded bg-surface-hover px-1 py-0.5 font-mono text-[11px] text-foreground">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {renderInline(part.slice(2, -2))}
        </strong>
      )
    }
    const link = /^\[([^\]]+)\]\(/.exec(part)
    return <Fragment key={i}>{link ? link[1] : part}</Fragment>
  })
}

const formatDate = (date: string, language: string) => {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : null
  return parsed ? parsed.toLocaleDateString(language, { year: "numeric", month: "short", day: "numeric" }) : date
}

const TimelineRow = ({ row }: { row: ChangelogRow }) => {
  const { t, i18n } = useTranslation()

  if (row.kind === "release") {
    const { version, date } = row.release
    const unreleased = version.toLowerCase() === "unreleased"
    return (
      <div className="flex items-center gap-2 pt-1 pb-2">
        <span
          aria-hidden
          className={cn(
            "absolute top-[15px] left-0 size-[11px] rounded-full border-2 bg-surface-raised",
            unreleased ? "border-accent bg-accent" : "border-border-strong"
          )}
        />
        <h3 className="text-sm font-semibold">{unreleased ? t("changelog.unreleased") : `v${version}`}</h3>
        {date && <span className="text-xs text-muted-foreground">{formatDate(date, i18n.language)}</span>}
      </div>
    )
  }

  if (row.kind === "note") {
    return (
      <p className="mb-2 rounded-md border border-border bg-surface-hover px-3 py-2 text-xs leading-5 text-muted-foreground">
        {renderInline(row.text)}
      </p>
    )
  }

  if (row.kind === "section") {
    return (
      <h4
        className={cn(
          "pt-1 pb-1 text-[11px] font-semibold tracking-wide uppercase",
          SECTION_TONE[row.title.toLowerCase()] ?? "text-muted-foreground"
        )}
      >
        {row.title}
      </h4>
    )
  }

  return (
    <div className={cn("flex gap-2 pb-1.5", row.last && "pb-6")}>
      <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-border-strong" />
      <p className="text-[13px] leading-5 text-muted-foreground">{renderInline(row.text)}</p>
    </div>
  )
}

/** Release history as a vertical timeline, virtualized: only the rows in view are mounted. */
export const ChangelogTimeline = () => {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line react-hooks/incompatible-library -- the virtualizer is read inline each render, never memoized
  const virtualizer = useVirtualizer({
    count: ROWS.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: i => ESTIMATE[ROWS[i].kind],
    overscan: 8
  })

  return (
    <div
      ref={scrollRef}
      role="region"
      tabIndex={0}
      aria-label={t("changelog.aria")}
      className="h-96 overflow-y-auto rounded-md pr-2"
    >
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(item => (
          <div
            key={item.key}
            ref={virtualizer.measureElement}
            data-index={item.index}
            className="absolute top-0 left-0 w-full pl-6"
            style={{ transform: `translateY(${item.start}px)` }}
          >
            {/* Each row draws its own slice of the rail, so the line is continuous across virtual rows. */}
            <span aria-hidden className="absolute top-0 bottom-0 left-[5px] w-px bg-border" />
            <TimelineRow row={ROWS[item.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
