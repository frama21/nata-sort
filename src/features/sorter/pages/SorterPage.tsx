import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useBlocker } from "react-router"
import { AlertTriangleIcon } from "lucide-react"

import { Alert, AlertTitle } from "@/shared/components/ui/alert"

import { EditorView } from "../components/EditorView"
import { WelcomeView } from "../components/WelcomeView"
import { useFileSystem } from "../hooks/useFileSystem"

/** The sorting workspace: pick a folder, then preview and file each photo. */
export const SorterPage = () => {
  const { t } = useTranslation()
  const fs = useFileSystem()
  const totalPhotos = fs.photos.length

  // Directory handles live only in memory, so leaving this page ends the session.
  // Progress is already saved to the folder; still, confirm before navigating away.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => totalPhotos > 0 && currentLocation.pathname !== nextLocation.pathname
  )
  useEffect(() => {
    if (blocker.state !== "blocked") return
    if (window.confirm(t("sorter.leaveConfirm"))) {
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }, [blocker, t])

  return (
    <>
      {fs.error && (
        <Alert className="max-w-md border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50">
          <AlertTriangleIcon />
          <AlertTitle> {fs.error}</AlertTitle>
        </Alert>
      )}

      {totalPhotos === 0 ? (
        <WelcomeView isLoading={fs.isLoading} onLoadDirectory={fs.loadDirectory} />
      ) : (
        <EditorView fs={fs} />
      )}
    </>
  )
}
