import * as React from "react"

import { cn } from "@/shared/lib/utils"

type ProgressProps = Omit<React.ComponentProps<"div">, "role"> & {
  /** Current value from 0 to `max`; `null` means indeterminate. */
  value?: number | null
  max?: number
}

/** A `role="progressbar"` bar; give it an accessible name with `aria-label`. */
function Progress({ className, value = null, max = 100, ...props }: ProgressProps) {
  const percent = value === null ? 0 : Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value ?? undefined}
      className={cn(
        "relative flex h-0.5 w-full items-center overflow-x-hidden rounded-full bg-foreground/15",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="size-full flex-1 bg-accent transition-transform duration-(--dur-slow) ease-(--ease)"
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </div>
  )
}

export { Progress }
