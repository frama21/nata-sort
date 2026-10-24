// File operations on File System Access handles. Pure: no component state.
import type { MoveMode, PhotoFile } from "../types/sorter.types"

const fileExists = async (dir: FileSystemDirectoryHandle, name: string): Promise<boolean> => {
  try {
    await dir.getFileHandle(name)
    return true
  } catch {
    return false
  }
}

// Avoid silently overwriting: append _1, _2, ... when a name already exists.
export const getUniqueFileName = async (dir: FileSystemDirectoryHandle, name: string): Promise<string> => {
  if (!(await fileExists(dir, name))) return name
  const dot = name.lastIndexOf(".")
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ""
  let i = 1
  let candidate = `${base}_${i}${ext}`
  while (await fileExists(dir, candidate)) {
    i += 1
    candidate = `${base}_${i}${ext}`
  }
  return candidate
}

export const writeFileTo = async (
  dir: FileSystemDirectoryHandle,
  name: string,
  file: File
): Promise<FileSystemFileHandle> => {
  const handle = await dir.getFileHandle(name, { create: true })
  const writable = await handle.createWritable()
  await writable.write(file)
  await writable.close()
  return handle
}

// Move a file handle, using the native move() when available and falling back
// to copy-then-delete otherwise.
export const moveFileHandle = async (
  handle: FileSystemFileHandle,
  destDir: FileSystemDirectoryHandle,
  destName: string,
  sourceDir: FileSystemDirectoryHandle,
  sourceName: string
): Promise<void> => {
  if ("move" in handle) {
    // @ts-expect-error - move() is not yet in the FileSystem lib typings
    await handle.move(destDir, destName)
  } else {
    const file = await handle.getFile()
    await writeFileTo(destDir, destName, file)
    await sourceDir.removeEntry(sourceName)
  }
}

// Copy or move a photo into a target directory, never overwriting. Returns the
// created name plus the file's handle at its final location (unchanged for copy).
export const applyAssign = async (
  photo: PhotoFile,
  targetDir: FileSystemDirectoryHandle,
  mode: MoveMode,
  rootDir: FileSystemDirectoryHandle
): Promise<{ createdName: string; handle: FileSystemFileHandle }> => {
  const createdName = await getUniqueFileName(targetDir, photo.name)
  if (mode === "cut") {
    await moveFileHandle(photo.handle, targetDir, createdName, rootDir, photo.name)
    return { createdName, handle: await targetDir.getFileHandle(createdName) }
  }
  await writeFileTo(targetDir, createdName, photo.file)
  return { createdName, handle: photo.handle }
}
