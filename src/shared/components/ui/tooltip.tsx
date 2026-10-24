import * as React from "react"

import { cn } from "@/shared/lib/utils"

// Tooltip shown on hover and keyboard focus of the wrapped control, linked to it
// with aria-describedby. It is a native `popover`, so it lives in the top layer:
// never clipped by an ancestor's `overflow`, and above modal <dialog>s. Placement
// is computed on open: preferred side first, flipped when it doesn't fit, then
// clamped to the viewport. Escape dismisses it.

type TooltipSide = "top" | "bottom" | "left" | "right"

const GAP = 8
const MARGIN = 8

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

/** Top-left (viewport coords) for a tooltip of size `tip` next to `anchor`. */
function place(anchor: DOMRect, tip: DOMRect, side: TooltipSide) {
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  const room = {
    top: anchor.top - GAP - MARGIN,
    bottom: vh - anchor.bottom - GAP - MARGIN,
    left: anchor.left - GAP - MARGIN,
    right: vw - anchor.right - GAP - MARGIN
  }
  const vertical = side === "top" || side === "bottom"
  const need = vertical ? tip.height : tip.width
  const opposite: Record<TooltipSide, TooltipSide> = { top: "bottom", bottom: "top", left: "right", right: "left" }
  // Keep the preferred side if it fits; otherwise use the opposite one when it fits, else the roomier of the two.
  const final =
    room[side] >= need
      ? side
      : room[opposite[side]] >= need || room[opposite[side]] > room[side]
        ? opposite[side]
        : side

  const centerX = anchor.left + anchor.width / 2 - tip.width / 2
  const centerY = anchor.top + anchor.height / 2 - tip.height / 2
  const left =
    final === "left"
      ? anchor.left - GAP - tip.width
      : final === "right"
        ? anchor.right + GAP
        : clamp(centerX, MARGIN, vw - tip.width - MARGIN)
  const top =
    final === "top"
      ? anchor.top - GAP - tip.height
      : final === "bottom"
        ? anchor.bottom + GAP
        : clamp(centerY, MARGIN, vh - tip.height - MARGIN)
  return { left, top }
}

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
      const { left, top } = place(anchor.getBoundingClientRect(), tip.getBoundingClientRect(), side)
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
