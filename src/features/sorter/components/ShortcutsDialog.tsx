import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { CircleHelp } from "lucide-react"

import { buttonVariants } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/shared/components/ui/dialog"
import { Kbd, KbdGroup } from "@/shared/components/ui/kbd"
import { WithTooltip } from "@/shared/components/ui/tooltip"

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

/**
 * A help button (?) that opens a dialog listing the keyboard shortcuts, rendered
 * with the Kbd component. Lives in the navbar.
 */
export const ShortcutsDialog = () => {
  const { t } = useTranslation()

  return (
    <Dialog>
      <WithTooltip label={t("shortcuts.triggerAria")}>
        <DialogTrigger
          className={buttonVariants({ variant: "outline", size: "icon" })}
          aria-label={t("shortcuts.triggerAria")}
        >
          <CircleHelp className="h-[1.2rem] w-[1.2rem]" />
        </DialogTrigger>
      </WithTooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("shortcuts.title")}</DialogTitle>
          <DialogDescription>{t("shortcuts.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2.5">
          {SHORTCUTS.map(s => (
            <div key={s.labelKey} className="flex items-center justify-between gap-4">
              <span className="text-sm">{t(s.labelKey)}</span>
              <span className="flex shrink-0 items-center gap-1">{s.keys}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{t("shortcuts.footer")}</p>
      </DialogContent>
    </Dialog>
  )
}
