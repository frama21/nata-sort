import { useTranslation } from "react-i18next"

import { cn } from "@/shared/lib/utils"
import { useStatusStore } from "@/shared/stores/status.store"

interface StatusBarProps {
  total: number
  unsorted: number
  selected: number
}

/**
 * Desktop status bar (28 px): the save state as a dot + word, then tabular counts.
 * The save state comes from the project-file (`db`) statuses the toasts also show.
 * Hidden on phones, where the toast region carries it.
 */
export const StatusBar = ({ total, unsorted, selected }: StatusBarProps) => {
  const { t } = useTranslation()
  const statuses = useStatusStore(s => s.statuses)
  const dbStatuses = statuses.filter(s => s.icon === "db")
  const state = dbStatuses.some(s => s.type === "error")
    ? "saveFailed"
    : dbStatuses.some(s => s.type === "loading")
      ? "saving"
      : "saved"

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-surface px-3 text-xs text-muted-foreground max-lg:hidden">
      <span role="status" className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            state === "saved" && "bg-success",
            state === "saving" && "bg-warning",
            state === "saveFailed" && "bg-destructive"
          )}
        />
        {t(`statusbar.${state}`)}
      </span>
      <span className="tabular-nums">{t("statusbar.photos", { count: total })}</span>
      <span className="tabular-nums">{t("statusbar.left", { count: unsorted })}</span>
      {selected > 0 && <span className="tabular-nums">{t("editor.selectedCount", { count: selected })}</span>}
    </footer>
  )
}
