import { create } from "zustand"

interface ProjectState {
  /** Name of the open project folder, or null when none is open. */
  name: string | null
  /** Closes the open project; set by the feature that owns the session. */
  close: (() => void) | null
  open: (name: string, close: () => void) => void
  clear: () => void
}

/** Lets the top bar show a "Close project" button without owning the sorter session. */
export const useProjectStore = create<ProjectState>(set => ({
  name: null,
  close: null,
  open: (name, close) => set({ name, close }),
  clear: () => set({ name: null, close: null })
}))
