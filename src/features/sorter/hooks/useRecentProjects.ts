import { useCallback, useEffect, useState } from "react"

import { addStatus } from "@/shared/stores/status.store"
import { t } from "@/shared/i18n"

import { listRecentProjects, removeRecentProject, type RecentProject } from "../services/recent-projects.service"

/**
 * The recent-projects list for the start screen, plus removing an entry from it.
 * @returns The projects (newest first) and `remove(id)`.
 */
export const useRecentProjects = () => {
  const [projects, setProjects] = useState<RecentProject[]>([])

  useEffect(() => {
    let cancelled = false
    void listRecentProjects().then(list => !cancelled && setProjects(list))
    return () => {
      cancelled = true
    }
  }, [])

  /** Forgets a project. Only the list entry goes; the folder and its files are untouched. */
  const remove = useCallback(async (id: string) => {
    try {
      await removeRecentProject(id)
      setProjects(list => list.filter(p => p.id !== id))
      addStatus({ type: "success", message: t("toast.recentRemoved"), icon: "folder" })
    } catch (err) {
      console.warn("[RecentProjects] remove failed", err)
      addStatus({ type: "error", message: t("toast.recentRemoveFailed"), icon: "folder" })
    }
  }, [])

  return { projects, remove }
}
