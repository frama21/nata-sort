# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- **Close project.** While a project is open the top bar shows a **Close project** button (icon
  only on phones). It returns to the start screen; progress is already saved in the folder.
- **Recent projects on the start screen.** Folders you opened are listed with their name, photo
  count and last update (relative time); click one to reopen it (the browser may ask for access
  again). A ⋮ menu offers **Remove from recent**, which only forgets the list entry and never
  touches the folder. Lists longer than 5 scroll and are virtualized. The list lives in this
  browser's IndexedDB (`nata-recent-projects`, max 30 entries, handles never leave the device).
- **App version** under the recent list, read from `package.json`.
- A small `DropdownMenu` primitive (native popover) and shared placement helper
  (`shared/lib/floating.ts`), also used by the tooltip.
- **Changelog tab in the Settings dialog.** A tab, **Changelog**, shows this file as a vertical
  timeline (version, date, Added/Changed/Fixed/Security groups, rendered `code` and **bold**). The
  list is virtualized with `@tanstack/react-virtual`, and the tab loads lazily on first open, so
  the CHANGELOG text and the library stay out of the initial bundle.

### Fixed

- **Toast alignment on touch screens.** The icon and message sat at the top while the close button
  (44 px on touch) was centered, leaving them about 8 px off. The row is now vertically centered.
- **Top bar wordmark on phones.** The "nata" wordmark next to the mark is no longer hidden below
  640 px while a project is open.
- **Changelog tab on phones.** The panel was as tall as the whole changelog (~9,500 px, every row
  mounted) because its wrapper grew with `flex-1` in a column layout. It is now a fixed-height
  panel that scrolls inside, and the virtual list mounts only the visible rows again.
- **Tooltips are never clipped or covered.** `WithTooltip` is now a native `popover` (top layer),
  so panels with `overflow` no longer cut it off and it shows above modal dialogs. It opens above
  the control by default, flips below when there is no room, and is clamped to the viewport;
  Escape dismisses it and touch taps no longer leave it stuck open.
- **Sort Folders panel breathing room.** Wider folder column (288 px), default card padding,
  larger gaps between sections and roomier folder rows, so the mode tabs, shortcut hint and
  action buttons no longer feel cramped or truncated.

### Changed

- **One Settings dialog.** The top bar now has a single help icon ("Help & settings") that opens
  **Settings** on the **Shortcuts** tab. Tabs: Shortcuts, Appearance (theme Light/Dark and
  language English/Bahasa Indonesia, moved out of the top bar), About (app, version, open project,
  privacy and safety notes) and Changelog. Layout: a vertical list beside the content on desktop,
  a scrollable tab row under a centered title on phones. Arrow keys (either axis) move between
  tabs. The dialog lives in `src/app/layouts/settings/`; the sorter feature only exports
  `ShortcutsList`.
- **State file renamed to `nata-sort-db.json`** (was `nata-photo-db.json`); see the note below
  on the fallback for existing projects.
- **Folders sheet is full width on phones** (a 360 px drawer from 640 px up, was 280 px), so folder
  names and shortcut hints are no longer truncated. Both sheets get more top padding so the close
  button no longer sits against the content.
- **Sort Folders empty state** is plain muted text instead of a dashed box with a folder icon,
  which looked like an upload drop zone.
- **Start screen** is quieter: the top bar drops to just the help button, with no logo,
  background or border (it returns once a project is open); the headline text is replaced by the
  NATA mark over the wordmark; and the copy now says what the app does ("Sort photos and videos
  into folders with a single keypress…") and where it runs ("Works in Chrome, Edge and Opera. Your
  files never leave this device."). The page keeps a screen-reader-only "NATA" `h1` in the top bar.
- **Move-mode tabs say just "Copy" and "Cut".** The "(Duplicate)" / "(Move)" suffixes are gone
  because the hint card under the tabs already explains each mode.
- **Help moved into the `?` dialog.** The `/help` page and its nav link are gone; the top-bar
  button is now called "Help" and opens a dialog with two tabs, **Shortcuts** and **About**
  (privacy, browser requirements, saving progress, file safety). The main navigation hides itself
  while only one view exists. The "leave this page?" e2e test was removed because no second
  route is reachable from the UI any more; the blocker itself is unchanged.
- **Redesign: "Calm Light" theme.** Pure-neutral surfaces, hairline borders, flat panels (no
  gradients, glass or blur), Inter Variable (self-hosted via `@fontsource-variable/inter`),
  a two-tone focus ring, calm 100–240 ms motion with `prefers-reduced-motion`, and dark as
  the default theme. NATA keeps its own **teal** accent (not RONA's ember) and a new mark.
  Tokens live in `src/app/styles/tokens.css`.
- **App shell**: 48 px top bar, skip link, focus moves to `main` on a route change; the
  sorter is a 3-panel workspace (folders · canvas · details) with a status bar on desktop,
  and sheets + a 72 px action bar below 1024 px.
- **Toasts** replace the navbar status badge: bottom-right (top on phones), two live regions,
  paused on hover/focus, errors stay until dismissed, duplicates shown once.
- Leaving a session mid-sort now asks in an in-app dialog instead of `window.confirm`.
- Button gets a `loading` state; Dialog gets `side` (`center | left | bottom`). Hardcoded
  "Tutup", "Loading", thumbnail labels and the grid loader moved to i18n; Indonesian copy uses
  "kamu".
- **New logo**: a tile with one corner open and a teal piece dropping into it, plus a custom
  lowercase "nata" wordmark drawn as outlines (`NataMark`, `NataWordmark`). The navbar shows the
  wordmark instead of Inter text (the heading stays "NATA" for screen readers). New app icons
  (ink tile + mark) incl. a maskable icon and an SVG favicon; `theme-color` / manifest colours are
  `#1C1C1C`. The brand kit and usage rules live in `docs/brand/`.
- `pnpm check:contrast` recomputes the WCAG pairs from the tokens and fails on colour literals
  in components.
- Removed `tw-animate-css`.

- **Renamed to `nata-sort`; the brand is now NATA.** The package, server package,
  Docker image/container, and log tags use `nata-sort`; the UI, page titles, and
  the PWA manifest say "NATA". The theme preference key is now `nata-sort-theme`,
  so the theme resets to the default once.
- **State file is now `nata-sort-db.json`** (was `nata-photo-db.json`), matching the app name.
  Existing `nata-photo-db.json` and `photo-sorter-db.json` projects are read as a fallback and
  re-saved under the new name, so no sort progress is lost.
- **Feature-based project structure** replaces Feature-Sliced Design: `src/{app,features,shared}`
  with automatic route discovery (`features/<name>/routes.ts`), per-feature tests, and
  enforced import boundaries (ESLint + `pnpm check:architecture`).
- **In-house UI primitives** replace Radix/shadcn (native `<dialog>`, ARIA tabs, CSS-only
  `WithTooltip`), removing the `radix-ui` dependency.
- Help, route fallbacks, navigation labels, and the leave-page confirmation are localized
  (EN/ID). Route `title` and `nav.label` are i18n keys.
- React Router 8, ESLint + JSDoc rules, Prettier, Vitest + Playwright test suites.

### Fixed

- **Mobile layout.** The page no longer overflows sideways on phones (closed tooltips
  stay out of layout, the status badge floats under the navbar on small screens) and
  the content now has side padding.

### Notes

- The Google Fonts `<link>` from 2.3.0 is not carried over: the CSP (`font-src 'self'`)
  blocks it. The system font fallbacks apply until the fonts are self-hosted.

## [2.3.0] - 2026-07-19

> Rebranded from **Photo Sorter** to **Nata Photo**. The on-disk state file is now
> `nata-photo-db.json`; existing `photo-sorter-db.json` projects are read as a
> fallback and re-saved under the new name, so no sort progress is lost.

### Added

- **Internationalization (English + Indonesian).** The whole UI is now bilingual
  via **i18next / react-i18next**, with a navbar language toggle. English is the
  default; the choice persists to `localStorage` (`lumen-storage`) and `<html lang>`
  follows it. Strings live one-file-per-language in
  `src/shared/i18n/language/{en,id}.json`; a module-level `t()` also localizes
  non-React code (services, the class error boundary).
- **Customizable folder sort-shortcuts.** Click a folder's badge and press a key
  to set its shortcut. Any key is accepted except reserved app actions (arrows,
  `Space`, `U`, `Esc`), modifier combinations (e.g. `Ctrl+P`), and keys already
  used by another folder — validated in `shared/lib/shortcut.ts`. Folders beyond
  the first nine can now be bound too.
- **Tooltips on every icon-only control** via a new shadcn `Tooltip` component
  and `WithTooltip` wrapper (`shared/ui/tooltip.tsx`), each localized.
- **`pages/` presentation layer** — the app shell now routes between a `welcome`
  and an `editor` page instead of one monolithic `App.tsx`.

### Changed

- **Project restructured to Feature-Sliced Design** — `src/{app,pages,features,shared}`
  with a one-way dependency rule and a public-API `index.ts` barrel per slice, for
  readability, scalability, and easy handover. See
  [docs/ARCHITECTURE.md §3](docs/ARCHITECTURE.md).
- **UI/UX design revamp** — a distinctive "darkroom" identity: warm amber accent
  over warm-tinted OKLCH neutrals, a three-family type system (Bricolage Grotesque
  / Inter / JetBrains Mono), an ambient background, high-impact motion and
  **skeleton-shimmer** loaders (all respecting `prefers-reduced-motion`), and a
  stat-tile treatment across the sidebar panels.
- Metadata extraction, RAW decoding, and the controller hook moved to
  `shared/services/*` and `features/file-system/model/*` (behavior unchanged).

### Fixed

- **RAW dimensions & megapixels now read correctly.** EXIF exposed only the
  embedded thumbnail's size for RAW files (e.g. a Nikon NEF reported 160×120); the
  true sensor dimensions are now read from the largest embedded JPEG preview
  (worker-free, so it never contends with an in-flight RAW decode). Verified: a
  Nikon D3100 NEF now reports 4608×3072 / 14.2 MP.

### Principles

- Adopted the **longevity principles** — Readable · Understandable · Reusable ·
  Scalable · Maintainable · Easy to Hand Over — realized through the FSD structure,
  documented in [docs/PRINCIPLES.md](docs/PRINCIPLES.md).

## [2.2.0] - 2026-07-15

### Added

- Grid view lazily renders thumbnails and appends more on scroll (with a
  loader), keeping folders of thousands of photos light.
- Grid keyboard shortcuts: `Ctrl/Cmd+A` toggles select-all, `Shift+Click`
  toggles a selection range, and `Esc` clears the selection.

### Changed

- The filmstrip and grid now scroll inside a shadcn `ScrollArea`.

## [2.1.0] - 2026-07-14

### Security

- Full security audit ([docs/SECURITY.md](docs/SECURITY.md)); dependency tree is
  now audit-clean (`pnpm audit` → no known vulnerabilities, prod and dev).
- Patched `exifreader` (`^4.38.1` → `^4.41.0`) — fixes two DoS advisories in the
  EXIF parser that runs on untrusted images.
- Moved the `shadcn` CLI to `devDependencies`, removing a large server-side
  dependency tree (hono/qs/js-yaml/babel/MCP SDK) from the production graph;
  pinned remaining dev-only transitive advisories via `pnpm.overrides`.
- Hardened the project-database load path against prototype pollution and
  unbounded memory (null-prototype maps, dangerous-key stripping, size caps).
- Stricter folder-name validation (control chars, `.`/`..`, reserved device
  names, trailing dot/space, length cap).
- Added `/.well-known/security.txt` (RFC 9116).
- Added a hardened [`firebase.json`](firebase.json) with the same full security
  header set (CSP, COOP/COEP/CORP, HSTS, Permissions-Policy, …) for the Firebase
  Hosting deployment target; `firebase.json`/`.firebaserc` are now
  version-controlled like the `Dockerfile`.

### Changed

- **Deployment no longer uses nginx.** The app is served by a single hardened
  `node:22-alpine` container running an Express + helmet static server
  (`server/index.js`) as a non-root user: strict CSP, cross-origin isolation,
  correct WASM/manifest MIME, immutable asset caching, `GET`/`HEAD` only, and a
  `/healthz` probe.
- `docker-compose.yml` hardened: read-only root filesystem, `no-new-privileges`,
  all capabilities dropped, resource limits, log rotation, and `init: true`.

### Code quality

- Adopted the code principles **Clean Code, YAGNI, DRY, KISS, Semantic, and
  A11y** across the codebase (documented in [docs/PRINCIPLES.md](docs/PRINCIPLES.md)).
- DRY refactors: a single `mutateDatabase()` read-modify-write helper behind the
  four DB writers, and a shared `megapixelsFrom()` used by the image and video
  metadata paths.
- Accessibility: restored user zoom (removed `maximum-scale`/`user-scalable=no`,
  per WCAG 1.4.4/1.4.10) and added a `role="status"`/`aria-live` region for
  status toasts.
- Fixed the empty-state hint to show the correct database filename
  (`nata-sort-db.json`).
- Added **Prettier** (`pnpm format` / `pnpm format:check`, config in
  `.prettierrc`) and formatted the whole codebase.
- Full-codebase principle audit and cleanup:
  - **A11y**: fixed a broken folder-name `label`/`for` association, named the
    add-folder and progress-bar controls, made the folder logo decorative, and
    enabled Enter-to-submit for adding folders.
  - **Semantic**: removed invalid `<div>`-inside-`<p>` nesting in FolderManager
    and OperationLog; `ThemeProvider` now uses an `undefined` context default so
    the "used outside provider" guard is meaningful.
  - **Dead code / YAGNI**: removed the unused `removeStatus` store action,
    `isInitializedRef`, the write-only `PhotoFile.moved` field, speculative
    exports (`loadProjectState`, `ALL_EXTENSIONS`, …), and the now-unused
    `lodash.isempty` dependency.
  - **DRY/KISS**: extracted `StatRow` and a `getExtension` helper, consolidated
    MobileActionBar's duplicate index prop, and simplified trivial `useMemo`/
    `isEmpty` usages.
  - **Correctness**: fixed the `TRUST_PROXY` env parsing (`"false"` no longer
    enabled it), a `formatFileSize` out-of-bounds for ≥ 1 PB, an edge-swipe
    `touchStart === 0` guard, and dead `dark-*` utility classes that left the
    mobile bar with no background.

### Added

- **Filmstrip & grid view.** A scrollable thumbnail filmstrip under the viewer
  and a toggleable responsive grid for overview — both show sort status and the
  current photo, and lazily decode small **RAW previews** in the background.
- **Zoom & pan.** A desktop hover **loupe** magnifier over the image, plus
  pinch-to-zoom / drag-to-pan and double-tap-to-reset on touch.
- **Multi-select + batch sort.** Select photos (checkbox, shift-click range,
  "pilih belum disortir") and sort the whole selection into a folder at once —
  from the contextual bottom bar, the sidebar's Sortir button, or a folder's
  number shortcut; a batch is a single undoable unit.
- **Keyboard-shortcut help.** A `?` button in the navbar opens a dialog listing
  the shortcuts, rendered with the shadcn `Kbd` component (moved out of the
  sidebar tip).
- Detailed project documentation under [`docs/`](docs/): PRD, SPEC,
  ARCHITECTURE, DESIGN, TDD, UI-Design, PRINCIPLES, DEPLOYMENT, and SECURITY.

## [2.0.1] - 2026-06-14

### Fixed

- RAW preview no longer hangs on libraw worker errors ("n is not a function").
- Truncated/broken Sony ARW previews — the embedded JPEG is now extracted
  correctly (slice SOI→next-SOI and let the decoder find the EOI).

### Changed

- Patch the libraw-wasm worker (reject on error) + 20s timeout + terminate the
  worker after each decode.
- Fall back to libraw `thumbnailData()` for RAW without an embedded JPEG.
- Re-encode previews to a bounded JPEG so cached previews aren't tens of MB.
- Bump libraw-wasm to ^1.4.0.

## [2.0.0] - 2026-06-14

> ⚠️ **Breaking:** database schema bumped to `2.0`; existing
> `nata-sort-db.json` files are reset on first open.

### Added

- Chronological ordering by capture date.
- Undo last sort (`Ctrl/Cmd+Z`) and jump to next unsorted (`U`).
- "All sorted" completion state.
- Installable PWA with offline support.
- Lazy, cached metadata extraction.
- Automatic image-preview retry on load failure.
- Filename-collision handling (no silent overwrites).
- Security headers + CSP and client-side URL normalization.
- Docker support (multi-stage build + nginx).
- React error boundary.

### Changed

- Sort mappings keyed by file name instead of array index.
- Operation log is now fully serializable; database writes are atomic.
- RAW preview uses the largest embedded JPEG (libraw fallback).
- Broader metadata extraction and robust date parsing.
- Responsive metadata panel; mobile bar shows all folders.
- New page title and rewritten README; removed template assets and dead code.

### Fixed

- Sort state desync after cut + reload.
- Stale file handle and invalid source-delete path on cut.
- RAW decodes retrying forever; unrevoked object URLs (memory leak).
- Shortcuts firing while typing; first photo unsortable on mobile.
- `formatDate` on non-standard date strings; status-toast timing race.
- `removeFolder` leaving non-empty folders; duplicate/invalid folder names.
- Camera make/model duplication; broken HEIC and favicon references.

## [1.1.0] - 2025-05

### Added

- Video preview and video metadata (mediainfo.js).

### Changed

- Migrated to shadcn/Radix components and a Zustand status store.

### Fixed

- Database no longer reset when reloading the project folder.
