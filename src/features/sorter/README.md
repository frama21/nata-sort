# Feature: sorter

The sorting workspace. The user opens a local folder, previews each photo or
video, and copies or moves it into sort folders with keyboard shortcuts. The
project state is saved to `photo-sorter-db.json` inside that folder.

| | |
| --- | --- |
| **Routes** | `/` (nav label "Sortir") |
| **Public API** | none (no `index.ts`); reached only through its route |
| **Depends on** | `@/features/media` (required), `shared/` UI primitives, `shared/stores/status.store` |
| **Depended on by** | nothing |

## Structure

- **`hooks/useFileSystem.ts`** is the controller and the only module that
  touches the services. It holds all session state.
- **`services/project-db.service.ts`** persists project state. Every write goes
  through a single-writer queue, and the file is sanitized on load because it
  is untrusted input.
- **`utils/file-ops.utils.ts`** has the copy/move helpers. They never overwrite:
  name collisions get `_1`, `_2`, and so on.
- **`utils/folder-name.utils.ts`** validates folder names.
- **`pages/SorterPage.tsx`** is the page. Directory handles exist only in
  memory, so it asks for confirmation before navigating away mid-session.

## Rules

- Route every DB write through `project-db.service` (`enqueue`).
- Never overwrite a user file; use `getUniqueFileName` / `applyAssign`.
- Global keyboard shortcuts must skip events that a focused widget already
  handled (`event.defaultPrevented`), events from inside an open `<dialog>`,
  and events from text fields.

## Tests

```bash
pnpm vitest run src/features/sorter          # unit + integration
pnpm playwright test src/features/sorter     # e2e (uses an OPFS folder instead of the native picker)
```

## Removing it

Delete `src/features/sorter/`. The `/` route disappears, so the root URL shows
the not-found page. `media` stays valid but becomes unused. Removal was
verified: typecheck, architecture check, the remaining tests, and the build
all pass.
