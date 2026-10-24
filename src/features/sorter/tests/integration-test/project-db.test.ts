import { beforeEach, describe, expect, it, vi } from "vitest"

import { useStatusStore } from "@/shared/stores/status.store"
import { MemoryDirectoryHandle } from "@/test/global-mocks/file-system"
import {
  initProjectDatabase,
  updateDatabaseAfterOperation,
  updateDatabaseFolders
} from "../../services/project-db.service"

const DB = "nata-sort-db.json"

const validState = (overrides: Record<string, unknown> = {}) => ({
  version: "2.0",
  folders: [{ id: "f1", name: "Keep", shortcut: "1", color: "bg-red-500", createdAt: 1 }],
  sortedPhotos: { "a.jpg": "f1" },
  moveMode: "cut",
  currentIndex: 2,
  operations: [],
  metadataCache: {},
  stats: { totalPhotos: 3, sortedCount: 1, successOperations: 0, failedOperations: 0 },
  timestamp: 1,
  ...overrides
})

const readDb = async (dir: MemoryDirectoryHandle) => JSON.parse((await dir.files.get(DB)?.text()) ?? "null")
const lastStatus = () => useStatusStore.getState().statuses.at(-1)?.message

describe("project database (service + folder handle)", () => {
  beforeEach(() => {
    useStatusStore.setState({ statuses: [] })
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("creates a fresh database on first open", async () => {
    const dir = new MemoryDirectoryHandle()
    const state = await initProjectDatabase(dir.asHandle())

    expect(state).toMatchObject({ version: "2.0", folders: [], moveMode: "copy", currentIndex: 0 })
    expect(await readDb(dir)).toMatchObject({ version: "2.0", sortedPhotos: {} })
  })

  it("loads an existing valid database", async () => {
    const dir = new MemoryDirectoryHandle()
    dir.addFile(DB, JSON.stringify(validState()))

    const state = await initProjectDatabase(dir.asHandle())

    expect(state.folders.map(f => f.name)).toEqual(["Keep"])
    expect(state.sortedPhotos["a.jpg"]).toBe("f1")
    expect(state.moveMode).toBe("cut")
  })

  it.each([
    ["corrupt JSON", "{not json", "Database rusak, dibuat ulang"],
    ["an invalid shape", JSON.stringify({ hello: "world" }), "Format database tidak valid, dibuat ulang"],
    [
      "an old version",
      JSON.stringify(validState({ version: "1.0" })),
      "Database versi 1.0 tidak kompatibel, dibuat ulang"
    ]
  ])("resets and warns the user on %s", async (_, content, message) => {
    const dir = new MemoryDirectoryHandle()
    dir.addFile(DB, content)

    const state = await initProjectDatabase(dir.asHandle())

    expect(state.folders).toEqual([])
    expect(useStatusStore.getState().statuses.map(s => s.message)).toContain(message)
    expect((await readDb(dir)).version).toBe("2.0")
  })

  it("strips prototype-pollution keys and coerces unsafe scalars on load", async () => {
    const dir = new MemoryDirectoryHandle()
    const crafted = `{"version":"2.0","folders":[{"id":"f1","name":"Keep"},{"bad":true}],
      "sortedPhotos":{"__proto__":{"polluted":"yes"},"constructor":"x","a.jpg":"f1","b.jpg":42},
      "moveMode":"delete-everything","currentIndex":-5,"operations":[]}`
    dir.addFile(DB, crafted)

    const state = await initProjectDatabase(dir.asHandle())

    expect(Object.keys(state.sortedPhotos)).toEqual(["a.jpg"])
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(state.folders).toHaveLength(1)
    expect(state.moveMode).toBe("copy")
    expect(state.currentIndex).toBe(0)
    expect(lastStatus()).toBe("Project dimuat")
  })

  it("serializes concurrent writes so no update is lost", async () => {
    const dir = new MemoryDirectoryHandle()
    await initProjectDatabase(dir.asHandle())

    const keys = Array.from({ length: 20 }, (_, i) => `img_${i}.jpg`)
    await Promise.all([
      ...keys.map((k, i) =>
        updateDatabaseAfterOperation(dir.asHandle(), {
          sortedPatch: { [k]: "f1" },
          currentIndex: i,
          totalPhotos: keys.length,
          operations: [
            { photoName: k, folderId: "f1", folderName: "Keep", mode: "copy", success: true, timestamp: i }
          ]
        })
      ),
      updateDatabaseFolders(dir.asHandle(), [
        { id: "f1", name: "Keep", shortcut: "1", color: "bg-red-500", createdAt: 1, dirHandle: null }
      ])
    ])

    const db = await readDb(dir)
    expect(Object.keys(db.sortedPhotos).sort()).toEqual([...keys].sort())
    expect(db.operations).toHaveLength(20)
    expect(db.folders).toEqual([{ id: "f1", name: "Keep", shortcut: "1", color: "bg-red-500", createdAt: 1 }])
    expect(db.stats).toMatchObject({ sortedCount: 20, successOperations: 20 })
  })
})
