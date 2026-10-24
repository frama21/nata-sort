# NATA

A fast, **100% client-side** photo & video sorter that runs in the browser. Open
a local folder, preview each file, and copy/move it into sort sub-folders with
single-key shortcuts. Nothing is uploaded — all processing happens locally via
the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API).

> Requires a Chromium-based browser (Chrome / Edge / Opera). The File System
> Access API is not available in Firefox/Safari.

## Features

- **Open a local folder** and scan top-level images & videos — nothing leaves
  your machine.
- **Chronological order** — files are sorted by capture date/time (EXIF / video
  metadata), falling back to the file's modified date.
- **Sort with shortcuts** — keys `1`–`9` assign the current file to a folder.
  Click a folder's badge and press any key to rebind it (arrows, `Space`, `U`,
  `Esc`, and keys used by another folder are refused).
- **English & Indonesian UI** — a navbar toggle switches language; the choice is
  remembered on the device. Strings live in `src/shared/i18n/language/{en,id}.json`.
- **Copy or Cut mode** — duplicate into the target folder, or move it there.
- **Filmstrip & grid view** — a thumbnail strip under the viewer and a
  toggleable responsive grid (with RAW previews), both showing sort status.
- **Zoom & pan** — a desktop hover **loupe** magnifier, plus pinch-to-zoom /
  drag-to-pan and double-tap-to-reset on touch, for pixel-peeping.
- **Multi-select + batch sort** — select many photos (checkbox, shift-range,
  "Select unsorted") and sort them all into a folder at once — via the
  folder button or its number shortcut; a batch is a single undo.
- **Undo** the last action (`Ctrl/Cmd+Z`), covering single and batch sorts.
- **Jump to next unsorted** (`U`) to skip already-sorted files, plus an
  "all sorted" completion state.
- **Wide format support** — JPEG/PNG/WebP/AVIF/GIF/BMP/TIFF, SVG, plus RAW
  (Canon, Nikon, Sony, Fuji, Panasonic, Olympus, Pentax, DNG, …) and video
  (MP4, MOV, MKV, WebM, AVI, …).
- **RAW preview** — extracts the largest embedded JPEG preview (sharp & fast),
  with a full-resolution `libraw-wasm` decode as fallback.
- **Metadata panel** — EXIF for images (camera, lens, ISO, shutter, aperture,
  date) and `mediainfo.js` for video (duration, fps, codecs, bitrate). Metadata
  is extracted lazily on demand and cached.
- **Auto-persisted project state** — folders, sort mappings, mode, and the
  recent operation log are saved to `nata-sort-db.json` inside the chosen
  folder and restored on the next visit.
- **Filename-collision safe** — copies/moves never silently overwrite; a
  `_1`, `_2`, … suffix is added when a name already exists.
- **Installable PWA** — install to your desktop/home screen and keep working
  offline thanks to a precaching service worker. New versions wait until you
  press **Reload**, so an open project is never swapped out from under you.
- **Responsive** — desktop sidebar layout and a mobile action bar with swipe
  navigation. Light/dark themes.

## Keyboard shortcuts

| Key            | Action                      |
| -------------- | --------------------------- |
| `1`–`9`        | Sort into folder 1–9        |
| `←` / `→`      | Previous / next photo       |
| `Space`        | Next photo                  |
| `U`            | Jump to next unsorted photo |
| `Ctrl/Cmd + Z` | Undo last action            |
| `Ctrl/Cmd + A` | Select all (grid view)      |

(Shortcuts are ignored while typing in a text field.)

## Tech stack

React 19 · TypeScript (strict) · Vite · React Router · Tailwind CSS v4 · Zustand · i18next ·
ExifReader · mediainfo.js · libraw-wasm · vite-plugin-pwa. UI primitives are
in-house components in `src/shared/components/ui` (native `<dialog>`, ARIA tabs,
…), with no Radix or shadcn dependency. Tests: Vitest + React Testing Library +
Playwright. Production server: nginx, configured inside the
[`Dockerfile`](Dockerfile) (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).

## Getting started

Requires Node 22.23.4+ and pnpm 12+.

```bash
pnpm install
pnpm dev                  # start the dev server
pnpm build                # typecheck + production build
pnpm preview              # preview the production build
pnpm lint                 # ESLint (incl. JSDoc warnings and import boundaries)
pnpm format:check         # Prettier
pnpm typecheck            # tsc -b
pnpm check:architecture   # module boundaries on resolved paths + import cycles
```

## Architecture

The code is organized by feature. A feature owns its UI, logic, routes, and
tests, so you can change or delete it mostly inside its own folder.

```text
src/
├── app/        # composition: providers, router + route discovery, layout, error boundary, styles
├── features/
│   ├── sorter/ # the sorting workspace (route "/"): controller hook, components, project DB
│   └── media/  # format registry, metadata extraction, RAW decoding (no routes, public API in index.ts)
├── shared/     # business-agnostic building blocks: UI primitives, i18n, status toasts, cn(), route types
└── test/       # global test setup and test doubles (in-memory File System Access handles)
```

Each feature uses only the folders it needs (`components/`, `hooks/`, `pages/`,
`services/`, `types/`, `utils/`, `config/`, `tests/`). It may also have:

- **`routes.ts`** declares the feature's pages. It is found automatically, see below.
- **`index.ts`** is the feature's public API. Only `media` and `sorter` have one,
  because only they have consumers. If a feature has no `index.ts`, other features cannot import it.
- **`README.md`** documents the feature's purpose, contract, and how to remove it safely.

### Import boundaries

| From | May import | Must not import |
| --- | --- | --- |
| `app/` | `shared/`, feature routes (via discovery) | feature internals |
| `features/<name>/` | its own files (relative paths), `shared/`, another feature's `index.ts` (`@/features/<other>`) | `app/`, another feature's internal files |
| `shared/` | `shared/`, packages | `app/`, `features/` |

These rules are enforced in two places:

- **ESLint** (`no-restricted-imports`) checks alias imports and gives feedback in
  the editor. It generates one rule block per folder in `src/features`.
- **`pnpm check:architecture`** checks the resolved paths, so relative escapes
  like `../other-feature/...` are caught too. It also reports import cycles and
  unresolved imports. Test files may import the internals they test.

### Route discovery

`src/app/routes/feature-routes.ts` uses `import.meta.glob("/src/features/*/routes.ts", { eager: true })`.
Each `routes.ts` exports `routes: FeatureRoute[]` (see `src/shared/types/route.types.ts`):

```ts
export const routes: FeatureRoute[] = [
  {
    path: "/about",
    lazy: () => import("./pages/AboutPage").then(m => ({ Component: m.AboutPage })),
    title: "Tentang", // document title
    nav: { label: "Tentang", order: 10 } // optional link in the main navigation
  }
]
```

- **Validation:** `collectFeatureRoutes` validates every module. A missing
  `routes` export, an invalid route, or a duplicate path is logged and skipped;
  the other routes still work.
- **Lazy loading:** pages are lazy-loaded into their own chunks. Each route has
  its own error boundary, so a crash or a failed chunk download stays inside
  that route.
- **Not found:** unknown URLs show a not-found page.
- **Not supported yet:** nested routes, per-route layouts, and auth guards. Add
  them to `FeatureRoute` when a feature needs them.

The glob is resolved at build time. Adding or deleting a feature changes the
routes with no registry to edit. A dev server picks this up on restart.

### Adding a feature

1. Create `src/features/<name>/` with only the folders it needs.
2. If it has pages, add `routes.ts`.
3. If other features need it, export a minimal public API from `index.ts`.
4. Put its tests in `tests/unit-test/`, `tests/integration-test/`, or `tests/e2e-test/`.
5. Add a `README.md` (copy `src/features/sorter/README.md` as a template).

### Removing a feature

Delete its folder, then run `pnpm typecheck && pnpm check:architecture && pnpm test`.

- **No dependents:** removing `sorter` needs no other change. It was verified this way,
  including the build and the remaining tests.
- **Has dependents:** `sorter` depends on `media`, so deleting `media` fails at
  `tsc` and `check:architecture` with "unresolved import". It never fails
  silently at runtime. Each feature README lists its dependencies.

## Testing

| Command | Runs |
| --- | --- |
| `pnpm test` | all Vitest projects (unit + integration) |
| `pnpm test:unit` | `src/**/tests/unit-test/**/*.test.ts(x)` |
| `pnpm test:integration` | `src/**/tests/integration-test/**/*.test.ts(x)` |
| `pnpm test:e2e` | Playwright on a production build (`src/**/tests/e2e-test/*.spec.ts`, Chromium) |
| `pnpm test:all` | Vitest, then Playwright |

- **Folder picker in E2E:** Playwright can't drive the native folder picker.
  Instead, the E2E suite points `showDirectoryPicker()` at a folder in the
  browser's Origin Private File System. Those are real File System Access
  handles, so copy, move, undo, and the project database run against actual
  files.
- **Unit and integration tests** use the in-memory handles in
  `src/test/global-mocks/file-system.ts`.

## Run with Docker

Deployment is a **single container** driven by `docker compose`. A two-stage
`Dockerfile` builds the app with pnpm on `node:24-alpine` (the only place Node
appears), then an unprivileged `nginx` runtime serves the static output. The
whole nginx config lives in the `Dockerfile` (the repo's only deploy files are
`Dockerfile` and `docker-compose.yml`): strict CSP + security headers,
cross-origin isolation, SPA routing, immutable asset caching, and correct
PWA/WASM MIME types. The final image contains only nginx and the built assets —
no Node, no toolchain — and it runs as a **non-root** user.

```bash
docker compose up -d --build    # build & run → http://localhost:8080
docker compose down             # stop
```

The Compose file is hardened for production out of the box: read-only root
filesystem, `no-new-privileges`, all Linux capabilities dropped, resource
limits, log rotation, and a health check. For public HTTPS, terminate TLS at
your platform edge (Cloudflare, a load balancer, Caddy/Traefik) and forward to
the container. See [docs/SECURITY.md](docs/SECURITY.md)
for the full deployment hardening details.

Or without Compose:

```bash
docker build -t nata-sort .
docker run -d -p 8080:8080 nata-sort
```

## How state is stored

A single JSON file, `nata-sort-db.json`, is written to the folder you open.
It contains the sort folders, the per-file sort mapping (keyed by file name),
the move mode, the recent operation log, and a metadata cache. Deleting this
file resets the project; the app recreates it on the next open. The database
carries a schema version and is reset (with a visible warning) if an
incompatible version is found.

## Security

- All files are processed **locally** in the browser; nothing is uploaded and
  there is no network egress (`connect-src 'self'`).
- A strict **Content-Security-Policy** and a full set of security headers
  (`COOP`/`COEP`/`CORP` cross-origin isolation, `HSTS`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, …) are set by the nginx config in the
  [`Dockerfile`](Dockerfile).
- Untrusted input is defended in depth: images are parsed header-only and
  decodes are bounded/timed-out; the project database is sanitized against
  prototype pollution; folder names are strictly validated.
- The dependency tree is **audit-clean** (`pnpm audit` → *No known
  vulnerabilities found*), and the production image ships only three audited
  server dependencies.
- Routing is client-side only: an unknown URL renders an inert not-found page with a link home.

A full security policy, threat model, and audit report is in
[docs/SECURITY.md](docs/SECURITY.md). Report vulnerabilities privately via
[GitHub security advisories](https://github.com/frama21/photo-sorter/security/advisories/new)
(see [`/.well-known/security.txt`](public/.well-known/security.txt)).

## Documentation

Detailed project documentation lives in [`docs/`](docs/):

| Document | Purpose |
| --- | --- |
| [PRD.md](docs/PRD.md) | Product requirements — vision, personas, user stories, scope. |
| [SPEC.md](docs/SPEC.md) | Functional specification — features, formats, behaviors, edge cases. |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture — modules, data flow, deployment. |
| [DESIGN.md](docs/DESIGN.md) | Software design — key decisions, rationale, core algorithms. |
| [TDD.md](docs/TDD.md) | Technical design — module internals, DB schema, sequence diagrams, limits. |
| [UI-Design.md](docs/UI-Design.md) | UI/UX — design tokens, layout, components, theming, accessibility. |
| [PRINCIPLES.md](docs/PRINCIPLES.md) | Engineering & product principles (Clean Code · YAGNI · DRY · KISS · Semantic · A11y). |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment guide — Docker Compose, the server, and Firebase Hosting. |
| [SECURITY.md](docs/SECURITY.md) | Security policy, threat model, and audit report. |
| [brand/](docs/brand/README.md) | Logo kit (SVG/PNG), colours, and usage rules. |

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the release history.