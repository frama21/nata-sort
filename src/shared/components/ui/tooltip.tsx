import * as React from "react"

import { placeFloating, type FloatingSide } from "@/shared/lib/floating"
import { cn } from "@/shared/lib/utils"

// Tooltip shown on hover and keyboard focus of the wrapped control, linked to it
// with aria-describedby. It is a native `popover`, so it lives in the top layer:
// never clipped by an ancestor's `overflow`, and above modal <dialog>s. Placement
// is computed on open: preferred side first, flipped when it doesn't fit, then
// clamped to the viewport. Escape dismisses it.

type TooltipSide = FloatingSide

const MARGIN = 8

interface WithTooltipProps {
  label: React.ReactNode
  /** Preferred side; flips automatically when there is no room. Defaults to above the control. */
  side?: TooltipSide
  /** A single interactive element (a Button, etc.) the tooltip describes. */
  children: React.ReactElement<{ "aria-describedby"?: string }>
  /** Classes for the wrapper, e.g. to position the control it wraps. */
  className?: string
}

/** Shows `label` on hover/focus of its single child. */
function WithTooltip({ label, side = "top", children, className }: WithTooltipProps) {
  const id = React.useId()
  const anchorRef = React.useRef<HTMLSpanElement>(null)
  const tipRef = React.useRef<HTMLSpanElement>(null)
  const [open, setOpen] = React.useState(false)

  React.useLayoutEffect(() => {
    const anchor = anchorRef.current
    const tip = tipRef.current
    if (!open || !anchor || !tip) return

    tip.showPopover?.()
    const reposition = () => {
      const { left, top } = placeFloating(anchor.getBoundingClientRect(), tip.getBoundingClientRect(), side)
      tip.style.left = `${left}px`
      tip.style.top = `${top}px`
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    reposition()
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
      window.removeEventListener("keydown", onKey)
      if (tip.matches(":popover-open")) tip.hidePopover()
    }
  }, [open, side, label])

  return (
    <span
      ref={anchorRef}
      data-slot="tooltip"
      className={cn("relative inline-flex", className)}
      // Mouse only: a tap shouldn't leave a sticky tooltip behind.
      onPointerEnter={e => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={e => e.target.matches(":focus-visible") && setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {React.cloneElement(children, { "aria-describedby": id })}
      <span
        ref={tipRef}
        id={id}
        role="tooltip"
        popover="manual"
        style={{ maxWidth: `min(20rem, calc(100vw - ${MARGIN * 2}px))` }}
        className="pointer-events-none inset-auto m-0 w-max overflow-visible rounded-md border border-border bg-surface-raised px-2.5 py-1 text-xs font-medium text-foreground shadow-e1"
      >
        {label}
      </span>
    </span>
  )
}

export { WithTooltip }
