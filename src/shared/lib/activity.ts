import { isActivityStatus, type StatusItem } from "@/shared/stores/status.store"

export type ActivityPhase = "loading" | "saving" | "saved" | "failed"

export interface Activity {
  phase: ActivityPhase
  /** What is happening or just happened; null when idle. */
  message: string | null
  /** The failed status to dismiss, when `phase` is "failed". */
  errorId?: string
}

/**
 * The top bar's activity state from the status messages (newest first) and the number of
 * project writes in flight. Failed beats loading, loading beats saving, saving beats the last
 * success; with nothing going on it is idle "saved".
 * @param statuses Status items, newest first, as kept by the status store.
 * @param pendingSaves Project writes queued or running.
 * @param savingLabel Text shown while saving.
 * @returns The phase and the message to show.
 */
export function deriveActivity(statuses: StatusItem[], pendingSaves: number, savingLabel: string): Activity {
  const activity = statuses.filter(isActivityStatus)
  const error = activity.find(s => s.type === "error")
  if (error) return { phase: "failed", message: error.message, errorId: error.id }
  const loading = activity.find(s => s.type === "loading")
  if (loading) return { phase: "loading", message: loading.message }
  if (pendingSaves > 0) return { phase: "saving", message: savingLabel }
  const success = activity.find(s => s.type === "success")
  return { phase: "saved", message: success?.message ?? null }
}

/**
 * True while there is something to report (anything but idle "saved").
 * @param activity Output of `deriveActivity`.
 * @returns Whether the indicator has a phase or message to show.
 */
export const isBusy = (activity: Activity) => activity.phase !== "saved" || activity.message !== null
