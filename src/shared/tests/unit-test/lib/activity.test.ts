import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { deriveActivity } from "@/shared/lib/activity"
import {
  addStatus,
  isActivityStatus,
  SUCCESS_MS,
  useStatusStore,
  type StatusItem
} from "@/shared/stores/status.store"

const item = (type: StatusItem["type"], message: string, icon: StatusItem["icon"] = "file"): StatusItem => ({
  id: `${type}-${message}`,
  type,
  message,
  icon
})

describe("deriveActivity", () => {
  it("is idle 'saved' with no message when nothing is happening", () => {
    expect(deriveActivity([], 0, "Saving…")).toEqual({ phase: "saved", message: null })
  })

  it("shows the latest success as a transient saved message", () => {
    expect(deriveActivity([item("success", "a.jpg done")], 0, "Saving…")).toEqual({
      phase: "saved",
      message: "a.jpg done"
    })
  })

  it("prefers saving over a success, loading over saving, failed over everything", () => {
    const success = item("success", "ok")
    expect(deriveActivity([success], 1, "Saving…").phase).toBe("saving")
    expect(deriveActivity([item("loading", "Moving a.jpg…"), success], 1, "Saving…")).toEqual({
      phase: "loading",
      message: "Moving a.jpg…"
    })
    const failed = deriveActivity([item("error", "Failed to save data"), item("loading", "x")], 1, "Saving…")
    expect(failed).toMatchObject({ phase: "failed", message: "Failed to save data" })
    expect(failed.errorId).toBe("error-Failed to save data")
  })

  it("ignores toast statuses (folder icon)", () => {
    expect(deriveActivity([item("error", "Name too long", "folder")], 0, "Saving…").phase).toBe("saved")
    expect(isActivityStatus({ icon: "db" })).toBe(true)
    expect(isActivityStatus({ icon: "folder" })).toBe(false)
  })
})

describe("status store activity rules", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useStatusStore.setState({ statuses: [] })
  })
  afterEach(() => vi.useRealTimers())

  it("expires an activity success after SUCCESS_MS but keeps a toast success for its component", () => {
    addStatus({ type: "success", message: "a done", icon: "file" })
    addStatus({ type: "success", message: "folder made", icon: "folder" })
    vi.advanceTimersByTime(SUCCESS_MS + 1)
    expect(useStatusStore.getState().statuses.map(s => s.message)).toEqual(["folder made"])
  })

  it("clears an earlier activity error when new activity starts (loading), but not a toast error", () => {
    addStatus({ type: "error", message: "save failed", icon: "db" })
    addStatus({ type: "error", message: "bad name", icon: "folder" })
    addStatus({ type: "loading", message: "Moving…", icon: "file" })
    expect(useStatusStore.getState().statuses.map(s => s.message)).toEqual(["Moving…", "bad name"])
  })

  it("keeps an activity error across a success (e.g. 'database rebuilt' after 'database corrupt')", () => {
    addStatus({ type: "error", message: "corrupt", icon: "db" })
    addStatus({ type: "success", message: "rebuilt", icon: "db" })
    expect(useStatusStore.getState().statuses.map(s => s.message)).toEqual(["rebuilt", "corrupt"])
  })

  it("keeps an activity error when another error arrives", () => {
    addStatus({ type: "error", message: "first", icon: "db" })
    addStatus({ type: "error", message: "second", icon: "file" })
    expect(useStatusStore.getState().statuses.map(s => s.message)).toEqual(["second", "first"])
  })
})
