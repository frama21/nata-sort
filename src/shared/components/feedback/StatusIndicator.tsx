import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2, XIcon, XCircle } from "lucide-react"

import { Spinner } from "@/shared/components/ui/spinner"
import { useStatusStore, type StatusItem } from "@/shared/stores/status.store"

/** How long a success toast stays; errors stay until dismissed, loading until cleared. */
const SUCCESS_MS = 3000

const Toast = ({ status }: { status: StatusItem }) => {
  const { t } = useTranslation()
  const dismiss = useStatusStore(s => s.dismissStatus)
  // Hover or keyboard focus inside the toast pauses its expiry.
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (status.type !== "success" || paused) return
    const timer = setTimeout(() => dismiss(status.id), SUCCESS_MS)
    return () => clearTimeout(timer)
  }, [status.id, status.type, paused, dismiss])

  return (
    <div
      className="pointer-events-auto flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm shadow-e1 animate-fade-in"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Status colour lives on the icon only; the message stays foreground. */}
      <span aria-hidden className="grid shrink-0 place-items-center">
        {status.type === "loading" && <Spinner aria-hidden role="presentation" />}
        {status.type === "success" && <CheckCircle2 className="size-4 text-success" />}
        {status.type === "error" && <XCircle className="size-4 text-destructive" />}
      </span>
      <span className="min-w-0 flex-1 break-words">{status.message}</span>
      {status.type !== "loading" && (
        <button
          type="button"
          onClick={() => dismiss(status.id)}
          aria-label={t("common.close")}
          className="-my-1 -mr-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground pointer-coarse:size-11"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  )
}

/**
 * Toast region: bottom-right on desktop, top-centre under the top bar on phones. Two
 * always-mounted live regions (polite for progress and success, assertive for errors)
 * so announcements are reliable; it never takes focus.
 */
export const StatusIndicator = () => {
  const statuses = useStatusStore(s => s.statuses)
  const errors = statuses.filter(s => s.type === "error")
  const others = statuses.filter(s => s.type !== "error")

  const region = (items: StatusItem[], live: "polite" | "assertive") => (
    <div role="status" aria-live={live} aria-atomic="false" className="flex flex-col gap-2">
      {items.map(s => (
        <Toast key={s.id} status={s} />
      ))}
    </div>
  )

  return (
    <div className="pointer-events-none fixed inset-x-3 top-14 z-70 flex flex-col gap-2 md:inset-x-auto md:top-auto md:right-4 md:bottom-10 md:w-96">
      {region(errors, "assertive")}
      {region(others, "polite")}
    </div>
  )
}
