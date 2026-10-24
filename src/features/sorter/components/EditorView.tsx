import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2, Image as ImageIcon, LayoutGrid, CheckCheck, FolderOpen, Info } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Alert, AlertTitle } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { useMediaQuery } from "@/shared/lib/useMediaQuery"

import { ContentViewer } from "./ContentViewer"
import { Filmstrip } from "./Filmstrip"
import { GridView } from "./GridView"
import { BatchActionBar } from "./BatchActionBar"
import { FolderManager } from "./FolderManager"
import { ProgressBar } from "./ProgressBar"
import { MobileActionBar } from "./MobileActionBar"
import { OperationLog } from "./OperationLog"
import { MetadataPanel } from "./MetadataPanel"
import { Stats } from "./Stats"
import { StatusBar } from "./StatusBar"

import type { FileSystemHook } from "../hooks/useFileSystem"
import type { ViewMode } from "../types/sorter.types"

interface EditorViewProps {
  fs: FileSystemHook
}

/**
 * The main sorting workspace, shown once a folder is open. Desktop: a folders panel
 * (left), the photo viewer / grid on a canvas (centre), a details panel (right) and a
 * status bar. Phones/tablets: one column, with both panels in sheets and the
 * mobile/batch action bars. Owns the local view-mode toggle and the
 * grid-only selection shortcuts; all session state comes from the `fs`
 * controller passed in by the app shell.
 */
export const EditorView = ({ fs }: EditorViewProps) => {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>("single")
  // Below 1024 px the side panels move into sheets; each renders in one place only.
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [sheet, setSheet] = useState<"folders" | "info" | null>(null)

  const stats = fs.getOperationStats()
  const baseCurrentPhoto = fs.getCurrentPhoto()
  const totalPhotos = fs.photos.length
  const selectedCount = fs.selectedKeys.size

  // Count photos that still need sorting (mappings can outnumber photos if
  // files were deleted on disk, so derive from the live photo list).
  const unsortedCount = fs.photos.filter(p => !fs.sortedPhotos[p.key]).length
  const sortedCount = totalPhotos - unsortedCount
  const allSorted = totalPhotos > 0 && unsortedCount === 0

  // Merge the lazily-extracted metadata into the current photo for display.
  const currentPhoto = baseCurrentPhoto
    ? {
        ...baseCurrentPhoto,
        metadata: fs.metadataByKey.get(baseCurrentPhoto.key) ?? baseCurrentPhoto.metadata
      }
    : null

  const currentRawPreview =
    currentPhoto && currentPhoto.format.category === "raw" ? fs.rawPreviewUrls.get(currentPhoto.key) || null : null

  const onToggleSelect = (index: number, rangeSelect: boolean) =>
    rangeSelect ? fs.selectRangeTo(index) : fs.toggleSelect(index)

  // With a multi-selection active, sorting (folder button or shortcut) applies to
  // the WHOLE selection; otherwise it sorts just the given (current) photo.
  const assignToFolder = (index: number, folderId: string) =>
    fs.selectedKeys.size > 0 ? fs.batchAssignToFolder(folderId) : fs.assignPhotoToFolder(index, folderId)

  // Grid-only shortcuts: Ctrl/Cmd+A toggles select-all, Escape clears selection.
  const { toggleSelectAll, clearSelection } = fs
  useEffect(() => {
    if (viewMode !== "grid") return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (t?.closest("dialog[open]")) return
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault()
        toggleSelectAll()
      } else if (e.key === "Escape") {
        clearSelection()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [viewMode, toggleSelectAll, clearSelection])

  const foldersPanel = (
    <FolderManager
      folders={fs.folders}
      moveMode={fs.moveMode}
      onAdd={fs.addFolder}
      onRemove={fs.removeFolder}
      onSetShortcut={fs.setFolderShortcut}
      onAssign={assignToFolder}
      onMoveModeChange={fs.setMoveMode}
      currentIndex={fs.currentIndex}
      canUndo={fs.canUndo}
      onUndo={fs.undoLastOperation}
      onJumpUnsorted={fs.jumpToNextUnsorted}
    />
  )

  const infoPanel = (
    <>
      <MetadataPanel photo={currentPhoto} />
      <OperationLog operations={fs.operations} />
      <Stats totalPhotos={totalPhotos} sortedCount={sortedCount} stats={stats} />
    </>
  )

  return (
    <div className="flex flex-col lg:h-full lg:min-h-0">
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        {isDesktop && (
          <nav
            aria-label={t("folder.title")}
            className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border bg-surface p-3"
          >
            {foldersPanel}
          </nav>
        )}

        {/* Canvas: view toggle + selection controls, progress, viewer / grid, filmstrip */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 bg-canvas p-3 pb-24 lg:min-h-0 lg:overflow-y-auto lg:pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1" role="group" aria-label={t("editor.viewMode")}>
              <Button
                variant="outline"
                className={viewMode === "single" ? "bg-accent-soft hover:bg-accent-soft" : undefined}
                size="sm"
                aria-pressed={viewMode === "single"}
                onClick={() => setViewMode("single")}
              >
                <ImageIcon />
                {t("editor.single")}
              </Button>
              <Button
                variant="outline"
                className={viewMode === "grid" ? "bg-accent-soft hover:bg-accent-soft" : undefined}
                size="sm"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid />
                {t("editor.grid")}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedCount > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t("editor.selectedCount", { count: selectedCount })}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={fs.selectAllUnsorted} disabled={unsortedCount === 0}>
                <CheckCheck />
                {t("editor.selectUnsorted")}
              </Button>
              {selectedCount > 0 && (
                <Button variant="ghost" size="sm" onClick={fs.clearSelection}>
                  {t("common.clear")}
                </Button>
              )}
              {!isDesktop && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setSheet("folders")}>
                    <FolderOpen />
                    {t("editor.openFolders")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSheet("info")}>
                    <Info />
                    {t("editor.openInfo")}
                  </Button>
                </>
              )}
            </div>
          </div>

          <ProgressBar current={fs.currentIndex} total={totalPhotos} sorted={sortedCount} />
          {allSorted && (
            <Alert variant="success">
              <CheckCircle2 />
              <AlertTitle>{t("editor.allSorted", { count: totalPhotos })}</AlertTitle>
            </Alert>
          )}

          {viewMode === "single" ? (
            <>
              <ContentViewer
                photo={currentPhoto}
                currentIndex={fs.currentIndex}
                totalPhotos={totalPhotos}
                currentFolder={fs.getCurrentFolder()}
                rawPreviewUrl={currentRawPreview}
                isDecodingRaw={fs.isDecodingRaw}
                onNavigate={fs.navigatePhoto}
                onJumpUnsorted={fs.jumpToNextUnsorted}
                onUndo={fs.undoLastOperation}
                onPreviewError={fs.recreatePreviewUrl}
                onAssign={(index, shortcut) => {
                  const key = shortcut.toLowerCase()
                  const folder = fs.folders.find(f => f.shortcut?.toLowerCase() === key)
                  if (folder) assignToFolder(index, folder.id)
                }}
              />
              <Filmstrip
                photos={fs.photos}
                currentIndex={fs.currentIndex}
                selectedKeys={fs.selectedKeys}
                sortedPhotos={fs.sortedPhotos}
                rawPreviewUrls={fs.rawThumbUrls}
                getFolderMeta={fs.getFolderMeta}
                onOpen={fs.goToIndex}
                onToggleSelect={onToggleSelect}
              />
            </>
          ) : (
            <GridView
              photos={fs.photos}
              currentIndex={fs.currentIndex}
              selectedKeys={fs.selectedKeys}
              sortedPhotos={fs.sortedPhotos}
              rawPreviewUrls={fs.rawThumbUrls}
              getFolderMeta={fs.getFolderMeta}
              onOpen={index => {
                fs.goToIndex(index)
                setViewMode("single")
              }}
              onToggleSelect={onToggleSelect}
            />
          )}
        </div>

        {isDesktop && (
          <aside
            aria-label={t("editor.infoPanel")}
            className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-border bg-surface p-3"
          >
            {infoPanel}
          </aside>
        )}
      </div>

      <StatusBar total={totalPhotos} unsorted={unsortedCount} selected={selectedCount} />

      {!isDesktop && (
        <>
          <Dialog open={sheet === "folders"} onOpenChange={open => !open && setSheet(null)}>
            <DialogContent side="left" className="h-full content-start gap-3 overflow-y-auto p-3 pt-18">
              <DialogHeader className="sr-only">
                <DialogTitle>{t("folder.title")}</DialogTitle>
              </DialogHeader>
              {foldersPanel}
            </DialogContent>
          </Dialog>
          <Dialog open={sheet === "info"} onOpenChange={open => !open && setSheet(null)}>
            <DialogContent side="bottom" className="max-h-[85dvh] content-start gap-3 overflow-y-auto p-3 pt-18">
              <DialogHeader className="sr-only">
                <DialogTitle>{t("editor.infoPanel")}</DialogTitle>
              </DialogHeader>
              {infoPanel}
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Mobile Action Bar — hidden while multi-selecting (batch bar takes over) */}
      {viewMode === "single" && selectedCount === 0 && (
        <MobileActionBar
          folders={fs.folders}
          moveMode={fs.moveMode}
          currentIndex={fs.currentIndex}
          onAssign={fs.assignPhotoToFolder}
          onNavigate={fs.navigatePhoto}
          totalPhotos={totalPhotos}
        />
      )}

      <BatchActionBar
        count={selectedCount}
        folders={fs.folders}
        moveMode={fs.moveMode}
        onAssignFolder={fs.batchAssignToFolder}
        onClear={fs.clearSelection}
      />
    </div>
  )
}
