const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60]
]

/**
 * "2 hours ago" / "yesterday" in the UI language.
 * @param timestamp Epoch ms of the past moment.
 * @param language BCP 47 tag, e.g. `i18n.language`.
 * @param now Epoch ms treated as the present.
 * @returns A localized relative time; "now" for anything under a minute.
 */
export function formatRelativeTime(timestamp: number, language: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000))
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: "auto" })
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return formatter.format(-Math.floor(seconds / size), unit)
  }
  return formatter.format(0, "second")
}
