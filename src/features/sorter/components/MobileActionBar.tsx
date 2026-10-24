import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Scissors, Copy, FolderPlus } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { WithTooltip } from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"
import type { SortFolder, MoveMode } from "../types/sorter.types"

interface MobileActionBarProps {
  folders: SortFolder[]
  moveMode: MoveMode
  currentIndex: number
  onAssign: (photoIndex: number, folderId: string) => Promise<void>
  onNavigate: (direction: "next" | "prev") => void
  /** Opens the folders sheet, where the first folder is created. */
  onOpenFolders: () => void
  totalPhotos: number
  /** The project is closing: slide the bar away. */
  leaving?: boolean
}

export const MobileActionBar = ({
  folders,
  moveMode,
  currentIndex,
  onAssign,
  onNavigate,
  onOpenFolders,
  totalPhotos,
  leaving = false
}: MobileActionBarProps) => {
  const { t } = useTranslation()
  const isEmptyFolder = folders.length === 0

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 h-18 border-t border-border bg-surface p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden",
        leaving ? "animate-slide-out-bottom" : "animate-slide-in-bottom"
      )}
    >
      <div className="flex h-full items-center justify-between gap-2">
        <div className="flex flex-row items-center gap-2">
          <WithTooltip label={t("viewer.prevPhoto")}>
            <Button
              onClick={() => onNavigate("prev")}
              disabled={currentIndex === 0}
              variant="outline"
              size="icon-lg"
              aria-label={t("viewer.prevPhoto")}
            >
              <ChevronLeft />
            </Button>
          </WithTooltip>
        </div>

        {isEmptyFolder && (
          <Button
            variant="secondary"
            className="h-full min-w-0 flex-1 leading-tight whitespace-normal"
            onClick={onOpenFolders}
          >
            <FolderPlus />
            {t("mobile.addFolder")}
          </Button>
        )}

        {!isEmptyFolder && (
          <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-none">
            {folders.map(folder => (
              <Button
                key={folder.id}
                onClick={() => onAssign(currentIndex, folder.id)}
                aria-label={t("mobile.sortToAria", { name: folder.name })}
                className={`h-full min-w-[60px] flex-1 text-xs font-medium text-white ${folder.color}`}
                size="lg"
              >
                <span className="flex flex-col items-center">
                  {moveMode === "cut" ? (
                    <Scissors className="size-3 opacity-75" />
                  ) : (
                    <Copy className="size-3 opacity-75" />
                  )}
                  <span className="block truncate w-full text-center">{folder.name}</span>
                </span>
              </Button>
            ))}
          </div>
        )}

        <div className="flex flex-row items-center gap-2">
          <WithTooltip label={t("viewer.nextPhoto")}>
            <Button
              onClick={() => onNavigate("next")}
              disabled={currentIndex === totalPhotos - 1}
              variant="outline"
              size="icon-lg"
              aria-label={t("viewer.nextPhoto")}
            >
              <ChevronRight />
            </Button>
          </WithTooltip>
        </div>
      </div>
    </div>
  )
}
