# Deployment Guide

How to build, run, and host NATA. Two first-class targets are supported — a **single hardened Docker container** and **Firebase Hosting** — and both ship the **same** strict security headers.

Version 2.0.1 · Last updated 2026-07-14 · Status: Living document

> **Guiding principles.** This guide and the codebase follow six code principles — **Clean Code**, **YAGNI**, **DRY**, **KISS**, **Semantic** naming/HTML, and **A11y**. In deployment they show up as a deliberately minimal, single-purpose runtime (KISS/YAGNI), one canonical security-header definition mirrored across targets (DRY), and readable, self-documenting config. Full definitions: **[PRINCIPLES.md](PRINCIPLES.md)**.

---

## 1. Overview

NATA is a static single-page app: the build output in `dist/` is just HTML, JS, CSS, and WASM. The only job of a deployment is to serve those files **with the right security headers and MIME types** and route unknown paths back to `index.html`.

There is **no separate reverse proxy** in the stack: the container is a single unprivileged nginx whose config lives in the `Dockerfile`. Pick one target:

| Target | Best for | Entry point |
| --- | --- | --- |
| **Docker Compose** (recommended) | Self-hosting, homelab, VPS, any container platform | [`docker-compose.yml`](../docker-compose.yml) + [`Dockerfile`](../Dockerfile) (build + nginx config) |
| **Firebase Hosting** | Zero-ops managed HTTPS + CDN | [`firebase.json`](../firebase.json) + [`.firebaserc`](../.firebaserc) |

Both targets apply the identical header set documented in [SECURITY.md](SECURITY.md) §4.

---

## 2. Prerequisites

- **Build (outside Docker only):** Node 24 and pnpm 12 (`corepack enable && corepack prepare pnpm@12.8.1 --activate`). The Docker build needs neither.
- **Docker target:** Docker Engine + Compose v2.
- **Firebase target:** the Firebase CLI (`npm i -g firebase-tools`) and access to the Firebase project in [`.firebaserc`](../.firebaserc).

---

## 3. Option A — Docker Compose (recommended)

```bash
docker compose up -d --build    # build image + run → http://localhost:8080
docker compose logs -f          # follow logs
docker compose down             # stop & remove
```

### What the image is

A two-stage [`Dockerfile`](../Dockerfile):

1. **build** (`node:24-alpine`) — the only Node in the image chain. `pnpm install --frozen-lockfile` (with `pnpm-workspace.yaml` copied first so `overrides` match the lockfile) then `pnpm build` → `dist/`.
2. **runtime** (`nginxinc/nginx-unprivileged:stable-alpine`) — the nginx config is a heredoc in the `Dockerfile` (the repo's only deploy files are `Dockerfile` and `docker-compose.yml`); `dist/` is copied to `/usr/share/nginx/html`. Runs non-root on `:8080`. No Node, no toolchain, no frontend deps.

The nginx config is described in §5.

### Compose hardening

[`docker-compose.yml`](../docker-compose.yml) is production-ready by default:

| Setting | Effect |
| --- | --- |
| `read_only: true` + `tmpfs: /tmp` | Immutable root filesystem; only `/tmp` is writable. |
| `security_opt: [no-new-privileges:true]` | Blocks setuid privilege escalation. |
| `cap_drop: [ALL]` | No Linux capabilities (none are needed to bind :8080 as non-root). |
| `deploy.resources.limits` | 1 CPU / 128 MB (reservation 32 MB). |
| `logging` | json-file, rotated at `10m × 3`. |
| `healthcheck` + `restart: unless-stopped` | Self-healing via the `/healthz` probe. |

### Updating

```bash
git pull
docker compose up -d --build    # rebuild picks up dependency patches
```

---

## 4. Option B — Docker without Compose

```bash
docker build -t nata-sort .
docker run -d -p 8080:8080 --name nata-sort \
  --read-only --tmpfs /tmp --cap-drop ALL \
  --security-opt no-new-privileges \
  nata-sort
```

---

## 5. The nginx config (in the `Dockerfile`)

Behavior:

- Sets the strict CSP + full security-header set (`add_header ... always`, declared once at server level) and enables cross-origin isolation (COOP + COEP + CORP). HSTS is always sent; browsers only honour it over HTTPS.
- Accepts **`GET`/`HEAD` only** (`405` otherwise); no cookies, no upstream calls.
- Serves hashed `/assets/*` with `immutable` caching; everything else (HTML, `sw.js`, `manifest.webmanifest`) with `no-cache`. `Cache-Control` comes from a map and omits `always`, so 404s are never `immutable`.
- Emits correct `application/wasm` and `application/manifest+json` MIME types.
- Serves `/.well-known/security.txt`; exposes `/healthz`.
- SPA fallback: unknown *navigation* paths → `index.html`; missing *assets* (under `/assets/` or with a file extension) → real `404`.
- Compresses responses with gzip (stock nginx has no brotli).

There are no environment variables. To change a header or cache rule, edit the heredoc in the `Dockerfile` and rebuild.

Run locally against a fresh build:

```bash
docker compose up -d --build   # → http://localhost:8080
```

---

## 6. Option C — Firebase Hosting

[`firebase.json`](../firebase.json) mirrors the container's security headers (CSP, COOP/COEP/CORP, HSTS, Referrer-Policy, X-Frame-Options, Permissions-Policy, …), sets immutable caching for `/assets/**`, `no-cache` for `index.html` / `sw.js` / `manifest.webmanifest`, and rewrites unknown paths to `/index.html`. Because Firebase serves over HTTPS, **HSTS is actually effective there**.

```bash
pnpm build                 # produce dist/
firebase deploy --only hosting
```

Notes:

- The `ignore` list intentionally does **not** exclude dotfiles, so `dist/.well-known/security.txt` is deployed.
- [`.firebaserc`](../.firebaserc) only maps the project alias (`default` → the Firebase project); it holds **no security configuration** — all hosting security lives in `firebase.json`.
- `firebase.json` and `.firebaserc` are version-controlled (like the `Dockerfile`) because they carry the production security posture.

---

## 7. TLS / HTTPS

- **Firebase Hosting** provides managed HTTPS automatically.
- **Container:** it speaks plain HTTP; terminate TLS at your platform edge (Cloudflare, a cloud load balancer, or an existing Caddy/Traefik) and forward to `:8080`. HSTS is sent but inert over plain HTTP by design.
- Consider the [HSTS preload list](https://hstspreload.org/) once you serve a stable HTTPS domain.

---

## 8. Verification

```bash
# Container
docker compose up -d --build
curl -sSD - http://localhost:8080/ -o /dev/null   # inspect headers
curl -s http://localhost:8080/healthz             # → ok

# Expect: CSP + COOP/COEP + HSTS + Permissions-Policy present;
# /assets/* → immutable; POST / → 405; missing /assets/x.js → 404.
```

See [SECURITY.md](SECURITY.md) §7 for the full verification checklist.

---

## 9. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `SharedArrayBuffer is not defined` | Cross-origin isolation missing — ensure COOP `same-origin` + COEP `require-corp` reach the browser (both targets set them; a proxy must not strip them). |
| HSTS not applied | HSTS is only honoured over HTTPS; terminate TLS in front of the container. |
| Video metadata blank | Known functional limitation: `MediaInfoModule.wasm` is not emitted at build time, so video metadata degrades gracefully. Not a security issue — see [SECURITY.md](SECURITY.md) §8. |
| Static asset returns `index.html` | Should not happen — nginx returns `404` for missing assets. Verify you built with `pnpm build` and the asset exists in `dist/`. |

---

## 10. Related documents

- [ARCHITECTURE.md](ARCHITECTURE.md) — where the deployment fits in the system.
- [SECURITY.md](SECURITY.md) — the authoritative security-header and hardening reference.
- [TDD.md](TDD.md) — nginx config + container technical design.
- [README](../README.md) — quick-start.
