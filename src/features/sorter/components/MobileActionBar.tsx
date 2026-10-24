import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Scissors, Copy } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { WithTooltip } from "@/shared/components/ui/tooltip"
import type { SortFolder, MoveMode } from "../types/sorter.types"

interface MobileActionBarProps {
  folders: SortFolder[]
  moveMode: MoveMode
  currentIndex: number
  onAssign: (photoIndex: number, folderId: string) => Promise<void>
  onNavigate: (direction: "next" | "prev") => void
  totalPhotos: number
}

export const MobileActionBar = ({
  folders,
  moveMode,
  currentIndex,
  onAssign,
  onNavigate,
  totalPhotos
}: MobileActionBarProps) => {
  const { t } = useTranslation()
  const isEmptyFolder = folders.length === 0

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 h-18 border-t border-border bg-surface p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
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

          {isEmptyFolder && currentIndex !== 0 && <div className="text-xs">{t("common.previous")}</div>}
        </div>

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
          {isEmptyFolder && currentIndex !== totalPhotos - 1 && <div className="text-xs">{t("common.next")}</div>}
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
