import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useBlocker } from "react-router"
import { AlertTriangleIcon, XIcon } from "lucide-react"

import { Alert, AlertAction, AlertTitle } from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { useProjectStore } from "@/shared/stores/project.store"
import { useSaveStore } from "@/shared/stores/save.store"

import { EditorView } from "../components/EditorView"
import { WelcomeView } from "../components/WelcomeView"
import { useFileSystem } from "../hooks/useFileSystem"

/** How long the start screen stays to lift away once a project opens (matches `--dur-slow`). */
const WELCOME_EXIT_MS = 300

/** How long the workspace plays its exit before the project is actually closed (matches `--dur-slow`). */
const WORKSPACE_EXIT_MS = 280

/** The sorting workspace: pick a folder, then preview and file each photo. */
export const SorterPage = () => {
  const { t } = useTranslation()
  const fs = useFileSystem()
  const totalPhotos = fs.photos.length

  // When a project opens, the start screen stays mounted for a moment and lifts away over the
  // workspace as it slides in, instead of one view snapping to the other.
  const [wasEmpty, setWasEmpty] = useState(totalPhotos === 0)
  const [welcomeLeaving, setWelcomeLeaving] = useState(false)
  // Bumped each time the start screen returns, so it remounts with a fresh recent-projects list even
  // if the project was closed while the previous copy was still leaving.
  const [welcomeKey, setWelcomeKey] = useState(0)
  if ((totalPhotos === 0) !== wasEmpty) {
    setWasEmpty(totalPhotos === 0)
    setWelcomeLeaving(totalPhotos > 0)
    if (totalPhotos === 0) setWelcomeKey(k => k + 1)
  }
  useEffect(() => {
    if (!welcomeLeaving) return
    const timer = setTimeout(() => setWelcomeLeaving(false), WELCOME_EXIT_MS)
    return () => clearTimeout(timer)
  }, [welcomeLeaving])

  // Closing a project first plays the workspace's exit (the mirror of opening one), then closes it.
  // The panels are inert meanwhile, so a second click or a stray key does nothing.
  const { projectName, closeProject } = fs
  const [closing, setClosing] = useState(false)
  const requestClose = useCallback(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) closeProject()
    else setClosing(true)
  }, [closeProject])
  useEffect(() => {
    if (!closing) return
    const timer = setTimeout(() => {
      setClosing(false)
      closeProject()
    }, WORKSPACE_EXIT_MS)
    return () => clearTimeout(timer)
  }, [closing, closeProject])

  // Tell the top bar a project is open so it can offer "Close project".
  useEffect(() => {
    if (totalPhotos === 0 || !projectName) return
    useProjectStore.getState().open(projectName, requestClose)
    return () => useProjectStore.getState().clear()
  }, [totalPhotos, projectName, requestClose])

  // Closing or reloading the tab mid-write would leave the project file (or a half-copied photo)
  // inconsistent. Warn only while a write is actually in flight; saved progress needs no prompt.
  const sortingCount = fs.sortingKeys.size
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (sortingCount > 0 || useSaveStore.getState().pending > 0) e.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [sortingCount])

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
          <AlertTitle>{fs.error}</AlertTitle>
          <AlertAction>
            <Button variant="ghost" size="icon-sm" aria-label={t("common.close")} onClick={fs.clearError}>
              <XIcon />
            </Button>
          </AlertAction>
        </Alert>
      )}

      <div className="relative h-full">
        {(totalPhotos === 0 || welcomeLeaving) && (
          <div
            // Same element and position in the tree before and during the exit, so the screen is not remounted.
            inert={welcomeLeaving}
            aria-hidden={welcomeLeaving || undefined}
            className={
              welcomeLeaving
                ? "pointer-events-none absolute inset-0 z-10 animate-welcome-out bg-background"
                : "h-full"
            }
          >
            <WelcomeView
              key={welcomeKey}
              isLoading={fs.isLoading}
              onLoadDirectory={fs.loadDirectory}
              onOpenRecent={fs.openRecentProject}
            />
          </div>
        )}
        {totalPhotos > 0 && <EditorView fs={fs} closing={closing} />}
      </div>

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
