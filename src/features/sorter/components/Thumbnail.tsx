import { useState } from "react"
import { Check, FileImage, Video } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/shared/lib/utils"
import type { PhotoFile } from "../types/sorter.types"

/** The image, with a skeleton until it paints and the format placeholder if it cannot be decoded. */
const ThumbImage = ({ src, fallback }: { src: string; fallback: React.ReactNode }) => {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading")
  if (state === "error") return <>{fallback}</>
  return (
    <>
      {state === "loading" && <span aria-hidden="true" className="skeleton absolute inset-0 rounded-none" />}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-(--dur-slow)",
          state === "loaded" ? "opacity-100" : "opacity-0"
        )}
      />
    </>
  )
}

interface ThumbnailProps {
  photo: PhotoFile
  index: number
  isCurrent: boolean
  isSelected: boolean
  /** Sort status shown as a colored badge, or null when unsorted. */
  folderMeta: { name: string; color: string } | null
  rawPreviewUrl?: string | null
  /** "sm" for the filmstrip, "md" for the grid. */
  size?: "sm" | "md"
  onOpen: (index: number) => void
  /** rangeSelect is true when the modifier (shift) was held. */
  onToggleSelect: (index: number, rangeSelect: boolean) => void
}

/**
 * A single photo thumbnail used by both the filmstrip and the grid. Renders the
 * image (or a format placeholder for video / RAW / non-previewable), plus
 * selection and sort-status overlays. Two sibling buttons keep the DOM valid
 * and accessible: one opens the photo, one toggles selection.
 */
export const Thumbnail = ({
  photo,
  index,
  isCurrent,
  isSelected,
  folderMeta,
  rawPreviewUrl,
  size = "md",
  onOpen,
  onToggleSelect
}: ThumbnailProps) => {
  const { t } = useTranslation()
  const isVideo = photo.format.category === "video"
  const isRaw = photo.format.category === "raw"
  const thumbSrc = isVideo ? null : isRaw ? (rawPreviewUrl ?? null) : photo.url

  const placeholder = (
    <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
      {isVideo ? <Video className="size-5" /> : <FileImage className="size-5" />}
      <span className="text-xs leading-none">{photo.format.label}</span>
    </span>
  )

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md border bg-surface-hover transition-[border-color,box-shadow] duration-(--dur-base)",
        size === "sm" ? "h-16 w-16 md:h-20 md:w-20" : "aspect-square w-full",
        // Current and selected both read as the accent ring; the check button tells them apart.
        isCurrent || isSelected ? "border-accent ring-2 ring-accent" : "border-border"
      )}
    >
      <button
        type="button"
        onClick={e => (e.shiftKey ? onToggleSelect(index, true) : onOpen(index))}
        aria-label={t("thumb.view", { name: photo.name })}
        aria-current={isCurrent ? "true" : undefined}
        className="block h-full w-full cursor-pointer"
      >
        {thumbSrc ? <ThumbImage key={thumbSrc} src={thumbSrc} fallback={placeholder} /> : placeholder}
      </button>

      {/* Selection checkbox (sibling of the open button — valid, focusable) */}
      <button
        type="button"
        onClick={e => onToggleSelect(index, e.shiftKey)}
        aria-label={t(isSelected ? "thumb.deselect" : "thumb.select", { name: photo.name })}
        aria-pressed={isSelected}
        className={cn(
          "absolute left-1 top-1 flex size-6 cursor-pointer items-center justify-center rounded-sm border transition-colors duration-(--dur-fast)",
          isSelected
            ? "border-accent bg-accent text-accent-foreground"
            : "border-white/70 bg-black/40 text-transparent hover:text-white/80"
        )}
      >
        <Check className="size-3.5" />
      </button>

      {folderMeta && (
        <span
          className={cn(
            "absolute inset-x-1 bottom-1 flex animate-pop-in items-center gap-1 rounded-sm px-1 py-0.5 text-xs leading-none text-white",
            folderMeta.color
          )}
          title={folderMeta.name}
        >
          <Check className="size-3 shrink-0" />
          {size === "md" && <span className="truncate">{folderMeta.name}</span>}
        </span>
      )}
    </div>
  )
}
