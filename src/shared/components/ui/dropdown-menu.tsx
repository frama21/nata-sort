import * as React from "react"
import { MoreVertical } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { placeFloating } from "@/shared/lib/floating"
import { cn } from "@/shared/lib/utils"

// A small action menu behind an icon button. The panel is a native `popover="auto"`:
// top layer (never clipped by a scroll container), closes on outside click and Escape,
// and the trigger toggles it through `popoverTarget`, so a click on the open trigger
// can't immediately reopen it. Arrow keys / Home / End move between the items.

export interface DropdownMenuItem {
  label: string
  icon?: React.ReactNode
  onSelect: () => void
  destructive?: boolean
}

interface DropdownMenuProps {
  /** Accessible name of the trigger button, e.g. "Actions for Holiday". */
  label: string
  items: DropdownMenuItem[]
  className?: string
}

/** A "more actions" (⋮) button that opens a menu of `items`. */
function DropdownMenu({ label, items, className }: DropdownMenuProps) {
  const id = React.useId()
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)

  React.useLayoutEffect(() => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!open || !trigger || !menu) return

    const reposition = () => {
      const { left, top } = placeFloating(
        trigger.getBoundingClientRect(),
        menu.getBoundingClientRect(),
        "bottom",
        "end"
      )
      menu.style.left = `${left}px`
      menu.style.top = `${top}px`
    }
    const close = () => menu.hidePopover()
    reposition()
    menu.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    // A menu anchored to a row that scrolls away would float in the wrong place; just close it.
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const entries = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')]
    const index = entries.indexOf(document.activeElement as HTMLElement)
    const target =
      e.key === "ArrowDown"
        ? entries[(index + 1) % entries.length]
        : e.key === "ArrowUp"
          ? entries[(index - 1 + entries.length) % entries.length]
          : e.key === "Home"
            ? entries[0]
            : e.key === "End"
              ? entries[entries.length - 1]
              : undefined
    if (!target) return
    e.preventDefault()
    target.focus()
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        popoverTarget={id}
        className={className}
      >
        <MoreVertical />
      </Button>
      <div
        ref={menuRef}
        id={id}
        role="menu"
        aria-label={label}
        popover="auto"
        onToggle={e => setOpen((e as unknown as ToggleEvent).newState === "open")}
        onKeyDown={onKeyDown}
        className="inset-auto m-0 min-w-44 overflow-visible rounded-md border border-border bg-surface-raised p-1 text-sm text-foreground shadow-e2"
      >
        {items.map(item => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => {
              menuRef.current?.hidePopover()
              item.onSelect()
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left outline-none hover:bg-surface-hover focus-visible:bg-surface-hover pointer-coarse:py-2.5 [&_svg]:size-4 [&_svg]:shrink-0",
              item.destructive && "text-destructive"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}

export { DropdownMenu }
