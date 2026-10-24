import { version } from "../../../package.json"

/** Static application settings. The app reads no environment variables: it has no backend or secrets. */
export const appConfig = {
  name: "NATA",
  title: "NATA — Sortir Foto & Video Lokal",
  version
} as const
