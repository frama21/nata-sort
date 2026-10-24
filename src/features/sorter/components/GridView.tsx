import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { PAGE_SIZE } from "../constants/sorter.constants"

import { Thumbnail } from "./Thumbnail"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Spinner } from "@/shared/components/ui/spinner"
import type { PhotoFile, SortedMapping } from "../types/sorter.types"

interface GridViewProps {
  photos: PhotoFile[]
  currentIndex: number
  selectedKeys: Set<string>
  sortedPhotos: SortedMapping
  rawPreviewUrls: Map<string, string>
  getFolderMeta: (folderId: string | undefined) => { name: string; color: string } | null
  onOpen: (index: number) => void
  onToggleSelect: (index: number, rangeSelect: boolean) => void
}

/** How many thumbnails to render per "page" (grows as the user scrolls). */

/**
 * A responsive grid of every photo for bulk overview and multi-selection. It
 * renders inside a ScrollArea and only mounts a window of thumbnails at a
 * time — more are appended (with a loader) as the sentinel scrolls into view, so
 * a folder of thousands of photos stays light.
 */
export const GridView = ({
  photos,
  currentIndex,
  selectedKeys,
  sortedPhotos,
  rawPreviewUrls,
  getFolderMeta,
  onOpen,
  onToggleSelect
}: GridViewProps) => {
  const { t } = useTranslation()
  const viewportRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const total = photos.length
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [trackedTotal, setTrackedTotal] = useState(total)

  // Render-phase state adjustment (no effect, no cascading render):
  // reset the window when the photo set changes, and always keep the current
  // photo inside the rendered window.
  if (total !== trackedTotal) {
    setTrackedTotal(total)
    setVisible(Math.min(total, PAGE_SIZE))
  } else if (currentIndex >= visible && currentIndex < total) {
    setVisible(Math.min(total, Math.ceil((currentIndex + 1) / PAGE_SIZE) * PAGE_SIZE))
  }

  const hasMore = visible < total

  // Coming back from the single view, centre the grid on the current photo instead of the top.
  // Scrolls the grid's own viewport only, so the page toolbar above never moves.
  useEffect(() => {
    const root = viewportRef.current
    const el = root?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!root || !el) return
    root.scrollTop +=
      el.getBoundingClientRect().top - root.getBoundingClientRect().top - (root.clientHeight - el.offsetHeight) / 2
  }, [])

  // Append the next page when the sentinel scrolls near the viewport bottom.
  useEffect(() => {
    if (!hasMore) return
    const root = viewportRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) setVisible(v => Math.min(v + PAGE_SIZE, total))
      },
      { root, rootMargin: "300px" }
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [hasMore, total])

  if (total === 0) return null

  return (
    <ScrollArea
      viewportRef={viewportRef}
      className="h-[72dvh] animate-fade-in rounded-md border border-border bg-surface lg:h-auto lg:min-h-0 lg:flex-1"
    >
      <div className="grid grid-cols-3 gap-2 p-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {photos.slice(0, visible).map((photo, i) => (
          <Thumbnail
            key={photo.key}
            photo={photo}
            index={i}
            size="md"
            isCurrent={i === currentIndex}
            isSelected={selectedKeys.has(photo.key)}
            folderMeta={getFolderMeta(sortedPhotos[photo.key])}
            rawPreviewUrl={rawPreviewUrls.get(photo.key)}
            onOpen={onOpen}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>

      {hasMore && (
        <div
          ref={sentinelRef}
          aria-live="polite"
          className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
        >
          <Spinner className="size-4" />
          {t("grid.loadingMore", { visible, total })}
        </div>
      )}
    </ScrollArea>
  )
}
