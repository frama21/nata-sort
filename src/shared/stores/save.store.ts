import { create } from "zustand"

interface SaveState {
  /** Project-file writes queued or running that the user should see. */
  pending: number
}

/** Counts user-visible project writes so the top bar can show "Saving…". */
export const useSaveStore = create<SaveState>(() => ({ pending: 0 }))

export const beginSave = () => useSaveStore.setState(s => ({ pending: s.pending + 1 }))
export const endSave = () => useSaveStore.setState(s => ({ pending: Math.max(0, s.pending - 1) }))
