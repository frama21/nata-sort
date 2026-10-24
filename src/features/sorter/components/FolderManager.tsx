import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Trash2, FolderOpen, Scissors, Copy, Undo2, SkipForward, FolderPlus } from "lucide-react"

import { Card, CardContent } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Button } from "@/shared/components/ui/button"
import { Kbd } from "@/shared/components/ui/kbd"
import { WithTooltip } from "@/shared/components/ui/tooltip"
import { PanelHeader } from "@/shared/components/ui/panel-header"
import { addStatus } from "@/shared/stores/status.store"

import type { SortFolder, MoveMode } from "../types/sorter.types"

interface FolderManagerProps {
  folders: SortFolder[]
  moveMode: MoveMode
  onAdd: (name: string) => Promise<void>
  onRemove: (folderId: string) => Promise<void>
  onSetShortcut: (folderId: string, rawKey: string | null) => Promise<void>
  onAssign: (photoIndex: number, folderId: string) => Promise<void>
  onMoveModeChange: (mode: MoveMode) => void
  currentIndex: number
  canUndo: boolean
  onUndo: () => void
  onJumpUnsorted: () => void
}

// Lone modifier presses are ignored while recording a shortcut.
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"])

export const FolderManager = ({
  folders,
  moveMode,
  onAdd,
  onRemove,
  onSetShortcut,
  onAssign,
  onMoveModeChange,
  currentIndex,
  canUndo,
  onUndo,
  onJumpUnsorted
}: FolderManagerProps) => {
  const { t } = useTranslation()
  const [newFolderName, setNewFolderName] = useState("")
  // Folder id currently "listening" for its next keypress, or null.
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const totalFolder = folders.length

  // While recording, capture the next keypress (in the capture phase, so the
  // app's global sort/navigate handlers never see it), validate + apply it, and
  // stop recording. Escape cancels.
  useEffect(() => {
    if (!recordingId) return
    const onKey = (e: KeyboardEvent) => {
      // Wait for a real key, not a lone modifier press.
      if (MODIFIER_KEYS.has(e.key)) return
      e.preventDefault()
      e.stopPropagation()
      if (e.key === "Escape") {
        setRecordingId(null)
        return
      }
      // Reject combination keys (Ctrl/Alt/⌘ + key, e.g. Ctrl+P) — Shift is fine
      // since it just produces a different character.
      if (e.ctrlKey || e.altKey || e.metaKey) {
        addStatus({ type: "error", message: t("shortcut.noCombo"), icon: "folder" })
        setRecordingId(null)
        return
      }
      void onSetShortcut(recordingId, e.key)
      setRecordingId(null)
    }
    window.addEventListener("keydown", onKey, { capture: true })
    return () => window.removeEventListener("keydown", onKey, { capture: true })
  }, [recordingId, onSetShortcut, t])

  const handleAdd = async () => {
    const name = newFolderName.trim()
    if (name) {
      await onAdd(name)
      setNewFolderName("")
    }
  }

  return (
    <Card size="sm" className="w-full">
      <PanelHeader
        icon={<FolderOpen />}
        title={t("folder.title")}
        trailing={
          <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {totalFolder}
          </span>
        }
      />
      <CardContent className="space-y-4">
        {/* Move mode */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("folder.moveMode")}</p>
          <Tabs
            value={moveMode}
            onValueChange={v => onMoveModeChange(v === "cut" ? "cut" : "copy")}
            className="w-full gap-2"
          >
            <TabsList className="h-auto w-full">
              <TabsTrigger value="copy" className="min-w-0 py-1.5 leading-4 whitespace-normal">
                <Copy className="w-3.5 h-3.5" />
                {t("folder.copy")}
              </TabsTrigger>
              <TabsTrigger value="cut" className="min-w-0 py-1.5 leading-4 whitespace-normal">
                <Scissors className="w-3.5 h-3.5" />
                {t("folder.cut")}
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="copy"
              className="rounded-md bg-surface-hover px-3 py-2 text-xs text-muted-foreground"
            >
              {t("folder.copyHintPre")}
              <strong className="font-semibold text-foreground">{t("folder.copyHintStrong")}</strong>
              {t("folder.copyHintPost")}
            </TabsContent>
            <TabsContent
              value="cut"
              className="rounded-md bg-surface-hover px-3 py-2 text-xs text-muted-foreground"
            >
              {t("folder.cutHintPre")}
              <strong className="font-semibold text-foreground">{t("folder.cutHintStrong")}</strong>
              {t("folder.cutHintPost")}
            </TabsContent>
          </Tabs>
        </div>

        {/* Add folder */}
        <div className="space-y-2">
          <label htmlFor="new-folder-name" className="text-xs font-medium text-muted-foreground">
            {t("folder.add")}
          </label>
          <div className="flex gap-2">
            <Input
              id="new-folder-name"
              placeholder={t("folder.namePlaceholder")}
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAdd()
                }
              }}
            />
            <WithTooltip label={t("folder.addAria")}>
              <Button
                variant="secondary"
                size="icon"
                aria-label={t("folder.addAria")}
                disabled={!newFolderName.trim()}
                onClick={handleAdd}
              >
                <Plus />
              </Button>
            </WithTooltip>
          </div>
        </div>

        {/* Folder list */}
        {folders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border-strong py-6 text-center text-muted-foreground">
            <FolderPlus className="size-6 opacity-70" />
            <p className="text-xs">{t("folder.empty")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2" aria-label={t("folder.listAria")}>
            {folders.map(folder => (
              <li
                key={folder.id}
                className="group flex items-center gap-2 rounded-md border border-border px-2 py-1.5 transition-colors duration-(--dur-fast) hover:bg-surface-hover"
              >
                <WithTooltip label={t("folder.editShortcutTitle")}>
                  <button
                    type="button"
                    onClick={() => setRecordingId(id => (id === folder.id ? null : folder.id))}
                    aria-label={t("folder.editShortcutAria", { name: folder.name })}
                    className={`grid size-8 shrink-0 place-items-center rounded-md text-sm font-semibold text-white transition-[filter] duration-(--dur-fast) pointer-coarse:size-11 ${folder.color} ${
                      recordingId === folder.id ? "ring-2 ring-accent" : "hover:brightness-110"
                    }`}
                  >
                    {recordingId === folder.id ? "?" : folder.shortcut ? folder.shortcut.toUpperCase() : "•"}
                  </button>
                </WithTooltip>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{folder.name}</p>
                  <p className="truncate text-xs whitespace-nowrap text-muted-foreground">
                    {recordingId === folder.id ? (
                      <span className="font-medium text-foreground">{t("folder.recording")}</span>
                    ) : folder.shortcut ? (
                      <>
                        {t("folder.press")} <Kbd>{folder.shortcut.toUpperCase()}</Kbd>
                      </>
                    ) : (
                      t("folder.setShortcutHint")
                    )}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onAssign(currentIndex, folder.id)}>
                  {t("common.sort")}
                </Button>
                <WithTooltip label={t("folder.removeAria", { name: folder.name })}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("folder.removeAria", { name: folder.name })}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(folder.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </WithTooltip>
              </li>
            ))}
          </ul>
        )}

        {/* Quick actions */}
        <div className="flex flex-row gap-2 border-t border-border pt-3">
          <Button variant="outline" className="flex-1" disabled={!canUndo} onClick={onUndo}>
            <Undo2 className="w-3.5 h-3.5" />
            {t("common.undo")}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onJumpUnsorted}>
            <SkipForward className="w-3.5 h-3.5" />
            {t("folder.jumpUnsorted")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
