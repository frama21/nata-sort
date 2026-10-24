// Recently opened project folders, kept in this browser's IndexedDB so the start
// screen can reopen them. Directory handles are structured-cloneable, so they are
// stored as-is; they never leave the device and are never written to the project DB.

const DB_NAME = "nata-recent-projects"
const STORE = "projects"
const MAX_RECENT = 30
const MAX_NAME_LENGTH = 255

export interface RecentProject {
  id: string
  name: string
  photoCount: number
  /** Epoch ms of the last time the project was opened or closed. */
  updatedAt: number
  handle: FileSystemDirectoryHandle
}

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

/**
 * Runs `work` in one transaction and resolves with its result once the transaction commits.
 * @param mode Transaction mode.
 * @param work Issues the store requests; returns the one whose result is wanted.
 * @returns That request's result.
 */
const withStore = async <T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T> | undefined
): Promise<T | undefined> => {
  const db = await openDb()
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const request = work(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(request?.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

// Stored data is only as trusted as the browser profile, but it is re-validated on read anyway.
const isRecentProject = (value: unknown): value is RecentProject => {
  if (typeof value !== "object" || value === null) return false
  const v = value as Partial<RecentProject>
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    v.name.length > 0 &&
    v.name.length <= MAX_NAME_LENGTH &&
    typeof v.photoCount === "number" &&
    Number.isInteger(v.photoCount) &&
    v.photoCount >= 0 &&
    typeof v.updatedAt === "number" &&
    Number.isFinite(v.updatedAt) &&
    typeof FileSystemDirectoryHandle !== "undefined" &&
    v.handle instanceof FileSystemDirectoryHandle
  )
}

/**
 * Recent projects, newest first. Never throws: storage can be unavailable (private
 * windows, blocked site data), in which case the list is simply empty.
 * @returns Valid recent projects sorted by `updatedAt` descending.
 */
export const listRecentProjects = async (): Promise<RecentProject[]> => {
  try {
    const all = (await withStore("readonly", store => store.getAll() as IDBRequest<unknown[]>)) ?? []
    return all.filter(isRecentProject).sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (err) {
    console.warn("[RecentProjects] list failed", err)
    return []
  }
}

/**
 * One recent project by id.
 * @param id Id from `listRecentProjects`.
 * @returns The project, or undefined if it is gone or invalid.
 */
export const getRecentProject = async (id: string): Promise<RecentProject | undefined> =>
  (await listRecentProjects()).find(p => p.id === id)

/**
 * Adds a folder to the recent list, or refreshes it if the same folder is already there,
 * and drops the oldest entries beyond the cap. Never throws; recents are a convenience.
 * @param handle The opened project folder.
 * @param photoCount How many supported files it contains.
 */
export const saveRecentProject = async (handle: FileSystemDirectoryHandle, photoCount: number): Promise<void> => {
  try {
    const existing = await listRecentProjects()
    let id: string | undefined
    for (const project of existing) {
      if (await project.handle.isSameEntry(handle)) {
        id = project.id
        break
      }
    }
    const record: RecentProject = {
      id: id ?? crypto.randomUUID(),
      name: handle.name.slice(0, MAX_NAME_LENGTH) || "—",
      photoCount,
      updatedAt: Date.now(),
      handle
    }
    const stale = existing.filter(p => p.id !== record.id).slice(MAX_RECENT - 1)
    await withStore("readwrite", store => {
      for (const old of stale) store.delete(old.id)
      return store.put(record)
    })
  } catch (err) {
    console.warn("[RecentProjects] save failed", err)
  }
}

/**
 * Removes a project from the recent list. Does not touch the folder or its files.
 * @param id Id from `listRecentProjects`.
 */
export const removeRecentProject = async (id: string): Promise<void> => {
  await withStore("readwrite", store => store.delete(id))
}
