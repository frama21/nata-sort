import type { ReactNode } from "react"

import { CardHeader, CardTitle } from "@/shared/components/ui/card"

/**
 * Shared sidebar-panel header: a muted icon + title-sm title, with an optional
 * subtitle and a trailing slot (e.g. a count badge). Keeps every panel
 * ("Sort folders", "Photo info", "Log", "Statistics") visually consistent.
 */
export const PanelHeader = ({
  icon,
  title,
  subtitle,
  trailing
}: {
  icon: ReactNode
  title: string
  subtitle?: ReactNode
  trailing?: ReactNode
}) => (
  <CardHeader>
    <CardTitle className="flex flex-row items-center gap-2">
      <span aria-hidden className="grid shrink-0 place-items-center text-muted-foreground [&>svg]:size-4">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-base leading-6 font-semibold">{title}</span>
        {subtitle && <span className="truncate text-xs font-normal text-muted-foreground">{subtitle}</span>}
      </div>
      {trailing}
    </CardTitle>
  </CardHeader>
)
