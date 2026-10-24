import { useTranslation } from "react-i18next"
import { FolderOpen } from "lucide-react"

import { NataMark } from "@/shared/components/brand/NataMark"
import { Button } from "@/shared/components/ui/button"

interface WelcomeViewProps {
  isLoading: boolean
  onLoadDirectory: () => void
}

/**
 * The start screen shown when no folder is open yet: the mark, a one-line promise
 * and a single call-to-action to pick a local folder. All the heavy lifting happens
 * after a folder is chosen — this page only triggers `loadDirectory`.
 */
export const WelcomeView = ({ isLoading, onLoadDirectory }: WelcomeViewProps) => {
  const { t } = useTranslation()

  return (
    <div className="stagger mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <NataMark className="size-16 text-brand-ink dark:text-brand-paper" />
      <h2 className="text-[28px] leading-[34px] font-semibold text-balance">{t("welcome.title")}</h2>
      <p className="text-sm text-muted-foreground">
        {t("welcome.descriptionPre")}
        <code className="rounded-sm bg-surface-hover px-1.5 py-0.5 text-xs">nata-photo-db.json</code>
        {t("welcome.descriptionPost")}
      </p>
      <Button size="lg" loading={isLoading} onClick={onLoadDirectory}>
        {!isLoading && <FolderOpen />}
        {isLoading ? t("welcome.ctaLoading") : t("welcome.cta")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("welcome.requirement")}</p>
    </div>
  )
}
