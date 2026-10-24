import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { FolderManager } from "../../../components/FolderManager"
import type { SortFolder } from "../../../types/sorter.types"

const folder = (id: string, name: string, shortcut: string): SortFolder => ({
  id,
  name,
  shortcut,
  color: "bg-red-500",
  createdAt: 0,
  dirHandle: null
})

const setup = (folders: SortFolder[] = []) => {
  const props = {
    folders,
    moveMode: "copy" as const,
    onAdd: vi.fn(async () => {}),
    onRemove: vi.fn(async () => {}),
    onAssign: vi.fn(async () => {}),
    onMoveModeChange: vi.fn(),
    currentIndex: 3,
    canUndo: false,
    onUndo: vi.fn(),
    onJumpUnsorted: vi.fn()
  }
  render(<FolderManager {...props} />)
  return { props, user: userEvent.setup() }
}

describe("FolderManager", () => {
  it("adds a folder with Enter and clears the input", async () => {
    const { props, user } = setup()
    const input = screen.getByLabelText(/Folder/)

    await user.type(input, "  Keep  {Enter}")

    expect(props.onAdd).toHaveBeenCalledWith("Keep")
    expect(input).toHaveValue("")
  })

  it("disables the add button until a name is typed", async () => {
    const { user } = setup()
    const add = screen.getByRole("button", { name: "Tambah folder" })
    expect(add).toBeDisabled()
    await user.type(screen.getByLabelText(/Folder/), "x")
    expect(add).toBeEnabled()
  })

  it("sorts the current photo into a folder and removes folders", async () => {
    const { props, user } = setup([folder("f1", "Keep", "1")])

    await user.click(screen.getByRole("button", { name: "Sortir" }))
    expect(props.onAssign).toHaveBeenCalledWith(3, "f1")

    await user.click(screen.getByRole("button", { name: "Hapus folder Keep" }))
    expect(props.onRemove).toHaveBeenCalledWith("f1")
  })

  it("keeps undo disabled when there is nothing to undo", () => {
    setup()
    expect(screen.getByRole("button", { name: /Undo/ })).toBeDisabled()
  })
})
