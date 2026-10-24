import { useEffect, useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Check, AlertCircle, FileImage, ZoomIn, ZoomOut, Maximize } from "lucide-react"

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/components/ui/empty"
import { Spinner } from "@/shared/components/ui/spinner"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { WithTooltip } from "@/shared/components/ui/tooltip"
import { useZoomPan } from "../hooks/useZoomPan"
import { cn } from "@/shared/lib/utils"
import { isReservedShortcutKey } from "../utils/shortcut.utils"
import type { PhotoFile } from "../types/sorter.types"
import { LOUPE_SIZE, LOUPE_ZOOM } from "../constants/sorter.constants"

interface ContentViewerProps {
  photo: PhotoFile | null
  currentIndex: number
  totalPhotos: number
  currentFolder: { name: string; color: string } | null
  rawPreviewUrl: string | null
  isDecodingRaw: boolean
  onNavigate: (direction: "next" | "prev") => void
  onAssign: (index: number, shortcut: string) => void
  onJumpUnsorted: () => void
  onUndo: () => void
  onPreviewError: (photoKey: string) => void
}

export const ContentViewer = ({
  photo,
  currentIndex,
  totalPhotos,
  currentFolder,
  rawPreviewUrl,
  isDecodingRaw,
  onNavigate,
  onAssign,
  onJumpUnsorted,
  onUndo,
  onPreviewError
}: ContentViewerProps) => {
  const { t } = useTranslation()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgRetries, setImgRetries] = useState(0)
  const [trackedKey, setTrackedKey] = useState(photo?.key)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [loupe, setLoupe] = useState<{
    x: number
    y: number
    w: number
    h: number
    cx: number
    cy: number
  } | null>(null)

  // Reset load/retry state when the displayed photo changes (render-phase reset
  // per React's "adjusting state when a prop changes" pattern).
  if (photo?.key !== trackedKey) {
    setTrackedKey(photo?.key)
    setImgLoaded(false)
    setImgRetries(0)
    setLoupe(null)
  }

  const isRaw = photo?.format.category === "raw"
  const hasPreview = Boolean(photo?.url) || rawPreviewUrl !== null
  const displayUrl = photo?.url || rawPreviewUrl
  const isVideo = photo?.format.category === "video"

  const {
    bindContainer,
    transform,
    touchAction,
    isZoomed,
    reset: resetZoom,
    zoomIn,
    zoomOut,
    handlers: zoomHandlers
  } = useZoomPan({
    resetKey: photo?.key,
    onSwipeLeft: () => onNavigate("next"),
    onSwipeRight: () => onNavigate("prev")
  })

  // Desktop hover loupe: track the cursor position over the image.
  const updateLoupe = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    setLoupe({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
      cx: e.clientX,
      cy: e.clientY
    })
  }
  const hideLoupe = () => setLoupe(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Leave keys alone that a focused widget already handled (e.g. arrow keys
      // in a tab list) or that belong to an open modal dialog.
      if (e.defaultPrevented) return
      // Don't hijack keystrokes while the user is typing in a form field.
      const target = e.target as HTMLElement | null
      if (target?.closest("dialog[open]")) return
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return
      }

      // Ignore single-key shortcuts when a non-shift modifier is held so OS/
      // browser chords (Cmd+X, Ctrl+1, …) don't trigger file operations. The
      // Ctrl/Cmd+Z undo is handled explicitly below.
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.key !== "z" && e.key !== "Z") return

      if (e.key === "ArrowRight") onNavigate("next")
      if (e.key === "ArrowLeft") onNavigate("prev")
      // Any non-reserved key (no modifier — combos returned above) may be a
      // customizable folder shortcut; the parent resolves it to a folder and
      // ignores keys not bound to one. Reserved keys (Space, U, arrows, Esc…) are
      // fixed actions, so they're excluded.
      if (!isReservedShortcutKey(e.key)) {
        onAssign(currentIndex, e.key.toLowerCase())
      }
      if (e.key === " ") {
        e.preventDefault()
        onNavigate("next")
      }
      if (e.key === "u" || e.key === "U") onJumpUnsorted()
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault()
        onUndo()
      }
    },
    [currentIndex, onNavigate, onAssign, onJumpUnsorted, onUndo]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (!photo) {
    return (
      <div className="flex h-[50vh] items-center justify-center rounded-lg border border-border bg-canvas lg:h-auto lg:flex-1">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("viewer.noPhoto")}</p>
        </div>
      </div>
    )
  }

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface-raised lg:flex-1">
      <div className="relative flex min-h-0 flex-1 flex-col select-none">
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-sm font-medium" title={photo.name}>
            {photo.name}
          </span>
          {/* Sort status above the file type, both on the right. */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {currentFolder ? (
              <Badge className={cn("max-w-40 text-white", currentFolder.color)}>
                <Check className="w-3 h-3" />
                <span className="truncate">{currentFolder.name}</span>
              </Badge>
            ) : (
              <Badge variant="outline">{t("viewer.notSorted")}</Badge>
            )}
            <Badge variant="secondary">{photo.format.label}</Badge>
          </div>
        </div>

        {/* Image */}
        <div className="flex min-h-0 flex-1 items-center justify-center bg-canvas">
          {hasPreview ? (
            isVideo ? (
              <video
                key={photo.key}
                src={displayUrl!}
                className="max-h-[75vh] w-full object-contain lg:max-h-full"
                controls
              />
            ) : (
              <div
                ref={bindContainer}
                className={cn(
                  "relative flex h-full min-h-[40dvh] w-full items-center justify-center overflow-hidden",
                  isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                )}
                style={{ touchAction: touchAction }}
                {...zoomHandlers}
              >
                {!imgLoaded && (
                  <div className="absolute inset-0 skeleton rounded-none flex items-center justify-center">
                    <Spinner className="size-8 opacity-70" />
                  </div>
                )}
                <img
                  ref={imgRef}
                  key={photo.key}
                  src={displayUrl!}
                  alt={photo.name || t("viewer.photoPreviewAlt")}
                  className="max-h-[75vh] w-full object-contain will-change-transform lg:max-h-full"
                  style={{ transform: transform }}
                  draggable={false}
                  decoding="async"
                  onMouseMove={updateLoupe}
                  onMouseLeave={hideLoupe}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => {
                    // Some large images fail the first decode; recreate the
                    // object URL and retry instead of needing a manual reload.
                    if (!isRaw && imgRetries < 2) {
                      setImgRetries(r => r + 1)
                      onPreviewError(photo.key)
                    } else {
                      setImgLoaded(true) // give up: hide the spinner
                    }
                  }}
                />

                {/* Desktop hover loupe (magnifier). Hidden on touch + while transform-zoomed. */}
                {loupe && displayUrl && !isZoomed && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none fixed z-30 hidden overflow-hidden rounded-full border-2 border-white shadow-e2 md:block"
                    style={{
                      width: LOUPE_SIZE,
                      height: LOUPE_SIZE,
                      left: loupe.cx - LOUPE_SIZE / 2,
                      top: loupe.cy - LOUPE_SIZE / 2,
                      backgroundColor: "var(--surface-2)",
                      backgroundImage: `url("${displayUrl}")`,
                      backgroundRepeat: "no-repeat",
                      backgroundSize: `${loupe.w * LOUPE_ZOOM}px ${loupe.h * LOUPE_ZOOM}px`,
                      backgroundPosition: `${-(loupe.x * LOUPE_ZOOM - LOUPE_SIZE / 2)}px ${-(loupe.y * LOUPE_ZOOM - LOUPE_SIZE / 2)}px`
                    }}
                  />
                )}

                {/* Zoom controls */}
                <div
                  className="absolute right-3 bottom-3 flex gap-1 rounded-md border border-border bg-surface-raised p-1 shadow-e1"
                  onMouseDown={e => e.stopPropagation()}
                  onTouchStart={e => e.stopPropagation()}
                  onDoubleClick={e => e.stopPropagation()}
                >
                  <WithTooltip label={t("viewer.zoomOut")}>
                    <Button
                      size="icon-xs"
                      variant="ghost"

                      aria-label={t("viewer.zoomOut")}
                      disabled={!isZoomed}
                      onClick={zoomOut}
                    >
                      <ZoomOut className="size-4" />
                    </Button>
                  </WithTooltip>
                  <WithTooltip label={t("viewer.zoomReset")}>
                    <Button
                      size="icon-xs"
                      variant="ghost"

                      aria-label={t("viewer.zoomReset")}
                      disabled={!isZoomed}
                      onClick={resetZoom}
                    >
                      <Maximize className="size-4" />
                    </Button>
                  </WithTooltip>
                  <WithTooltip label={t("viewer.zoomIn")}>
                    <Button
                      size="icon-xs"
                      variant="ghost"

                      aria-label={t("viewer.zoomIn")}
                      onClick={zoomIn}
                    >
                      <ZoomIn className="size-4" />
                    </Button>
                  </WithTooltip>
                </div>
              </div>
            )
          ) : isRaw && isDecodingRaw ? (
            <div className="skeleton relative flex h-[50dvh] w-full items-center justify-center rounded-none">
              <div className="flex flex-col items-center gap-3 text-center">
                <Spinner className="size-6 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">{t("viewer.decodingRaw")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("viewer.decodingRawHint")}</p>
                </div>
              </div>
            </div>
          ) : (
            <Empty className="h-[50dvh]">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="w-16 h-16 border-2">
                  <FileImage className="size-12" />
                </EmptyMedia>
                <EmptyTitle>{photo.format.label}</EmptyTitle>
                <EmptyDescription>{t("viewer.previewUnavailable")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>

        {/* Navigation  */}
        <WithTooltip
          label={t("viewer.prevPhoto")}
          side="right"
          className="absolute top-1/2 left-3 hidden -translate-y-1/2 md:inline-flex"
        >
          <Button
            variant="secondary"
            size="icon-lg"
            aria-label={t("viewer.prevPhoto")}
            className="rounded-full border-border-strong bg-surface-raised shadow-e1 hover:bg-surface-hover"
            disabled={currentIndex === 0}
            onClick={() => onNavigate("prev")}
          >
            <ChevronLeft />
          </Button>
        </WithTooltip>

        <WithTooltip
          label={t("viewer.nextPhoto")}
          side="left"
          className="absolute top-1/2 right-3 hidden -translate-y-1/2 md:inline-flex"
        >
          <Button
            variant="secondary"
            size="icon-lg"
            aria-label={t("viewer.nextPhoto")}
            className="rounded-full border-border-strong bg-surface-raised shadow-e1 hover:bg-surface-hover"
            disabled={currentIndex === totalPhotos - 1}
            onClick={() => onNavigate("next")}
          >
            <ChevronRight />
          </Button>
        </WithTooltip>
      </div>
    </section>
  )
}
