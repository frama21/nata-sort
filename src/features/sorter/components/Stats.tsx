import { useTranslation } from "react-i18next"
import { ChartColumnDecreasing, CheckCircle2, XCircle } from "lucide-react"

import { Card, CardContent } from "@/shared/components/ui/card"
import { PanelHeader } from "@/shared/components/ui/panel-header"
import { Progress } from "@/shared/components/ui/progress"

interface StatsProps {
  totalPhotos: number
  sortedCount: number
  stats: {
    success: number
    failed: number
    total: number
  }
}

/** A compact metric tile: a tabular number over a small caption. */
const Metric = ({ value, label }: { value: number; label: string }) => (
  <div className="rounded-md border border-border px-3 py-2.5 text-center">
    <p className="text-lg leading-none font-semibold tabular-nums">{value.toLocaleString()}</p>
    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
  </div>
)

export const Stats = ({ totalPhotos, sortedCount, stats }: StatsProps) => {
  const { t } = useTranslation()
  const unsorted = totalPhotos - sortedCount
  const pct = totalPhotos > 0 ? Math.round((sortedCount / totalPhotos) * 100) : 0

  return (
    <Card size="sm" className="w-full">
      <PanelHeader
        icon={<ChartColumnDecreasing />}
        title={t("stats.title")}
        trailing={<span className="text-[13px] font-medium tabular-nums">{pct}%</span>}
      />
      <CardContent className="space-y-3">
        {/* Sorting progress */}
        <Progress value={pct} aria-label={t("progress.sortAria")} />

        <div className="grid grid-cols-3 gap-2">
          <Metric value={totalPhotos} label={t("stats.total")} />
          <Metric value={sortedCount} label={t("stats.sorted")} />
          <Metric value={unsorted} label={t("stats.remaining")} />
        </div>

        {/* Operation tallies */}
        <div className="flex items-center gap-4 border-t border-border pt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <CheckCircle2 aria-hidden className="size-3.5 text-success" />
            <span className="tabular-nums">{stats.success}</span> {t("stats.success")}
          </span>
          {stats.failed > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <XCircle aria-hidden className="size-3.5 text-destructive" />
              <span className="tabular-nums">{stats.failed}</span> {t("stats.failed")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
