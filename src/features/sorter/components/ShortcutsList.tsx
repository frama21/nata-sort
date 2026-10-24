import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Kbd, KbdGroup } from "@/shared/components/ui/kbd"

interface Shortcut {
  keys: ReactNode
  labelKey: string
}

const ClickHint = () => {
  const { t } = useTranslation()
  return <span className="text-xs text-muted-foreground">{t("shortcuts.click")}</span>
}

const SHORTCUTS: Shortcut[] = [
  {
    keys: (
      <>
        <Kbd>1</Kbd>
        <span className="text-muted-foreground">…</span>
        <Kbd>9</Kbd>
      </>
    ),
    labelKey: "shortcuts.sortToFolder"
  },
  {
    keys: (
      <>
        <Kbd>←</Kbd>
        <Kbd>→</Kbd>
      </>
    ),
    labelKey: "shortcuts.navPhotos"
  },
  { keys: <Kbd>Space</Kbd>, labelKey: "shortcuts.nextPhoto" },
  { keys: <Kbd>U</Kbd>, labelKey: "shortcuts.jumpUnsorted" },
  {
    keys: (
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>Z</Kbd>
      </KbdGroup>
    ),
    labelKey: "shortcuts.undo"
  },
  {
    keys: (
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>A</Kbd>
      </KbdGroup>
    ),
    labelKey: "shortcuts.selectAll"
  },
  {
    keys: (
      <span className="flex items-center gap-1">
        <Kbd>Shift</Kbd>
        <ClickHint />
      </span>
    ),
    labelKey: "shortcuts.rangeSelect"
  }
]

/** The keyboard shortcuts, one row per action, rendered with the Kbd component. */
export const ShortcutsList = () => {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4">
      <div className="grid gap-2.5">
        {SHORTCUTS.map(s => (
          <div key={s.labelKey} className="flex items-center justify-between gap-4">
            <span className="text-sm">{t(s.labelKey)}</span>
            <span className="flex shrink-0 items-center gap-1">{s.keys}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("shortcuts.footer")}</p>
    </div>
  )
}
