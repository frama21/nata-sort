# syntax=docker/dockerfile:1

# ============================================================
# NATA — production image
#
# Two stages, Node appears exactly once:
#   1. build   — node:24-alpine + pnpm compile the SPA (thrown away).
#   2. runtime — unprivileged nginx serving the static build. The whole nginx
#                config (security headers, caching, SPA fallback) lives below.
# ============================================================

# ------------------------------------------------------------
# Stage 1 — Build the static site with pnpm
# ------------------------------------------------------------
FROM node:24-alpine AS build

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

# Enable pnpm via corepack, pinned to the version used by the lockfile.
RUN corepack enable && corepack prepare pnpm@12.8.1 --activate

# Install dependencies first so this layer is cached unless the lockfile changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

# Build the production bundle (tsc -b && vite build → /app/dist).
COPY . .
RUN pnpm run build

# ------------------------------------------------------------
# Stage 2 — nginx (non-root, listens on 8080) + built assets only
# ------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

# Replaces the stock server block. See docs/SECURITY.md for the header rationale.
#
# Notes:
#  - `add_header` is declared ONCE at server level and no location re-declares
#    it (nginx drops inherited add_header as soon as a location sets its own).
#    Per-path Cache-Control therefore comes from the `$cache_control` map.
#  - CSP: same-origin everything, WASM compilation, blob:/data: for local
#    previews, inline styles (Tailwind/Radix). No remote script/connect/frame.
#  - COOP + COEP + CORP enable cross-origin isolation for the WASM workers.
COPY <<'EOF' /etc/nginx/conf.d/default.conf
map $uri $cache_control {
    default                          "no-cache";
    ~^/assets/                       "public, max-age=31536000, immutable";
}

server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    server_tokens off;

    gzip on;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_vary on;
    gzip_types text/css application/javascript text/javascript application/json
               application/manifest+json application/wasm image/svg+xml text/plain;

    add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' blob: data:; manifest-src 'self'; upgrade-insecure-requests" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cross-Origin-Resource-Policy "same-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Permitted-Cross-Domain-Policies "none" always;
    add_header X-DNS-Prefetch-Control "off" always;
    add_header X-Download-Options "noopen" always;
    add_header Origin-Agent-Cluster "?1" always;
    add_header X-XSS-Protection "0" always;
    add_header Permissions-Policy "accelerometer=(), autoplay=(), browsing-topics=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), interest-cohort=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), screen-wake-lock=(), serial=(), sync-xhr=(), usb=(), xr-spatial-tracking=()" always;
    # No `always`: error responses (404) must not inherit "immutable".
    add_header Cache-Control $cache_control;

    # Read-only site: reject every other verb.
    if ($request_method !~ ^(GET|HEAD)$) {
        return 405;
    }

    location = /healthz {
        access_log off;
        default_type text/plain;
        return 200 "ok";
    }

    # Stock mime.types doesn't know .webmanifest.
    location = /manifest.webmanifest {
        default_type application/manifest+json;
    }

    # Real files only: a missing asset must be a 404, never index.html parsed as JS/CSS/WASM.
    location ~ \.[A-Za-z0-9]+$ {
        try_files $uri =404;
    }
    location /assets/ {
        try_files $uri =404;
    }

    # Single-view SPA: any other navigation path serves index.html.
    location / {
        try_files $uri /index.html;
    }
}
EOF

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
