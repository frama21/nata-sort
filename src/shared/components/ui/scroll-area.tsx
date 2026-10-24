import * as React from "react"

import { cn } from "@/shared/lib/utils"

type ScrollAreaProps = React.ComponentProps<"div"> & {
  orientation?: "vertical" | "horizontal"
  /** Ref to the element that actually scrolls (e.g. for an IntersectionObserver root). */
  viewportRef?: React.Ref<HTMLDivElement>
}

/** A scroll container with thin native scrollbars. */
function ScrollArea({ className, children, orientation = "vertical", viewportRef, ...props }: ScrollAreaProps) {
  return (
    <div data-slot="scroll-area" className={cn("relative", className)} {...props}>
      <div
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className={cn(
          "size-full rounded-[inherit] [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
          orientation === "horizontal" ? "overflow-x-auto overflow-y-hidden" : "overflow-x-hidden overflow-y-auto"
        )}
      >
        {children}
      </div>
    </div>
  )
}

export { ScrollArea }
