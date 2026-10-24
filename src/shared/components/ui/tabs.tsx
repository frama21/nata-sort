import * as React from "react"

import { cn } from "@/shared/lib/utils"

// WAI-ARIA tabs pattern (automatic activation): one tab in the tab order, arrow
// keys / Home / End move between tabs, and only the active panel is rendered.

interface TabsContextValue {
  value: string
  select: (value: string) => void
  idFor: (part: "tab" | "panel", value: string) => string
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

const useTabs = (): TabsContextValue => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("Tabs components must be used inside <Tabs>")
  return context
}

type TabsProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

/** Tab set root. Controlled with `value`/`onValueChange`, or uncontrolled with `defaultValue`. */
function Tabs({ className, value, defaultValue = "", onValueChange, ...props }: TabsProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const current = value ?? uncontrolled
  const baseId = React.useId()

  const context = React.useMemo<TabsContextValue>(
    () => ({
      value: current,
      select: next => {
        if (value === undefined) setUncontrolled(next)
        onValueChange?.(next)
      },
      idFor: (part, v) => `${baseId}-${part}-${v}`
    }),
    [current, value, onValueChange, baseId]
  )

  return (
    <TabsContext.Provider value={context}>
      <div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />
    </TabsContext.Provider>
  )
}

/** Container for the tab buttons; handles arrow-key navigation. */
function TabsList({ className, onKeyDown, ...props }: React.ComponentProps<"div">) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    const tabs = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')]
    const index = tabs.indexOf(document.activeElement as HTMLButtonElement)
    if (index === -1) return
    const target =
      e.key === "ArrowRight"
        ? tabs[(index + 1) % tabs.length]
        : e.key === "ArrowLeft"
          ? tabs[(index - 1 + tabs.length) % tabs.length]
          : e.key === "Home"
            ? tabs[0]
            : e.key === "End"
              ? tabs[tabs.length - 1]
              : undefined
    if (!target) return
    e.preventDefault()
    target.focus()
    target.click()
  }

  return (
    <div
      data-slot="tabs-list"
      role="tablist"
      className={cn(
        "inline-flex h-8 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground",
        className
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

type TabsTriggerProps = Omit<React.ComponentProps<"button">, "value"> & { value: string }

/** A tab button that activates the panel with the same `value`. */
function TabsTrigger({ className, value, onClick, ...props }: TabsTriggerProps) {
  const tabs = useTabs()
  const active = tabs.value === value

  return (
    <button
      type="button"
      role="tab"
      id={tabs.idFor("tab", value)}
      aria-selected={active}
      aria-controls={tabs.idFor("panel", value)}
      tabIndex={active ? 0 : -1}
      data-slot="tabs-trigger"
      data-state={active ? "active" : "inactive"}
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground",
        className
      )}
      onClick={e => {
        onClick?.(e)
        tabs.select(value)
      }}
      {...props}
    />
  )
}

type TabsContentProps = React.ComponentProps<"div"> & { value: string }

/** The panel for one tab; rendered only while its tab is active. */
function TabsContent({ className, value, ...props }: TabsContentProps) {
  const tabs = useTabs()
  if (tabs.value !== value) return null

  return (
    <div
      role="tabpanel"
      id={tabs.idFor("panel", value)}
      aria-labelledby={tabs.idFor("tab", value)}
      tabIndex={0}
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
