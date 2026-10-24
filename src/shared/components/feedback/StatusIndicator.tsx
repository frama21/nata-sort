import { CheckCircle2, XCircle } from "lucide-react"
import { Spinner } from "@/shared/components/ui/spinner"
import { Badge } from "@/shared/components/ui/badge"

import { useStatusStore } from "@/shared/stores/status.store"

export const StatusIndicator = () => {
  const { statuses } = useStatusStore()
  const currentStatus = statuses[0]

  const isStatusLoading = currentStatus?.type === "loading"
  const isStatusSuccess = currentStatus?.type === "success"
  const isStatusError = currentStatus?.type === "error"

  return (
    <div
      // On phones the navbar has no room, so the status floats just under it (the navbar is the positioned ancestor).
      className="flex items-center justify-center max-md:pointer-events-none max-md:absolute max-md:inset-x-3 max-md:top-full max-md:mt-2"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {currentStatus && (
        <Badge className="max-w-full">
          {isStatusLoading && <Spinner />}
          {isStatusSuccess && <CheckCircle2 className="w-3 h-3" />}
          {isStatusError && <XCircle className="w-3 h-3" />}
          <span className="truncate">{currentStatus.message}</span>
        </Badge>
      )}
    </div>
  )
}
