// In-memory stand-ins for File System Access API handles, so services that
// read and write the user's folder can be tested without a real browser.
// Only the members the app uses are implemented.

const notFound = (name: string) => new DOMException(`${name} not found`, "NotFoundError")

export class MemoryFileHandle {
  readonly kind = "file"
  readonly name: string
  private content: Blob

  constructor(name: string, content: Blob = new Blob([])) {
    this.name = name
    this.content = content
  }

  async getFile(): Promise<File> {
    return new File([this.content], this.name)
  }

  async createWritable() {
    const parts: BlobPart[] = []
    return {
      write: async (data: BlobPart) => {
        parts.push(data)
      },
      close: async () => {
        this.content = new Blob(parts)
      }
    }
  }

  /** Test helper: current content as text. */
  async text(): Promise<string> {
    return this.content.text()
  }
}

export class MemoryDirectoryHandle {
  readonly kind = "directory"
  readonly files = new Map<string, MemoryFileHandle>()
  readonly dirs = new Map<string, MemoryDirectoryHandle>()

  readonly name: string

  constructor(name = "root") {
    this.name = name
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<MemoryFileHandle> {
    const existing = this.files.get(name)
    if (existing) return existing
    if (!options?.create) throw notFound(name)
    const created = new MemoryFileHandle(name)
    this.files.set(name, created)
    return created
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<MemoryDirectoryHandle> {
    const existing = this.dirs.get(name)
    if (existing) return existing
    if (!options?.create) throw notFound(name)
    const created = new MemoryDirectoryHandle(name)
    this.dirs.set(name, created)
    return created
  }

  async removeEntry(name: string): Promise<void> {
    if (!this.files.delete(name) && !this.dirs.delete(name)) throw notFound(name)
  }

  /** Test helper: seed a file with text content. */
  addFile(name: string, content: string): MemoryFileHandle {
    const handle = new MemoryFileHandle(name, new Blob([content]))
    this.files.set(name, handle)
    return handle
  }

  /** Test helper: view this fake as the real handle type the app expects. */
  asHandle(): FileSystemDirectoryHandle {
    return this as unknown as FileSystemDirectoryHandle
  }
}
