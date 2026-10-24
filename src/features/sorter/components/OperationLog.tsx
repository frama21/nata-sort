import { useTranslation } from "react-i18next"
import { Check, X, Scissors, Copy, Logs } from "lucide-react"

import { Card, CardContent } from "@/shared/components/ui/card"
import { PanelHeader } from "@/shared/components/ui/panel-header"
import { cn } from "@/shared/lib/utils"

import type { SortOperation } from "../types/sorter.types"

interface OperationLogProps {
  operations: SortOperation[]
}

export const OperationLog = ({ operations }: OperationLogProps) => {
  const { t } = useTranslation()

  const recentOps = operations.slice(-3).reverse()

  return (
    <Card size="sm" className="w-full">
      <PanelHeader icon={<Logs />} title={t("log.title")} subtitle={t("log.subtitle")} />
      <CardContent>
        {recentOps.length === 0 && (
          <p className="px-1 py-2 text-center text-xs text-muted-foreground">{t("log.empty")}</p>
        )}
        <ul className="flex flex-col gap-1.5">
          {recentOps.map((op, i) => (
            // A batch can log several operations in the same millisecond. The index counts from the
            // start of the log, so a new entry mounts (and rises) alone instead of re-keying the rest.
            <li
              key={`${op.timestamp}-${operations.length - 1 - i}`}
              className="flex animate-rise items-center gap-3 rounded-md border border-border px-3 py-2"
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-5 shrink-0 place-items-center",
                  op.success ? "text-success" : "text-destructive"
                )}
              >
                {op.success ? <Check className="size-4" /> : <X className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{op.photoName}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  {op.mode === "cut" ? <Scissors className="size-3" /> : <Copy className="size-3" />}
                  <span className="truncate">
                    {op.success
                      ? `${op.mode === "cut" ? t("batch.verbMove") : t("batch.verbCopy")} → ${op.folderName}`
                      : op.error || t("log.failed")}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
