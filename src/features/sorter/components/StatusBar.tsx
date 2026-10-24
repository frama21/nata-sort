import { useTranslation } from "react-i18next"

interface StatusBarProps {
  total: number
  unsorted: number
  selected: number
}

/**
 * Desktop status bar (28 px): tabular counts. The save/activity state lives in the top bar
 * (`ActivityIndicator`). Hidden on phones.
 */
export const StatusBar = ({ total, unsorted, selected }: StatusBarProps) => {
  const { t } = useTranslation()
  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-surface px-3 text-xs text-muted-foreground max-lg:hidden">
      <span className="tabular-nums">{t("statusbar.photos", { count: total })}</span>
      <span className="tabular-nums">{t("statusbar.left", { count: unsorted })}</span>
      {selected > 0 && <span className="tabular-nums">{t("editor.selectedCount", { count: selected })}</span>}
    </footer>
  )
}
