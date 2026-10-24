import { lazy, Suspense, useState, type ReactNode } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { WithTooltip } from "@/shared/components/ui/tooltip"

interface Shortcut {
  keys: ReactNode
  labelKey: string
}

const ClickHint = () => {
  const { t } = useTranslation()
  return <span className="text-xs text-muted-foreground">{t("shortcuts.click")}</span>
}

// Loaded on first open of the tab: it carries CHANGELOG.md and the virtual-list library.
const ChangelogTimeline = lazy(() => import("./ChangelogTimeline").then(m => ({ default: m.ChangelogTimeline })))

const ABOUT_TOPICS = ["privacy", "browser", "progress", "safety"] as const

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
 * A help button (?) that opens a dialog with three tabs: the keyboard shortcuts
 * (rendered with the Kbd component), an About section (privacy, browser
 * requirements, where progress is stored, file safety) and the changelog timeline. Lives in the navbar.
 */
export const ShortcutsDialog = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState("shortcuts")

  return (
    <Dialog>
      <WithTooltip label={t("shortcuts.triggerAria")}>
        <DialogTrigger
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label={t("shortcuts.triggerAria")}
        >
          <CircleHelp className="size-4" />
        </DialogTrigger>
      </WithTooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("shortcuts.title")}</DialogTitle>
          <DialogDescription>{t("shortcuts.description")}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="shortcuts">{t("shortcuts.tabShortcuts")}</TabsTrigger>
            <TabsTrigger value="about">{t("shortcuts.tabAbout")}</TabsTrigger>
            <TabsTrigger value="changelog">{t("shortcuts.tabChangelog")}</TabsTrigger>
          </TabsList>

          <TabsContent value="shortcuts" className="grid min-h-96 content-start gap-4">
            <div className="grid gap-2.5">
              {SHORTCUTS.map(s => (
                <div key={s.labelKey} className="flex items-center justify-between gap-4">
                  <span className="text-sm">{t(s.labelKey)}</span>
                  <span className="flex shrink-0 items-center gap-1">{s.keys}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t("shortcuts.footer")}</p>
          </TabsContent>

          <TabsContent value="about" className="grid min-h-96 content-start gap-4">
            {ABOUT_TOPICS.map(topic => (
              <section key={topic} className="grid gap-1">
                <h3 className="text-sm font-semibold">{t(`help.${topic}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`help.${topic}.body`)}</p>
              </section>
            ))}
          </TabsContent>

          <TabsContent value="changelog">
            <Suspense fallback={<div className="h-96" />}>
              <ChangelogTimeline />
            </Suspense>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
