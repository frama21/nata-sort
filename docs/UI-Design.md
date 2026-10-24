# NATA — UI / UX Design

> The visual and interaction layer: the **"Calm Light"** theme, tokens, layout, components and
> accessibility rules. It shares RONA's neutral palette, type, shape and motion; the **accent
> (teal), the mark and the screens are NATA's own**.
>
> Related: [DESIGN.md](DESIGN.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [SECURITY.md](SECURITY.md) · [PRINCIPLES.md](PRINCIPLES.md)

## 1. Principles

1. **Content is the interface** — quiet chrome, hairline borders, no gradients, glow or blur on panels.
2. **Neutral means neutral** — chrome greys are pure (R = G = B). Dark is the default theme.
3. **One accent, used sparingly** — primary action, selection ring, progress, focus-adjacent state. Hover is grey, never accent.
4. **Readable for hours** — body 14 px, nothing below 12 px, tabular numbers for every figure, no monospace.
5. **Calm, fluid motion** — things ease in and ease out (dialogs, sheets and toasts animate on exit too); a photo never blinks to blank between steps; short fades and 2–4 % scale; only `opacity`/`transform` animate; reduced motion is honoured.
6. **Accessible and bilingual** — keyboard, ARIA, a visible focus ring, EN + ID copy that fits at +40 % length.

## 2. Tokens

Defined once in [`src/app/styles/tokens.css`](../src/app/styles/tokens.css) (`.dark` on `<html>`, set before first paint by
`public/theme-init.js`) and mapped to Tailwind in `globals.css` (`@theme inline`). Components use tokens only.

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--bg` / `--canvas` | `#1C1C1C` / `#141414` | `#F3F3F3` / `#E6E6E6` | App background / main content well |
| `--surface-1/2/3` | `#232323` `#2C2C2C` `#363636` | `#FAFAFA` `#FFFFFF` `#EDEDED` | Panels · raised (cards, dialogs) · hover/wells |
| `--border` / `--border-strong` | `#3B3B3B` / `#7A7A7A` | `#DADADA` / `#8C8C8C` | Layout hairlines / control boundaries |
| `--fg` `--fg-muted` `--fg-subtle` | `#EDEDED` `#A8A8A8` `#939393` | `#1D1D1D` `#5A5A5A` `#6B6B6B` | Text |
| **`--accent`** | **`#4FD1C5`** | **`#0A6A6D`** | NATA teal: primary action, selection, progress |
| `--accent-fg` | `#06201F` | `#FFFFFF` | Text on an accent fill |
| `--accent-soft` | 20 % accent on `surface-1` | 14 % | Selected segment/row (text stays `--fg`) |
| `--success` `--warning` `--danger` | `#4CC38A` `#E5B04A` `#FF7A72` | `#1B7A4B` `#8A5A00` `#C2302A` | Status (on the icon, not the message) |
| `--brand-accent` | `#14B8A6` | `#14B8A6` | Logo only (never text) |

- **Type**: Inter Variable (400–700), body 14/20, label 13.5, caption 12 (minimum), `display` 28/34 (currently unused: the welcome screen shows the logo instead of a headline).
- **Shape**: radius 6 / 8 / 12 / 16; `--shadow-e1` (popover, toast), `--shadow-e2` (dialog). Panels are flat.
- **Motion**: `--dur-fast` 120 ms, `--dur-base` 180 ms, `--dur-slow` 280 ms, `--dur-xl` 460 ms (the welcome-to-workspace transition only); `--ease: cubic-bezier(.2,0,0,1)` for state changes, `--ease-out: cubic-bezier(.16,1,.3,1)` for entrances (spring-out feel), `--ease-in: cubic-bezier(.4,0,1,1)` for exits; press scales to 0.97. Entrance keyframes (`rise`, `page-enter`, `pop-in`, `slide-in-bottom`) live in `globals.css`.
- **Focus**: `box-shadow: 0 0 0 2px var(--focus-inner), 0 0 0 4px var(--focus-outer)` on `:focus-visible`, on every element.
- **Contrast**: `pnpm check:contrast` recomputes the WCAG 2.2 pairs (text ≥ 4.5, UI ≥ 3) in both themes and fails on any hex/rgb/hsl/oklch literal in components. The teal keeps ≥ 4.5:1 on `surface-1`, white/dark text ≥ 4.5:1 on top of it, and ≥ 3:1 on `canvas`, and sits ~180° away from `--danger` so a primary button never reads as destructive.

Folder colours are Tailwind palette classes stored in the project file (schema `"2.0"`), so they are unchanged; white text on the yellow/orange ones is a known contrast debt.

## 3. Layout

| Region | ≥ 1024 px | < 1024 px |
| --- | --- | --- |
| Top bar | 48 px: mark + name · main views (hidden while there is one) · close project · help/settings | same, wordmark kept on phones |
| Left | 248 px folders panel (`nav`) | sheet (opened by *Folders*) |
| Centre | canvas: view toggle, viewer / grid, filmstrip | one column |
| Right | 320 px details panel (`aside`): info, log, stats | bottom sheet (opened by *Info*) |
| Bottom | 28 px status bar: counts only (photos, left, selected) | 72 px action bar (prev, one button per folder, next) |

Each desktop panel scrolls on its own. Panels render in exactly one place (`useMediaQuery`), so ids and shortcut recording never double up.
Landmarks: `banner`, `navigation`, `main`, `complementary`; a skip link comes first, and a route change moves focus to `main`.

## 4. Components (`src/shared/components/ui/`)

Button (`default` = the one primary action, `secondary`, `ghost`, `outline`, `destructive`, `link`; `loading`), Input, Tabs (segmented), Badge, Card, Dialog (`side="center" | "left" | "bottom"`, native `<dialog>`), Tooltip, Progress, Alert (`success`, `destructive`), Kbd, Empty, Skeleton (shimmer after 150 ms). Controls are 32 px with a mouse and 44 px on touch via `pointer-coarse:`.
Activity indicator (`ActivityIndicator`, top bar left of Close project): spinner while reading or saving, green check when saved, red cross when failed, next to the message ("Moving x…", "x done", idle "Saved"). Desktop always shows the message; phones keep the icon and show the message only while there is one (a success clears after 3 s), and the top bar wordmark slides up and fades out meanwhile to make room (it returns when the message clears). A failure stays until clicked or until the next operation starts. Sort, undo, save and project-reading messages (status icon `file`/`db`) use it instead of toasts.

Toasts (`StatusIndicator`, everything else: folder validation, folder created/deleted, shortcut changes, recents): bottom-right (top-centre on phones), two live regions (polite, assertive for errors), never take focus, pause on hover/focus, errors stay until dismissed, a duplicate is shown once.
Destructive or leave-the-page confirmations are in-app dialogs, never `window.confirm`: deleting a sort folder (which deletes its files from disk) and leaving the workspace both ask first, with the safe choice focused. A dialog may open from inside a sheet; closing it leaves the sheet open.
A rejected folder name is explained under its field (`aria-invalid`, `aria-describedby`) and stays in the field; it is not also sent as a toast. Between 768 and 1023 px the toasts sit above the 72 px action bar (96 px from the bottom); from 1024 px they sit above the 28 px status bar.
With no sort folder yet, the phone/tablet action bar shows one button, *Add a folder*, that opens the folders sheet.

## 5. Brand

The mark is a tile with one corner open and a teal piece about to drop into it ("every photo finds its place", from *menata*, to put in order): solid fills on a 256-unit canvas, the tile in ink/paper (`currentColor`), the piece in `--brand-accent`.
The wordmark is a custom lowercase "nata" built as outlines (no font). Both live in `src/shared/components/brand/NataMark.tsx` (`NataMark`, `NataWordmark`); the navbar pairs them with a screen-reader-only "NATA" heading and hides the wordmark below 640 px.
App icons are an ink `#111111` tile (22 % radius) with the mark; the maskable icon is full-bleed with the mark inside the 80 % safe zone; `public/favicon.svg` enlarges the mark in the tile so the piece survives 16 px.
Kit, colours and usage rules: [`docs/brand/`](brand/README.md).

**Boot screen.** While the app loads, the NATA mark sits over an indeterminate linear bar (teal, sliding). `index.html` carries a static copy with its own inline `<style>` (the CSP allows inline styles, not scripts) so it paints before the bundle; it fades in after 120 ms, so a warm load that mounts sooner never shows it. `BootSplash` (`shared/components/brand`) renders the same markup as the route `HydrateFallback`, without the delay, so the handoff does not blink. The `.boot*` rules live only in `index.html`. Under reduced motion the bar pulses instead of sliding.

**Motion patterns.** Dialogs, drawers and sheets animate out as well as in (CSS transitions with `@starting-style`, Chromium 117+; elsewhere the close is instant). Toasts slide in and out. The viewer keeps the previous photo on screen, with a delayed "Loading…" chip, until the next one is decoded, then fades it in over the old one; thumbnails fade in on load. Opening a project lifts the start screen away (it stays mounted but inert for 300 ms) while the side panels slide in from their edges and the canvas rises, staggered. Closing it plays the reverse (panels slide out, the canvas sinks) for 280 ms before the project closes, with the workspace inert meanwhile. A sort pops the result badge; new folder rows and log entries rise in; Single and Grid fade in on switch; the filmstrip glides to the current photo when stepping.

## 6. Accessibility floor (WCAG 2.2 AA)

Two-tone focus ring everywhere; colour never carries meaning alone (state = icon/dot + word); targets ≥ 24 px (44 px on touch); every drag has a non-drag alternative;
`prefers-reduced-motion` zeroes the duration tokens and stops loops (loading spinners become a slow opacity pulse so "working" stays visible); `<html lang>` follows the UI language; the viewport allows zoom.
Not yet built (from the RONA brief): an in-app "Reduce motion" switch and an accent picker — NATA has no settings dialog.

## 7. Voice

English: "you", short and calm. Indonesian: **"kamu"** (not "Anda"), warm everyday words, no slang. Errors say what happened and what to do next. All strings live in `src/shared/i18n/language/{en,id}.json`.
