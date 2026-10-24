import { useTranslation } from "react-i18next"
import { RefreshCw } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { applyUpdate, dismissUpdate, usePwaStore } from "@/shared/stores/pwa.store"
import { useSaveStore } from "@/shared/stores/save.store"

/**
 * Slim bar under the top bar while a new version waits. It never reloads by itself: "Reload"
 * (disabled while a save is running) activates it, "Later" hides the bar until the next load.
 * It sits in the flow rather than floating, so it covers no controls. The live region stays
 * mounted so screen readers announce the text when it appears.
 */
export const UpdateBanner = () => {
  const { t } = useTranslation()
  const visible = usePwaStore(s => s.updateReady && !s.updateDismissed)
  const saving = useSaveStore(s => s.pending > 0)

  return (
    <div role="status">
      {visible && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-surface-raised px-3 py-2 text-sm md:px-4">
          <RefreshCw aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <p className="min-w-0 flex-1">{t("pwa.updateReady")}</p>
          <Button size="sm" onClick={applyUpdate} disabled={saving}>
            {saving ? t("statusbar.saving") : t("pwa.reload")}
          </Button>
          <Button size="sm" variant="ghost" onClick={dismissUpdate}>
            {t("pwa.later")}
          </Button>
        </div>
      )}
    </div>
  )
}
