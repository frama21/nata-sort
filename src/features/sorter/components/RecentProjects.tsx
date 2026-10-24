import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Folder, Trash2 } from "lucide-react"

import { DropdownMenu } from "@/shared/components/ui/dropdown-menu"

import { useRecentProjects } from "../hooks/useRecentProjects"
import type { RecentProject } from "../services/recent-projects.service"
import { formatRelativeTime } from "../utils/format-time.utils"

/** Rows shown at once; a longer list scrolls (and is virtualized) instead of growing the page. */
const VISIBLE_ROWS = 5
const ROW_HEIGHT = 56

interface RecentProjectsProps {
  disabled: boolean
  onOpen: (id: string) => void
}

const Row = ({
  project,
  disabled,
  onOpen,
  onRemove
}: {
  project: RecentProject
  disabled: boolean
  onOpen: (id: string) => void
  onRemove: (id: string) => void
}) => {
  const { t, i18n } = useTranslation()
  const updated = formatRelativeTime(project.updatedAt, i18n.language)

  return (
    <div className="flex h-14 items-center gap-1 rounded-md pr-1 transition-colors duration-(--dur-fast) hover:bg-surface-hover">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOpen(project.id)}
        title={new Date(project.updatedAt).toLocaleString(i18n.language)}
        className="flex h-full min-w-0 flex-1 items-center gap-3 rounded-md px-3 text-left disabled:pointer-events-none disabled:opacity-50"
      >
        <Folder aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{project.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {t("welcome.recent.photos", { count: project.photoCount })} ·{" "}
            {t("welcome.recent.updated", { when: updated })}
          </span>
        </span>
      </button>
      <DropdownMenu
        label={t("welcome.recent.actions", { name: project.name })}
        items={[
          {
            label: t("welcome.recent.remove"),
            icon: <Trash2 />,
            destructive: true,
            onSelect: () => onRemove(project.id)
          }
        ]}
      />
    </div>
  )
}

/** Recently opened folders on the start screen: name, photo count, last update, and a ⋮ menu. */
export const RecentProjects = ({ disabled, onOpen }: RecentProjectsProps) => {
  const { t } = useTranslation()
  const { projects, remove } = useRecentProjects()
  const scrollRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line react-hooks/incompatible-library -- the virtualizer is read inline each render, never memoized
  const virtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4
  })

  if (projects.length === 0) return null

  const scrolls = projects.length > VISIBLE_ROWS

  return (
    <section aria-labelledby="recent-projects-title" className="w-full text-left">
      <h3
        id="recent-projects-title"
        className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {t("welcome.recent.title")}
      </h3>
      <div
        ref={scrollRef}
        className="rounded-lg border border-border bg-surface-raised p-1"
        style={scrolls ? { height: VISIBLE_ROWS * ROW_HEIGHT + 8, overflowY: "auto" } : undefined}
      >
        {scrolls ? (
          <ul
            aria-label={t("welcome.recent.title")}
            className="relative"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map(item => (
              <li
                key={projects[item.index].id}
                className="absolute top-0 left-0 w-full"
                style={{ height: item.size, transform: `translateY(${item.start}px)` }}
              >
                <Row project={projects[item.index]} disabled={disabled} onOpen={onOpen} onRemove={remove} />
              </li>
            ))}
          </ul>
        ) : (
          <ul aria-label={t("welcome.recent.title")}>
            {projects.map(project => (
              <li key={project.id}>
                <Row project={project} disabled={disabled} onOpen={onOpen} onRemove={remove} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
