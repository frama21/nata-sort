// Runs before first paint (same-origin, so the CSP stays untouched): sets the theme
// from storage. Every stored value is validated; this must never throw.
try {
  var root = document.documentElement
  var theme = localStorage.getItem("nata-sort-theme")
  // Dark is the default: only an explicit "light" (or "system" on a light OS) opts out.
  var dark =
    theme === "light" ? false : theme === "system" ? matchMedia("(prefers-color-scheme: dark)").matches : true
  if (dark) root.classList.add("dark")
} catch (e) {
  document.documentElement.classList.add("dark")
}
