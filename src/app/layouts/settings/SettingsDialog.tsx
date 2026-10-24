import { lazy, Suspense, useState } from "react"
import { useTranslation } from "react-i18next"
import { CircleHelp } from "lucide-react"

import { ShortcutsList } from "@/features/sorter"
import { buttonVariants } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/shared/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { WithTooltip } from "@/shared/components/ui/tooltip"
import { AboutTab } from "./AboutTab"
import { AppearanceTab } from "./AppearanceTab"

// Loaded on first open of the tab: it carries CHANGELOG.md and the virtual-list library.
const ChangelogTimeline = lazy(() => import("./ChangelogTimeline").then(m => ({ default: m.ChangelogTimeline })))

const TABS = ["shortcuts", "appearance", "about", "changelog"] as const
type SettingsTab = (typeof TABS)[number]

// Vertical list beside the content on desktop; a scrollable row under the title on phones.
const TAB_LIST =
  "h-auto w-full shrink-0 flex-row items-stretch justify-start gap-1 overflow-x-auto rounded-none border-0 border-b bg-transparent p-2 pointer-coarse:h-auto sm:w-44 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0 sm:p-3"
const TAB_TRIGGER =
  "h-9 flex-none justify-start px-3 text-sm data-[state=active]:bg-surface-hover pointer-coarse:h-11"
const PANEL = "h-full overflow-y-auto p-5 sm:p-6"

/**
 * The top bar's help button (?). Opens Settings on the Shortcuts tab; the other tabs hold
 * appearance (theme, language), About, and the changelog.
 */
export const SettingsDialog = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<SettingsTab>("shortcuts")

  const onOpenChange = (next: boolean) => {
    if (next) setTab("shortcuts") // always land on Shortcuts, whichever tab was open last
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <WithTooltip label={t("settings.trigger")}>
        <DialogTrigger
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label={t("settings.trigger")}
        >
          <CircleHelp className="size-4" />
        </DialogTrigger>
      </WithTooltip>
      <DialogContent dialogClassName="sm:max-w-3xl" className="gap-0 p-0">
        <DialogHeader className="px-5 pt-6 pb-4 sm:px-6 sm:py-4">
          <DialogTitle className="max-sm:text-center">{t("settings.title")}</DialogTitle>
          <DialogDescription className="sr-only">{t("settings.description")}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={v => setTab(TABS.find(x => x === v) ?? "shortcuts")}
          className="gap-0 border-t border-border sm:flex-row"
        >
          <TabsList className={TAB_LIST}>
            {TABS.map(id => (
              <TabsTrigger key={id} value={id} className={TAB_TRIGGER}>
                {t(`settings.tab.${id}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="h-[min(26rem,60dvh)] min-w-0 overflow-hidden sm:h-[26rem] sm:flex-1">
            <TabsContent value="shortcuts" className={PANEL}>
              <ShortcutsList />
            </TabsContent>
            <TabsContent value="appearance" className={PANEL}>
              <AppearanceTab />
            </TabsContent>
            <TabsContent value="about" className={PANEL}>
              <AboutTab />
            </TabsContent>
            <TabsContent value="changelog" className="h-full py-5 pr-3 pl-5 sm:py-6 sm:pl-6">
              <Suspense fallback={null}>
                <ChangelogTimeline />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
