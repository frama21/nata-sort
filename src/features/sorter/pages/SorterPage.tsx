import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useBlocker } from "react-router"
import { AlertTriangleIcon } from "lucide-react"

import { Alert, AlertTitle } from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { useProjectStore } from "@/shared/stores/project.store"

import { EditorView } from "../components/EditorView"
import { WelcomeView } from "../components/WelcomeView"
import { useFileSystem } from "../hooks/useFileSystem"

/** The sorting workspace: pick a folder, then preview and file each photo. */
export const SorterPage = () => {
  const { t } = useTranslation()
  const fs = useFileSystem()
  const totalPhotos = fs.photos.length

  // Tell the top bar a project is open so it can offer "Close project".
  const { projectName, closeProject } = fs
  useEffect(() => {
    if (totalPhotos === 0 || !projectName) return
    useProjectStore.getState().open(projectName, closeProject)
    return () => useProjectStore.getState().clear()
  }, [totalPhotos, projectName, closeProject])

  // Directory handles live only in memory, so leaving this page ends the session.
  // Progress is already saved to the folder; still, confirm (in-app) before navigating away.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => totalPhotos > 0 && currentLocation.pathname !== nextLocation.pathname
  )

  return (
    <>
      {fs.error && (
        <Alert variant="destructive" className="m-3 w-auto max-w-md">
          <AlertTriangleIcon />
          <AlertTitle> {fs.error}</AlertTitle>
        </Alert>
      )}

      {totalPhotos === 0 ? (
        <WelcomeView
          isLoading={fs.isLoading}
          onLoadDirectory={fs.loadDirectory}
          onOpenRecent={fs.openRecentProject}
        />
      ) : (
        <EditorView fs={fs} />
      )}

      <Dialog
        open={blocker.state === "blocked"}
        onOpenChange={open => !open && blocker.state === "blocked" && blocker.reset()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sorter.leaveTitle")}</DialogTitle>
            <DialogDescription>{t("sorter.leaveConfirm")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => blocker.state === "blocked" && blocker.reset()}>
              {t("sorter.leaveStay")}
            </Button>
            <Button variant="destructive" onClick={() => blocker.state === "blocked" && blocker.proceed()}>
              {t("sorter.leaveGo")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
