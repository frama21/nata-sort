import { useTranslation } from "react-i18next"
import { CheckCircle2, Loader2Icon, XCircle } from "lucide-react"

import type { Activity } from "@/shared/lib/activity"
import { cn } from "@/shared/lib/utils"
import { useStatusStore } from "@/shared/stores/status.store"

/**
 * Top-bar status: a spinner while reading or saving, a green check when saved, a red cross when
 * it failed. Desktop always shows the message (idle reads "Saved"); on phones the icon stays and
 * the message only shows while there is something to say. A failed state is dismissed by
 * clicking it. Screen readers get the same text through two live regions (polite / alert).
 * @returns The indicator.
 */
export const ActivityIndicator = ({ activity }: { activity: Activity }) => {
  const { t } = useTranslation()
  const dismiss = useStatusStore(s => s.dismissStatus)
  const { phase, message, errorId } = activity
  const text = message ?? t("statusbar.saved")
  const busy = phase === "loading" || phase === "saving"

  const visible = (
    <>
      {busy && <Loader2Icon aria-hidden className="size-4 shrink-0 animate-spin text-foreground" />}
      {phase === "saved" && <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />}
      {phase === "failed" && <XCircle aria-hidden className="size-4 shrink-0 text-destructive" />}
      <span
        className={cn(
          "min-w-0 truncate max-md:max-w-[11rem] md:max-w-72",
          // Phones: the message comes and goes; the icon stays.
          message === null && "max-md:hidden",
          message !== null && "animate-fade-in"
        )}
      >
        {phase === "failed" ? message : text}
      </span>
    </>
  )

  // The message is announced by the live regions below, so the visible copy is hidden from
  // assistive tech; the dismiss button keeps its own accessible name.
  const content = (
    <span aria-hidden className="flex min-w-0 items-center gap-2">
      {visible}
    </span>
  )

  return (
    <>
      {phase === "failed" && errorId ? (
        <button
          type="button"
          onClick={() => dismiss(errorId)}
          aria-label={t("common.close")}
          title={t("common.close")}
          className="flex min-w-0 max-w-full items-center rounded-md px-2 py-1 text-xs text-foreground hover:bg-surface-hover"
        >
          {content}
        </button>
      ) : (
        <div className="flex min-w-0 items-center px-2 py-1 text-xs text-muted-foreground">{content}</div>
      )}
      <div role="status" aria-live="polite" className="sr-only">
        {phase !== "failed" ? text : ""}
      </div>
      <div role="alert" className="sr-only">
        {phase === "failed" ? message : ""}
      </div>
    </>
  )
}
