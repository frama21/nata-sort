import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { useProjectStore } from "@/shared/stores/project.store"
import { appConfig } from "../../config"

const ABOUT_TOPICS = ["privacy", "browser", "progress", "safety"] as const

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 text-sm first:pt-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="min-w-0 truncate text-right">{children}</span>
  </div>
)

/** App name and version, the open project, and how NATA treats your files. */
export const AboutTab = () => {
  const { t } = useTranslation()
  const projectName = useProjectStore(s => s.name)

  return (
    <div className="grid gap-4">
      <div>
        <Row label={t("settings.aboutApp")}>{appConfig.name}</Row>
        <Row label={t("settings.aboutVersion")}>{appConfig.version}</Row>
        <Row label={t("settings.aboutProject")}>{projectName ?? t("settings.aboutNoProject")}</Row>
      </div>
      <div className="grid gap-1">
        <p className="text-sm">{t("settings.aboutSummary")}</p>
        <p className="text-sm text-muted-foreground">{t("settings.aboutPrivacy")}</p>
      </div>
      {ABOUT_TOPICS.map(topic => (
        <section key={topic} className="grid gap-1">
          <h3 className="text-sm font-semibold">{t(`help.${topic}.title`)}</h3>
          <p className="text-sm text-muted-foreground">{t(`help.${topic}.body`)}</p>
        </section>
      ))}
    </div>
  )
}
