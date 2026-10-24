// Placement math shared by the tooltip and the dropdown menu (both are native popovers).

export type FloatingSide = "top" | "bottom" | "left" | "right"

const GAP = 8
const MARGIN = 8

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

/**
 * Top-left (viewport coords) for a floating panel of size `tip` next to `anchor`: the
 * preferred side if it fits, else the opposite one, then clamped to the viewport.
 * @param anchor Bounding rect of the control the panel belongs to.
 * @param tip Bounding rect (size) of the panel.
 * @param side Preferred side of the anchor.
 * @param align Along the anchor's edge: centered on it, or flush with its right edge.
 * @returns `left`/`top` in viewport coordinates, for `position: fixed`.
 */
export function placeFloating(
  anchor: DOMRect,
  tip: DOMRect,
  side: FloatingSide,
  align: "center" | "end" = "center"
) {
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
  const opposite: Record<FloatingSide, FloatingSide> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left"
  }
  // Keep the preferred side if it fits; otherwise use the opposite one when it fits, else the roomier of the two.
  const final =
    room[side] >= need
      ? side
      : room[opposite[side]] >= need || room[opposite[side]] > room[side]
        ? opposite[side]
        : side

  const centerX = align === "end" ? anchor.right - tip.width : anchor.left + anchor.width / 2 - tip.width / 2
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
