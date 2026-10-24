import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "./Thumbnail"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import type { PhotoFile, SortedMapping } from "../types/sorter.types"

interface FilmstripProps {
  photos: PhotoFile[]
  currentIndex: number
  selectedKeys: Set<string>
  sortedPhotos: SortedMapping
  rawPreviewUrls: Map<string, string>
  getFolderMeta: (folderId: string | undefined) => { name: string; color: string } | null
  onOpen: (index: number) => void
  onToggleSelect: (index: number, rangeSelect: boolean) => void
}

/**
 * A horizontally scrollable strip of thumbnails for quick navigation and
 * selection. Keeps the current photo centred in the strip. Works the same on
 * desktop and mobile (native horizontal scroll).
 */
export const Filmstrip = ({
  photos,
  currentIndex,
  selectedKeys,
  sortedPhotos,
  rawPreviewUrls,
  getFolderMeta,
  onOpen,
  onToggleSelect
}: FilmstripProps) => {
  const { t } = useTranslation()
  const viewportRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLLIElement | null>(null)

  // Centre the current photo by scrolling the strip itself; scrollIntoView would also scroll
  // the page, shifting the viewer on every step when the strip is below the fold.
  useEffect(() => {
    const root = viewportRef.current
    const el = currentRef.current
    if (!root || !el) return
    root.scrollLeft +=
      el.getBoundingClientRect().left - root.getBoundingClientRect().left - (root.clientWidth - el.offsetWidth) / 2
  }, [currentIndex])

  if (photos.length === 0) return null

  return (
    <ScrollArea
      orientation="horizontal"
      viewportRef={viewportRef}
      className="w-full rounded-md border border-border bg-surface"
    >
      <ul aria-label={t("filmstrip.aria")} className="flex list-none gap-2 p-2">
        {photos.map((photo, i) => (
          <li key={photo.key} ref={i === currentIndex ? currentRef : undefined}>
            <Thumbnail
              photo={photo}
              index={i}
              size="sm"
              isCurrent={i === currentIndex}
              isSelected={selectedKeys.has(photo.key)}
              folderMeta={getFolderMeta(sortedPhotos[photo.key])}
              rawPreviewUrl={rawPreviewUrls.get(photo.key)}
              onOpen={onOpen}
              onToggleSelect={onToggleSelect}
            />
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
