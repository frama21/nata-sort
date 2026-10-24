import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import debounce from "lodash.debounce"

import {
  isSupportedImage,
  isPreviewable,
  getFileFormatInfo,
  decodeRawImage,
  decodeRawThumbnail,
  extractMetadata,
  parseCaptureDate,
  type PhotoMetadata
} from "@/features/media"
import {
  initProjectDatabase,
  updateDatabaseAfterOperation,
  updateDatabaseFolders,
  updateDatabaseMode,
  updateDatabaseMetadata
} from "../services/project-db.service"
import { getRecentProject, saveRecentProject } from "../services/recent-projects.service"

import type {
  PhotoFile,
  SortFolder,
  SortedMapping,
  MoveMode,
  SortOperation,
  NavigationDirection
} from "../types/sorter.types"

import { addStatus, clearStatus } from "@/shared/stores/status.store"
import { t } from "@/shared/i18n"
import { haptic } from "@/shared/lib/haptics"
import { validateFolderName } from "../utils/folder-name.utils"
import { applyAssign, moveFileHandle } from "../utils/file-ops.utils"
import { validateShortcut } from "../utils/shortcut.utils"
import {
  FOLDER_COLORS,
  MAX_UNDO,
  METADATA_CONCURRENCY,
  METADATA_PERSIST_DEBOUNCE_MS
} from "../constants/sorter.constants"

interface UndoItem {
  photoKey: string
  photoName: string
  /** The actual name written to the target (may differ on collision). */
  createdName: string
  folderId: string
  mode: MoveMode
}

/** One undoable action: a single sort, a batch sort, or a reject (1..N files). */
interface UndoEntry {
  items: UndoItem[]
  /** Index to return to after the action is undone. */
  anchorIndex: number
}

export interface FileSystemHook {
  photos: PhotoFile[]
  currentIndex: number
  folders: SortFolder[]
  sortedPhotos: SortedMapping
  isLoading: boolean
  error: string | null
  /** Dismisses the current error message. */
  clearError: () => void
  /** Keys of photos whose copy/move is in flight (for busy feedback). */
  sortingKeys: ReadonlySet<string>
  moveMode: MoveMode
  operations: SortOperation[]
  rawPreviewUrls: Map<string, string>
  /** Small RAW previews for the filmstrip/grid thumbnails. */
  rawThumbUrls: Map<string, string>
  isDecodingRaw: boolean
  /** RAW photos whose preview could not be decoded (offered a retry). */
  rawFailedKeys: ReadonlySet<string>
  metadataByKey: Map<string, PhotoMetadata>
  canUndo: boolean
  /** Keys of the currently multi-selected photos. */
  selectedKeys: Set<string>

  /** Name of the open project folder, or null when none is open. */
  projectName: string | null
  loadDirectory: () => Promise<void>
  /** Reopens a folder from the recent-projects list (asks for access again if needed). */
  openRecentProject: (id: string) => Promise<void>
  /** Closes the open project and returns to the start screen. Progress is already saved. */
  closeProject: () => void
  /** Resolves to true when the folder was created (false: nothing was created, the reason is shown). */
  addFolder: (name: string) => Promise<boolean>
  removeFolder: (folderId: string) => Promise<void>
  /** Set (or clear, with null) a folder's sort-shortcut key, with validation. */
  setFolderShortcut: (folderId: string, rawKey: string | null) => Promise<void>
  assignPhotoToFolder: (photoIndex: number, folderId: string) => Promise<void>
  undoLastOperation: () => Promise<void>
  navigatePhoto: (direction: NavigationDirection) => void
  goToIndex: (index: number) => void
  jumpToNextUnsorted: () => void
  recreatePreviewUrl: (photoKey: string) => void
  /** Retries a RAW preview decode that failed. */
  retryRawDecode: (photoKey: string) => void
  setMoveMode: (mode: MoveMode) => void
  toggleSelect: (photoIndex: number) => void
  selectRangeTo: (photoIndex: number) => void
  clearSelection: () => void
  selectAllUnsorted: () => void
  toggleSelectAll: () => void
  batchAssignToFolder: (folderId: string) => Promise<void>
  getCurrentPhoto: () => PhotoFile | null
  getCurrentFolder: () => { name: string; color: string } | null
  /** Display metadata (name + color) for a folder id, or null if unknown. */
  getFolderMeta: (folderId: string | undefined) => { name: string; color: string } | null
  getOperationStats: () => { success: number; failed: number; total: number }
}

export const useFileSystem = (): FileSystemHook => {
  // === STATE ===
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [folders, setFolders] = useState<SortFolder[]>([])
  const [sortedPhotos, setSortedPhotos] = useState<SortedMapping>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [moveMode, setMoveModeState] = useState<MoveMode>("copy") // DEFAULT: COPY
  const [operations, setOperations] = useState<SortOperation[]>([])
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])
  const [projectName, setProjectName] = useState<string | null>(null)

  // RAW preview state
  const [rawPreviewUrls, setRawPreviewUrls] = useState<Map<string, string>>(new Map())
  const [isDecodingRaw, setIsDecodingRaw] = useState(false)
  const rawDecodeQueueRef = useRef<Set<string>>(new Set())
  const rawPreviewKeysRef = useRef<Set<string>>(new Set())
  const failedRawDecodesRef = useRef<Set<string>>(new Set())
  const [rawRetryTick, setRawRetryTick] = useState(0)
  const [rawFailedKeys, setRawFailedKeys] = useState<ReadonlySet<string>>(new Set())

  // RAW thumbnails (filmstrip/grid) — small, decoded in the background.
  const [rawThumbUrls, setRawThumbUrls] = useState<Map<string, string>>(new Map())
  const rawThumbKeysRef = useRef<Set<string>>(new Set())
  const rawThumbQueueRef = useRef<Set<string>>(new Set())

  // Lazily-extracted metadata, keyed by stable file key.
  const [metadataByKey, setMetadataByKey] = useState<Map<string, PhotoMetadata>>(new Map())
  const metaQueueRef = useRef<Set<string>>(new Set())
  // RAW files whose real (libraw) dimensions have already been resolved, so the
  // lazy deep-dims pass runs at most once per file.
  const rawDimsDoneRef = useRef<Set<string>>(new Set())
  const metadataCacheRef = useRef<Record<string, PhotoMetadata>>({})

  // Multi-select (ephemeral).
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  // === REFS ===
  const rootDirHandleRef = useRef<FileSystemDirectoryHandle | null>(null)
  const folderDirHandlesRef = useRef<Map<string, FileSystemDirectoryHandle>>(new Map())
  /** Keys of photos whose copy/move is in flight. */
  const sortingKeysRef = useRef(new Set<string>())
  const [sortingKeys, setSortingKeys] = useState<ReadonlySet<string>>(new Set())
  const undoingRef = useRef(false)
  // Anchor index for shift-click range selection.
  const selectionAnchorRef = useRef<number | null>(null)

  // === BLOB URL LIFECYCLE: revoke to avoid leaking across reloads/unmount ===
  const revokeAllUrls = useCallback(() => {
    setPhotos(prev => {
      prev.forEach(p => p.url && URL.revokeObjectURL(p.url))
      return prev
    })
    setRawPreviewUrls(prev => {
      prev.forEach(url => URL.revokeObjectURL(url))
      return new Map()
    })
    setRawThumbUrls(prev => {
      prev.forEach(url => URL.revokeObjectURL(url))
      return new Map()
    })
    rawPreviewKeysRef.current.clear()
    rawThumbKeysRef.current.clear()
    rawThumbQueueRef.current.clear()
  }, [])

  useEffect(() => {
    // Revoke everything when the hook unmounts.
    return () => revokeAllUrls()
  }, [revokeAllUrls])

  // === DEBOUNCED METADATA PERSIST ===
  // Inputs are passed as arguments (read at call time inside effects), not
  // closed over, so the debounced function never reads a ref during render.
  const persistMetadata = useMemo(
    () =>
      debounce(
        (handle: FileSystemDirectoryHandle, cache: Record<string, PhotoMetadata>) =>
          updateDatabaseMetadata(handle, cache),
        METADATA_PERSIST_DEBOUNCE_MS
      ),
    []
  )

  useEffect(() => {
    // Flush any pending metadata write when the hook unmounts.
    return () => {
      persistMetadata.flush()
    }
  }, [persistMetadata])

  // === DIRECTORY LOADING ===
  /** Opens the folder returned by `pickDirectory`, replacing any open project. */
  const openProject = useCallback(
    async (pickDirectory: () => Promise<FileSystemDirectoryHandle>) => {
      addStatus({
        type: "loading",
        message: t("toast.loadingProject"),
        icon: "file"
      })

      try {
        const dirHandle = await pickDirectory()

        // Reloading a (possibly different) folder: drop the previous session.
        revokeAllUrls()
        rawDecodeQueueRef.current.clear()
        failedRawDecodesRef.current.clear()
        setRawFailedKeys(new Set())
        metaQueueRef.current.clear()
        rawDimsDoneRef.current.clear()
        setUndoStack([])
        setSelectedKeys(new Set())
        selectionAnchorRef.current = null

        rootDirHandleRef.current = dirHandle
        setProjectName(dirHandle.name)
        setIsLoading(true)
        setError(null)
        setOperations([])

        // === INIT DATABASE: Auto-create if not exists ===
        const dbState = await initProjectDatabase(dirHandle)
        const cachedMeta = dbState.metadataCache ?? {}
        metadataCacheRef.current = { ...cachedMeta }

        const imageFiles: PhotoFile[] = []
        let index = 0
        let unreadable = 0

        // Scan directory for images (top level only).
        for await (const entry of dirHandle.values()) {
          if (entry.kind === "file" && isSupportedImage(entry.name)) {
            let file: File
            try {
              file = await entry.getFile()
            } catch {
              // One unreadable file (locked, removed mid-scan) must not abort the whole open.
              unreadable++
              continue
            }
            const formatInfo = getFileFormatInfo(entry.name)!
            const canPreview = isPreviewable(entry.name)
            const key = entry.name

            // Use cached metadata if present; otherwise a lightweight placeholder.
            const cached = cachedMeta[key]
            const metadata: PhotoMetadata = cached ?? {
              fileSize: file.size,
              megapixels: 0,
              dimensions: { width: 0, height: 0 },
              isVideo: formatInfo.category === "video"
            }

            imageFiles.push({
              id: index++,
              key,
              name: entry.name,
              handle: entry,
              file,
              url: canPreview ? URL.createObjectURL(file) : null,
              size: file.size,
              format: formatInfo,
              metadata
            })
          }
        }

        // === EXTRACT CAPTURE DATES (concurrent) to order photos chronologically ===
        // Only files without cached metadata are read (header-only), and the cache
        // makes subsequent opens of the same folder instant.
        const cache = metadataCacheRef.current
        const total = imageFiles.length
        let processed = 0
        let cursor = 0
        const worker = async () => {
          while (cursor < imageFiles.length) {
            const p = imageFiles[cursor++]
            if (!cache[p.key]) {
              try {
                cache[p.key] = await extractMetadata(p.file)
              } catch {
                // Leave uncached — ordering falls back to the file's mtime.
              }
            }
            processed++
            if (processed === total || processed % 8 === 0) {
              addStatus({
                type: "loading",
                message: t("toast.readingDates", { processed, total }),
                icon: "file"
              })
            }
          }
        }
        await Promise.all(Array.from({ length: Math.min(METADATA_CONCURRENCY, total || 1) }, () => worker()))

        // Sort by capture date (oldest first); fall back to file mtime.
        const sortTs = (p: PhotoFile) => parseCaptureDate(cache[p.key]?.dateTaken) ?? p.file.lastModified
        imageFiles.sort((a, b) => sortTs(a) - sortTs(b) || a.key.localeCompare(b.key))

        const nextMetaMap = new Map<string, PhotoMetadata>()
        for (const p of imageFiles) {
          const meta = cache[p.key]
          if (meta) {
            nextMetaMap.set(p.key, meta)
            p.metadata = meta
          }
        }

        setPhotos(imageFiles)
        setMetadataByKey(nextMetaMap)
        if (imageFiles.length > 0) void saveRecentProject(dirHandle, imageFiles.length)

        // Persist the freshly-extracted metadata so future opens are instant.
        // Fire-and-forget: the write is queued and its errors are handled inside.
        void updateDatabaseMetadata(dirHandle, cache)

        // === RESTORE STATE from database ===
        const restoredFolders: SortFolder[] = []
        folderDirHandlesRef.current.clear()
        for (const folder of dbState.folders) {
          try {
            const folderHandle = await dirHandle.getDirectoryHandle(folder.name)
            restoredFolders.push({ ...folder, dirHandle: folderHandle })
            folderDirHandlesRef.current.set(folder.id, folderHandle)
          } catch {
            addStatus({
              type: "error",
              message: t("toast.folderNotFound", { name: folder.name }),
              icon: "folder"
            })
            console.warn(`[Hook] Folder ${folder.name} not found, skipping`)
          }
        }

        setFolders(restoredFolders)

        // Drop mappings that point at folders that no longer exist.
        const validFolderIds = new Set(restoredFolders.map(f => f.id))
        const restoredSorted: SortedMapping = {}
        for (const [photoKey, folderId] of Object.entries(dbState.sortedPhotos)) {
          if (validFolderIds.has(folderId)) restoredSorted[photoKey] = folderId
        }
        setSortedPhotos(restoredSorted)
        setMoveModeState(dbState.moveMode)
        setCurrentIndex(Math.min(dbState.currentIndex, Math.max(imageFiles.length - 1, 0)))
        setOperations(dbState.operations ?? [])

        setIsLoading(false)

        if (imageFiles.length === 0) {
          // Nothing to sort: say why instead of announcing success and silently
          // returning to the start screen.
          setError(t("toast.noSupportedPhotos", { name: dirHandle.name }))
        } else {
          addStatus({
            type: "success",
            message: t("toast.projectLoaded"),
            icon: "file"
          })
          if (unreadable > 0) {
            addStatus({ type: "error", message: t("toast.filesUnreadable", { count: unreadable }), icon: "file" })
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message)
          addStatus({
            type: "error",
            message: t("toast.projectLoadFailed"),
            icon: "file"
          })
        }
        setIsLoading(false)
      } finally {
        clearStatus()
      }
    },
    [revokeAllUrls]
  )

  const loadDirectory = useCallback(
    () =>
      openProject(async () => {
        if (!("showDirectoryPicker" in window)) throw new Error(t("toast.browserUnsupported"))
        return window.showDirectoryPicker()
      }),
    [openProject]
  )

  const openRecentProject = useCallback(
    (id: string) =>
      openProject(async () => {
        const recent = await getRecentProject(id)
        if (!recent) throw new Error(t("toast.recentMissing"))
        // Stored handles lose access between sessions; this runs inside the click that
        // opened the project, so the browser may show its permission prompt.
        const options = { mode: "readwrite" } as const
        if ((await recent.handle.queryPermission(options)) !== "granted") {
          if ((await recent.handle.requestPermission(options)) !== "granted") {
            throw new Error(t("toast.recentPermissionDenied"))
          }
        }
        return recent.handle
      }),
    [openProject]
  )

  // === CLOSE PROJECT: drop the session; progress is already in the project DB ===
  const closeProject = useCallback(() => {
    persistMetadata.flush()
    const handle = rootDirHandleRef.current
    if (handle) void saveRecentProject(handle, photos.length)

    revokeAllUrls()
    rawDecodeQueueRef.current.clear()
    failedRawDecodesRef.current.clear()
    setRawFailedKeys(new Set())
    metaQueueRef.current.clear()
    rawDimsDoneRef.current.clear()
    metadataCacheRef.current = {}
    folderDirHandlesRef.current.clear()
    rootDirHandleRef.current = null
    selectionAnchorRef.current = null

    setPhotos([])
    setCurrentIndex(0)
    setFolders([])
    setSortedPhotos({})
    setMoveModeState("copy")
    setOperations([])
    setUndoStack([])
    setSelectedKeys(new Set())
    setMetadataByKey(new Map())
    setIsDecodingRaw(false)
    setError(null)
    setProjectName(null)
  }, [persistMetadata, revokeAllUrls, photos.length])

  // === LAZY METADATA: extract for current photo (+ neighbors) on demand ===
  useEffect(() => {
    if (photos.length === 0) return
    const targets = [currentIndex, currentIndex + 1, currentIndex - 1].filter(i => i >= 0 && i < photos.length)
    let cancelled = false

    ;(async () => {
      for (const i of targets) {
        const p = photos[i]
        if (!p) continue
        if (metaQueueRef.current.has(p.key)) continue

        // RAW files need a second, deeper pass: the fast bulk scan only captured
        // the embedded thumbnail's size (e.g. 160×120), so re-extract with libraw
        // for the real sensor dimensions. Everything else is done once cached.
        const existing = metadataByKey.get(p.key)
        const rawNeedsDeepDims =
          p.format.category === "raw" &&
          (!existing || existing.megapixels === 0) &&
          !rawDimsDoneRef.current.has(p.key)
        if (existing && !rawNeedsDeepDims) continue

        metaQueueRef.current.add(p.key)
        if (p.format.category === "raw") rawDimsDoneRef.current.add(p.key)
        try {
          const meta = await extractMetadata(p.file, p.format.category === "raw")
          if (cancelled) return
          metadataCacheRef.current[p.key] = meta
          setMetadataByKey(prev => new Map(prev).set(p.key, meta))
          const rootHandle = rootDirHandleRef.current
          if (rootHandle) persistMetadata(rootHandle, metadataCacheRef.current)
        } catch (err) {
          console.warn("[Hook] metadata extract failed:", err)
        } finally {
          metaQueueRef.current.delete(p.key)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentIndex, photos, metadataByKey, persistMetadata])

  // === RAW DECODE: decode current RAW photo on demand ===
  useEffect(() => {
    const currentPhoto = photos[currentIndex]
    if (!currentPhoto || currentPhoto.format.category !== "raw") return
    if (rawPreviewKeysRef.current.has(currentPhoto.key)) return
    if (rawDecodeQueueRef.current.has(currentPhoto.key)) return
    // Don't retry a decode that already failed for this file.
    if (failedRawDecodesRef.current.has(currentPhoto.key)) return

    const decodeCurrentRaw = async () => {
      rawDecodeQueueRef.current.add(currentPhoto.key)
      setIsDecodingRaw(true)

      try {
        const url = await decodeRawImage(currentPhoto.file)
        if (url) {
          rawPreviewKeysRef.current.add(currentPhoto.key)
          setRawPreviewUrls(prev => new Map(prev).set(currentPhoto.key, url))
          failedRawDecodesRef.current.delete(currentPhoto.key)
        } else {
          failedRawDecodesRef.current.add(currentPhoto.key)
          setRawFailedKeys(new Set(failedRawDecodesRef.current))
        }
      } catch (err) {
        console.error("[Hook] RAW decode failed:", err)
        failedRawDecodesRef.current.add(currentPhoto.key)
        setRawFailedKeys(new Set(failedRawDecodesRef.current))
      } finally {
        rawDecodeQueueRef.current.delete(currentPhoto.key)
        setIsDecodingRaw(false)
      }
    }

    decodeCurrentRaw()
  }, [currentIndex, photos, rawRetryTick])

  // === RAW THUMBNAILS: decode small embedded previews for ALL RAW photos in the
  // background (concurrency-capped) so the filmstrip/grid show them. Worker-free
  // and memory-light; each key is attempted at most once per session.
  useEffect(() => {
    const pending = photos.filter(p => p.format.category === "raw" && !rawThumbKeysRef.current.has(p.key))
    if (pending.length === 0) return

    let cancelled = false
    let cursor = 0
    const worker = async () => {
      while (!cancelled && cursor < pending.length) {
        const p = pending[cursor++]
        if (rawThumbKeysRef.current.has(p.key) || rawThumbQueueRef.current.has(p.key)) continue
        rawThumbQueueRef.current.add(p.key)
        try {
          const url = await decodeRawThumbnail(p.file)
          if (cancelled) {
            if (url) URL.revokeObjectURL(url)
          } else {
            rawThumbKeysRef.current.add(p.key) // done (even if no preview) — don't retry
            if (url) setRawThumbUrls(prev => new Map(prev).set(p.key, url))
          }
        } catch {
          rawThumbKeysRef.current.add(p.key)
        } finally {
          rawThumbQueueRef.current.delete(p.key)
        }
      }
    }
    void Promise.all(Array.from({ length: Math.min(3, pending.length) }, () => worker()))

    return () => {
      cancelled = true
    }
  }, [photos])

  // === FOLDER MANAGEMENT ===
  const addFolder = useCallback(
    async (name: string) => {
      const rootHandle = rootDirHandleRef.current
      if (!rootHandle) {
        setError(t("toast.pickFolderFirst"))
        return false
      }

      const rawName = name.trim() || `Folder ${folders.length + 1}`

      const validation = validateFolderName(rawName)
      if (!validation.ok) {
        setError(validation.reason)
        addStatus({ type: "error", message: validation.reason, icon: "folder" })
        return false
      }
      const folderName = validation.name

      if (folders.some(f => f.name.toLowerCase() === folderName.toLowerCase())) {
        const msg = t("toast.folderExists", { name: folderName })
        setError(msg)
        addStatus({ type: "error", message: msg, icon: "folder" })
        return false
      }

      addStatus({ type: "loading", message: t("toast.creatingFolder"), icon: "folder" })

      try {
        const dirHandle = await rootHandle.getDirectoryHandle(folderName, {
          create: true
        })

        const newFolder: SortFolder = {
          id: crypto.randomUUID(),
          name: folderName,
          shortcut: folders.length < 9 ? (folders.length + 1).toString() : null,
          color: FOLDER_COLORS[folders.length % FOLDER_COLORS.length],
          createdAt: Date.now(),
          dirHandle
        }

        folderDirHandlesRef.current.set(newFolder.id, dirHandle)
        const updatedFolders = [...folders, newFolder]
        setFolders(updatedFolders)
        setError(null)

        await updateDatabaseFolders(rootHandle, updatedFolders)

        addStatus({
          type: "success",
          message: t("toast.folderCreated", { name: folderName }),
          icon: "folder"
        })
        return true
      } catch (err) {
        addStatus({ type: "error", message: t("toast.folderCreateFailed"), icon: "folder" })
        setError(
          t("toast.folderCreateError", { error: err instanceof Error ? err.message : t("common.unknownError") })
        )
        return false
      } finally {
        clearStatus()
      }
    },
    [folders]
  )

  const removeFolder = useCallback(
    async (folderId: string) => {
      const rootHandle = rootDirHandleRef.current
      const folder = folders.find(f => f.id === folderId)
      if (!folder || !rootHandle) return

      addStatus({ type: "loading", message: t("toast.deletingFolder"), icon: "folder" })

      try {
        // recursive: true so a folder that already contains sorted files is
        // actually removed (instead of silently failing and leaving an orphan).
        try {
          await rootHandle.removeEntry(folder.name, { recursive: true })
        } catch (err) {
          // Already gone is fine; anything else must not be reported as a deletion.
          if (!(err instanceof DOMException && err.name === "NotFoundError")) throw err
        }

        folderDirHandlesRef.current.delete(folderId)

        const updatedFolders = folders.filter(f => f.id !== folderId)
        setFolders(updatedFolders)

        // Drop mappings + undo entries pointing at the removed folder.
        setSortedPhotos(prev => {
          const updated: SortedMapping = {}
          for (const [k, v] of Object.entries(prev)) {
            if (v !== folderId) updated[k] = v
          }
          return updated
        })
        setUndoStack(prev => prev.filter(e => !e.items.some(it => it.folderId === folderId)))

        await updateDatabaseFolders(rootHandle, updatedFolders)

        addStatus({
          type: "success",
          message: t("toast.folderDeleted", { name: folder.name }),
          icon: "folder"
        })
      } catch (err) {
        addStatus({ type: "error", message: t("toast.folderDeleteFailed"), icon: "folder" })
        setError(
          t("toast.folderDeleteError", { error: err instanceof Error ? err.message : t("common.unknownError") })
        )
      } finally {
        clearStatus()
      }
    },
    [folders]
  )

  // Assign a custom sort-shortcut to a folder (or clear it with null). The key is
  // validated against reserved app keys and other folders before it is applied.
  const setFolderShortcut = useCallback(
    async (folderId: string, rawKey: string | null) => {
      const rootHandle = rootDirHandleRef.current
      if (!rootHandle || !folders.some(f => f.id === folderId)) return

      let nextKey: string | null = null
      if (rawKey !== null) {
        const result = validateShortcut(rawKey, folders, folderId)
        if (!result.ok) {
          setError(result.reason)
          addStatus({ type: "error", message: result.reason, icon: "folder" })
          return
        }
        nextKey = result.key
      }

      const updatedFolders = folders.map(f => (f.id === folderId ? { ...f, shortcut: nextKey } : f))
      setFolders(updatedFolders)
      setError(null)

      try {
        await updateDatabaseFolders(rootHandle, updatedFolders)
        addStatus({
          type: "success",
          message: nextKey
            ? t("toast.shortcutChanged", { key: nextKey.toUpperCase() })
            : t("toast.shortcutCleared"),
          icon: "folder"
        })
      } catch {
        addStatus({ type: "error", message: t("toast.shortcutSaveFailed"), icon: "folder" })
      } finally {
        clearStatus()
      }
    },
    [folders]
  )

  // === FILE OPERATIONS ===
  // Shared core for single sort and batch sort: copy/move each photo into
  // `target`, then apply ONE batched state update + ONE undo entry.
  const assignManyToTarget = useCallback(
    async (
      requested: number[],
      target: { id: string; name: string; dirHandle: FileSystemDirectoryHandle },
      mode: MoveMode,
      opts: { advance: boolean }
    ) => {
      const rootHandle = rootDirHandleRef.current
      // A photo already being sorted is skipped: key auto-repeat or a double-click would otherwise
      // run the same copy/move twice (a duplicate log entry, and a spurious failure when moving).
      const indices = requested.filter(i => photos[i] && !sortingKeysRef.current.has(photos[i].key))
      if (!rootHandle || indices.length === 0) return
      for (const i of indices) sortingKeysRef.current.add(photos[i].key)
      setSortingKeys(new Set(sortingKeysRef.current))

      const isBatch = indices.length > 1
      addStatus({
        type: "loading",
        message: isBatch
          ? t("toast.processingBatch", { count: indices.length })
          : mode === "cut"
            ? t("toast.moving", { name: photos[indices[0]]?.name ?? "" })
            : t("toast.copying", { name: photos[indices[0]]?.name ?? "" }),
        icon: "file"
      })

      try {
        const assignedDelta: SortedMapping = {}
        const handleUpdates = new Map<string, FileSystemFileHandle>()
        const ops: SortOperation[] = []
        const undoItems: UndoItem[] = []

        for (const idx of indices) {
          const photo = photos[idx]
          if (!photo) continue
          try {
            const { createdName, handle } = await applyAssign(photo, target.dirHandle, mode, rootHandle)
            assignedDelta[photo.key] = target.id
            if (mode === "cut") handleUpdates.set(photo.key, handle)
            ops.push({
              photoName: photo.name,
              folderId: target.id,
              folderName: target.name,
              mode,
              success: true,
              timestamp: Date.now()
            })
            undoItems.push({ photoKey: photo.key, photoName: photo.name, createdName, folderId: target.id, mode })
          } catch (err) {
            ops.push({
              photoName: photo.name,
              folderId: target.id,
              folderName: target.name,
              mode,
              success: false,
              error: err instanceof Error ? err.message : "Unknown error",
              timestamp: Date.now()
            })
          }
        }

        const okCount = undoItems.length
        const failCount = ops.length - okCount

        if (handleUpdates.size > 0) {
          setPhotos(prev =>
            prev.map(p => (handleUpdates.has(p.key) ? { ...p, handle: handleUpdates.get(p.key)! } : p))
          )
        }
        // Functional update + a merge-based DB write so overlapping assigns
        // (rapid keying + navigation) never clobber each other's mappings.
        setSortedPhotos(prev => ({ ...prev, ...assignedDelta }))
        if (ops.length > 0) setOperations(prev => [...prev, ...ops])
        if (undoItems.length > 0) {
          setUndoStack(prev => [...prev.slice(-(MAX_UNDO - 1)), { items: undoItems, anchorIndex: indices[0] }])
        }

        let newIndex = currentIndex
        // Stay on a photo that failed so the user sees it and can retry, rather than skipping past it.
        if (opts.advance && failCount === 0) {
          newIndex = Math.min(indices[indices.length - 1] + 1, photos.length - 1)
          setCurrentIndex(newIndex)
        }
        setError(failCount > 0 ? t("toast.processFailed", { count: failCount }) : null)

        await updateDatabaseAfterOperation(rootHandle, {
          sortedPatch: assignedDelta,
          currentIndex: newIndex,
          operations: ops,
          totalPhotos: photos.length
        })

        haptic(okCount > 0 ? "success" : "error")
        addStatus({
          type: okCount > 0 ? "success" : "error",
          message: isBatch
            ? t("toast.batchProcessed", { ok: okCount }) +
              (failCount ? t("toast.batchFailedSuffix", { fail: failCount }) : "")
            : okCount > 0
              ? t("toast.singleDone", { name: photos[indices[0]]?.name ?? "" })
              : t("toast.singleFail"),
          icon: "file"
        })
      } catch (err) {
        console.warn("[Hook] assign failed:", err)
        addStatus({ type: "error", message: t("toast.singleFail"), icon: "file" })
      } finally {
        for (const i of indices) sortingKeysRef.current.delete(photos[i].key)
        setSortingKeys(new Set(sortingKeysRef.current))
        clearStatus()
      }
    },
    [photos, currentIndex]
  )

  const assignPhotoToFolder = useCallback(
    async (photoIndex: number, folderId: string) => {
      const folder = folders.find(f => f.id === folderId)
      const dirHandle = folder?.dirHandle || folderDirHandlesRef.current.get(folderId)
      if (!folder || !dirHandle) {
        setError(t("toast.targetFolderNotFound"))
        return
      }
      await assignManyToTarget([photoIndex], { id: folder.id, name: folder.name, dirHandle }, moveMode, {
        advance: true
      })
    },
    [folders, moveMode, assignManyToTarget]
  )

  const selectedIndices = useCallback(
    () => photos.map((p, i) => (selectedKeys.has(p.key) ? i : -1)).filter(i => i >= 0),
    [photos, selectedKeys]
  )

  const batchAssignToFolder = useCallback(
    async (folderId: string) => {
      const folder = folders.find(f => f.id === folderId)
      const dirHandle = folder?.dirHandle || folderDirHandlesRef.current.get(folderId)
      if (!folder || !dirHandle) {
        setError(t("toast.targetFolderNotFound"))
        return
      }
      const indices = selectedIndices()
      if (indices.length === 0) return
      await assignManyToTarget(indices, { id: folder.id, name: folder.name, dirHandle }, moveMode, {
        advance: false
      })
      setSelectedKeys(new Set())
      selectionAnchorRef.current = null
    },
    [folders, moveMode, selectedIndices, assignManyToTarget]
  )

  const undoLastOperation = useCallback(async () => {
    const entry = undoStack[undoStack.length - 1]
    const rootHandle = rootDirHandleRef.current
    // A second Ctrl+Z while one is in flight would undo the same entry twice.
    if (!entry || !rootHandle || undoingRef.current) return
    undoingRef.current = true

    addStatus({ type: "loading", message: t("toast.undoing"), icon: "file" })

    try {
      const removedKeys: string[] = []
      const handleUpdates = new Map<string, FileSystemFileHandle>()
      let failed = 0

      // Reverse order so collision-suffixed names unwind cleanly.
      for (const item of [...entry.items].reverse()) {
        const targetDir =
          folders.find(f => f.id === item.folderId)?.dirHandle || folderDirHandlesRef.current.get(item.folderId)
        if (!targetDir) {
          failed++
          continue
        }
        try {
          if (item.mode === "cut") {
            const movedHandle = await targetDir.getFileHandle(item.createdName)
            await moveFileHandle(movedHandle, rootHandle, item.photoName, targetDir, item.createdName)
            handleUpdates.set(item.photoKey, await rootHandle.getFileHandle(item.photoName))
          } else {
            // Copy: just delete the duplicate that was created.
            await targetDir.removeEntry(item.createdName)
          }
          removedKeys.push(item.photoKey)
        } catch (err) {
          console.warn("[Hook] undo item failed:", err)
          failed++
        }
      }

      if (handleUpdates.size > 0) {
        setPhotos(prev =>
          prev.map(p => (handleUpdates.has(p.key) ? { ...p, handle: handleUpdates.get(p.key)! } : p))
        )
      }
      const removedSet = new Set(removedKeys)
      setSortedPhotos(prev => {
        const next: SortedMapping = {}
        for (const [k, v] of Object.entries(prev)) if (!removedSet.has(k)) next[k] = v
        return next
      })
      setUndoStack(prev => prev.slice(0, -1))
      setCurrentIndex(Math.min(entry.anchorIndex, Math.max(photos.length - 1, 0)))
      setError(failed > 0 ? t("toast.undoPartialFail", { count: failed }) : null)

      await updateDatabaseAfterOperation(rootHandle, {
        removedKeys,
        currentIndex: entry.anchorIndex,
        totalPhotos: photos.length
      })

      addStatus({
        type: "success",
        message:
          entry.items.length > 1
            ? t("toast.undoBatch", { count: entry.items.length })
            : t("toast.undoSingle", { name: entry.items[0]?.photoName ?? "" }),
        icon: "file"
      })
    } catch (err) {
      console.warn("[Hook] undo failed:", err)
      addStatus({ type: "error", message: t("toast.undoFailed"), icon: "file" })
    } finally {
      undoingRef.current = false
      clearStatus()
    }
  }, [undoStack, folders, photos.length])

  const navigatePhoto = useCallback(
    (direction: NavigationDirection) => {
      if (direction === "next") {
        setCurrentIndex(prev => Math.min(prev + 1, photos.length - 1))
      } else if (direction === "prev") {
        setCurrentIndex(prev => Math.max(prev - 1, 0))
      }
    },
    [photos.length]
  )

  const goToIndex = useCallback(
    (index: number) => setCurrentIndex(Math.max(0, Math.min(index, photos.length - 1))),
    [photos.length]
  )

  const jumpToNextUnsorted = useCallback(() => {
    const n = photos.length
    if (n === 0) return
    for (let offset = 1; offset <= n; offset++) {
      const i = (currentIndex + offset) % n
      const p = photos[i]
      if (p && !sortedPhotos[p.key]) {
        setCurrentIndex(i)
        return
      }
    }
  }, [photos, currentIndex, sortedPhotos])

  // === MULTI-SELECT ===
  const toggleSelect = useCallback(
    (photoIndex: number) => {
      const photo = photos[photoIndex]
      if (!photo) return
      selectionAnchorRef.current = photoIndex
      setSelectedKeys(prev => {
        const next = new Set(prev)
        if (next.has(photo.key)) next.delete(photo.key)
        else next.add(photo.key)
        return next
      })
    },
    [photos]
  )

  const selectRangeTo = useCallback(
    (photoIndex: number) => {
      const anchor = selectionAnchorRef.current ?? photoIndex
      const lo = Math.min(anchor, photoIndex)
      const hi = Math.max(anchor, photoIndex)
      const target = photos[photoIndex]
      setSelectedKeys(prev => {
        // Toggle: if the clicked photo is already selected, deselect the whole
        // range; otherwise select it. Repeating shift-click flips it back.
        const shouldSelect = target ? !prev.has(target.key) : true
        const next = new Set(prev)
        for (let i = lo; i <= hi; i++) {
          const p = photos[i]
          if (!p) continue
          if (shouldSelect) next.add(p.key)
          else next.delete(p.key)
        }
        return next
      })
      selectionAnchorRef.current = photoIndex
    },
    [photos]
  )

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set())
    selectionAnchorRef.current = null
  }, [])

  const selectAllUnsorted = useCallback(() => {
    const next = new Set<string>()
    for (const p of photos) if (!sortedPhotos[p.key]) next.add(p.key)
    setSelectedKeys(next)
  }, [photos, sortedPhotos])

  // Toggle: select every photo, or clear if they are all already selected.
  const toggleSelectAll = useCallback(() => {
    setSelectedKeys(prev => (prev.size >= photos.length ? new Set() : new Set(photos.map(p => p.key))))
    selectionAnchorRef.current = null
  }, [photos])

  // Recreate a photo's object URL after an <img> load error. A fresh URL forces
  // the browser to re-fetch/re-decode (some large images fail the first decode).
  const recreatePreviewUrl = useCallback((photoKey: string) => {
    setPhotos(prev =>
      prev.map(p => {
        if (p.key !== photoKey || !p.url) return p
        URL.revokeObjectURL(p.url)
        return { ...p, url: URL.createObjectURL(p.file) }
      })
    )
  }, [])

  const retryRawDecode = useCallback((photoKey: string) => {
    failedRawDecodesRef.current.delete(photoKey)
    setRawFailedKeys(new Set(failedRawDecodesRef.current))
    setRawRetryTick(n => n + 1)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const setMoveMode = useCallback(async (mode: MoveMode) => {
    setMoveModeState(mode)
    const rootHandle = rootDirHandleRef.current
    if (rootHandle) {
      await updateDatabaseMode(rootHandle, mode)
    }
  }, [])

  const getCurrentPhoto = useCallback((): PhotoFile | null => {
    return photos[currentIndex] ?? null
  }, [photos, currentIndex])

  const getFolderMeta = useCallback(
    (folderId: string | undefined) => {
      if (!folderId) return null
      const f = folders.find(x => x.id === folderId)
      return f ? { name: f.name, color: f.color } : null
    },
    [folders]
  )

  const getCurrentFolder = useCallback(() => {
    const photo = photos[currentIndex]
    if (!photo) return null
    return getFolderMeta(sortedPhotos[photo.key])
  }, [photos, sortedPhotos, currentIndex, getFolderMeta])

  const getOperationStats = useCallback(() => {
    const success = operations.filter(o => o.success).length
    return {
      success,
      failed: operations.length - success,
      total: operations.length
    }
  }, [operations])

  return {
    photos,
    currentIndex,
    folders,
    sortedPhotos,
    isLoading,
    error,
    clearError,
    sortingKeys,
    moveMode,
    operations,
    rawPreviewUrls,
    rawThumbUrls,
    isDecodingRaw,
    rawFailedKeys,
    metadataByKey,
    canUndo: undoStack.length > 0,
    selectedKeys,
    projectName,
    loadDirectory,
    openRecentProject,
    closeProject,
    addFolder,
    removeFolder,
    setFolderShortcut,
    assignPhotoToFolder,
    undoLastOperation,
    navigatePhoto,
    goToIndex,
    jumpToNextUnsorted,
    recreatePreviewUrl,
    retryRawDecode,
    setMoveMode,
    toggleSelect,
    selectRangeTo,
    clearSelection,
    selectAllUnsorted,
    toggleSelectAll,
    batchAssignToFolder,
    getCurrentPhoto,
    getCurrentFolder,
    getFolderMeta,
    getOperationStats
  }
}
