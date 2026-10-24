import { create } from "zustand"

export type StatusType = "idle" | "loading" | "success" | "error"

export interface StatusItem {
  id: string
  type: StatusType
  message: string
  icon: "db" | "folder" | "file" | "save"
}

interface StatusState {
  statuses: StatusItem[]
  addStatus: (status: Omit<StatusItem, "id">) => void
  /** Removes one status (a toast's dismiss button or its expiry timer). */
  dismissStatus: (id: string) => void
  /** Clears the transient "loading" toasts. Success toasts expire on their own; errors stay until dismissed. */
  clearStatus: () => void
}

export const useStatusStore = create<StatusState>(set => ({
  statuses: [],

  addStatus: status =>
    set(state => ({
      // A duplicate is shown once: the repeat replaces the earlier copy (and restarts its timer).
      statuses: [
        { ...status, id: crypto.randomUUID() },
        ...state.statuses.filter(s => !(s.type === status.type && s.message === status.message))
      ].slice(0, 3)
    })),

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
