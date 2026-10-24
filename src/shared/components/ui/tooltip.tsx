import * as React from "react"

import { cn } from "@/shared/lib/utils"

// CSS-only tooltip: shown on hover and keyboard focus of the wrapped control,
// linked to it with aria-describedby. No positioning engine, so it is placed on
// a fixed side of the trigger and is not flipped near the viewport edge.

type TooltipSide = "top" | "bottom" | "left" | "right"

const SIDE_CLASSES: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-1.5 -translate-x-1/2",
  left: "right-full top-1/2 mr-1.5 -translate-y-1/2",
  right: "left-full top-1/2 ml-1.5 -translate-y-1/2"
}

interface WithTooltipProps {
  label: React.ReactNode
  side?: TooltipSide
  /** A single interactive element (a Button, etc.) the tooltip describes. */
  children: React.ReactElement<{ "aria-describedby"?: string }>
  /** Classes for the wrapper, e.g. to position the control it wraps. */
  className?: string
}

/** Shows `label` on hover/focus of its single child. */
function WithTooltip({ label, side = "bottom", children, className }: WithTooltipProps) {
  const id = React.useId()

  return (
    <span data-slot="tooltip" className={cn("group/tooltip relative inline-flex", className)}>
      {React.cloneElement(children, { "aria-describedby": id })}
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[70] w-max max-w-[min(20rem,calc(100vw-1.5rem))] rounded-md border border-border bg-surface-raised px-2.5 py-1 text-xs font-medium text-foreground shadow-e1",
          // `hidden` (not just invisible) so a closed tooltip never widens the page.
          "hidden group-hover/tooltip:block group-has-focus-visible/tooltip:block",
          SIDE_CLASSES[side]
        )}
      >
        {label}
      </span>
    </span>
  )
}

export { WithTooltip }
