import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { deriveActivity, type Activity } from "@/shared/lib/activity"
import { useSaveStore } from "@/shared/stores/save.store"
import { useStatusStore } from "@/shared/stores/status.store"

/**
 * The current file activity for the top bar: its phase, and what to show.
 * @returns The derived activity, updated as statuses and saves change.
 */
export const useActivity = (): Activity => {
  const { t } = useTranslation()
  const statuses = useStatusStore(s => s.statuses)
  const pending = useSaveStore(s => s.pending)
  return useMemo(() => deriveActivity(statuses, pending, t("statusbar.saving")), [statuses, pending, t])
}
