import { useTranslation } from "react-i18next"
import { FolderOpen } from "lucide-react"

import { NataMark, NataWordmark } from "@/shared/components/brand/NataMark"
import { Button } from "@/shared/components/ui/button"

import { version } from "../../../../package.json"
import { RecentProjects } from "./RecentProjects"

interface WelcomeViewProps {
  isLoading: boolean
  onLoadDirectory: () => void
  onOpenRecent: (id: string) => void
}

/**
 * The start screen shown when no folder is open yet: the logo (mark over wordmark), what the
 * app does in one sentence and a call-to-action to pick a local folder, then the recent projects and the app
 * version. All the heavy lifting happens after a folder is chosen — this page only
 * triggers `loadDirectory` / `openRecentProject`.
 */
export const WelcomeView = ({ isLoading, onLoadDirectory, onOpenRecent }: WelcomeViewProps) => {
  const { t } = useTranslation()

  return (
    <div className="stagger mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      {/* Decorative: the top bar carries the page's "NATA" heading. */}
      <div aria-hidden className="mb-2 flex flex-col items-center gap-5">
        <NataMark className="size-20 text-brand-ink dark:text-brand-paper" />
        <NataWordmark className="h-6 w-auto text-brand-ink dark:text-brand-paper" />
      </div>
      <p className="text-base text-balance text-muted-foreground">{t("welcome.description")}</p>
      <Button size="lg" loading={isLoading} onClick={onLoadDirectory}>
        {!isLoading && <FolderOpen />}
        {isLoading ? t("welcome.ctaLoading") : t("welcome.cta")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("welcome.requirement")}</p>
      <RecentProjects disabled={isLoading} onOpen={onOpenRecent} />
      <p className="text-xs text-muted-foreground tabular-nums">{t("welcome.version", { version })}</p>
    </div>
  )
}
