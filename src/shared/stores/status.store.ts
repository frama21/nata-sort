import { create } from "zustand"

export type StatusType = "idle" | "loading" | "success" | "error"

/** How long a success message stays before it clears itself. */
export const SUCCESS_MS = 3000

export interface StatusItem {
  id: string
  type: StatusType
  message: string
  icon: "db" | "folder" | "file" | "save"
}

/**
 * Messages about file activity (sorting, undo, saving, reading a project) show in the top bar's
 * activity indicator; everything else is a toast.
 * @param status A status item.
 * @returns True if it belongs to the activity indicator.
 */
export const isActivityStatus = (status: Pick<StatusItem, "icon">) =>
  status.icon === "file" || status.icon === "db"

interface StatusState {
  statuses: StatusItem[]
  addStatus: (status: Omit<StatusItem, "id">) => void
  /** Removes one status (a toast's dismiss button or its expiry timer). */
  dismissStatus: (id: string) => void
  /** Clears the transient "loading" toasts. Success toasts expire on their own; errors stay until dismissed. */
  clearStatus: () => void
}

export const useStatusStore = create<StatusState>((set, get) => ({
  statuses: [],

  addStatus: status => {
    const id = crypto.randomUUID()
    const activity = isActivityStatus(status)
    set(state => ({
      // A duplicate is shown once: the repeat replaces the earlier copy (and restarts its timer).
      statuses: [
        { ...status, id },
        ...state.statuses.filter(
          s =>
            !(s.type === status.type && s.message === status.message) &&
            // Starting new activity clears an earlier failed state. A success does not: "database
            // rebuilt" arrives right after "database corrupt" and must not hide it.
            !(activity && status.type === "loading" && isActivityStatus(s) && s.type === "error")
        )
      ].slice(0, 3)
    }))
    // Toasts expire in their component (paused on hover); activity messages have no component to do it.
    if (activity && status.type === "success") setTimeout(() => get().dismissStatus(id), SUCCESS_MS)
  },

  dismissStatus: id => set(state => ({ statuses: state.statuses.filter(s => s.id !== id) })),

  clearStatus: () =>
    set(state => ({
      statuses: state.statuses.filter(item => item.type !== "loading")
    }))
}))

// Helper untuk digunakan di luar React components
export const addStatus = (status: Omit<StatusItem, "id">) => {
  useStatusStore.getState().addStatus(status)
}

export const clearStatus = () => {
  useStatusStore.getState().clearStatus()
}
