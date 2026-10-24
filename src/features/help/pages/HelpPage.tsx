import { useTranslation } from "react-i18next"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

const TOPICS = ["privacy", "browser", "progress", "safety", "shortcuts"] as const

/** Static help: privacy, requirements, and how progress is stored. */
export const HelpPage = () => {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="help-title" className="mx-auto max-w-2xl space-y-3 p-4">
      <h2 id="help-title" className="text-lg leading-[26px] font-semibold">
        {t("help.title")}
      </h2>
      {TOPICS.map(topic => (
        <Card key={topic}>
          <CardHeader>
            <CardTitle>
              <h3>{t(`help.${topic}.title`)}</h3>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t(`help.${topic}.body`)}</CardContent>
        </Card>
      ))}
    </section>
  )
}
