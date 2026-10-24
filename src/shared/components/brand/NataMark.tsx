/**
 * NATA's mark: a tile with one corner open and a teal piece about to drop into it
 * ("every photo finds its place"). Solid fills only, built on a 256-unit canvas.
 * The tile follows `currentColor` (ink on light, paper on dark); the piece is the brand teal.
 * Brand kit and usage rules: `docs/brand/`.
 */
export const NataMark = ({ className }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 256 256" className={className} focusable="false">
    <g transform="translate(-6 2)">
      <path
        d="M72 32H124A12 12 0 0 1 136 44V108A12 12 0 0 0 148 120H212A12 12 0 0 1 224 132V184A40 40 0 0 1 184 224H72A40 40 0 0 1 32 184V72A40 40 0 0 1 72 32Z"
        fill="currentColor"
      />
      <path
        d="M176 20H224A12 12 0 0 1 236 32V80A12 12 0 0 1 224 92H176A12 12 0 0 1 164 80V32A12 12 0 0 1 176 20Z"
        className="fill-brand-accent"
      />
    </g>
  </svg>
)

/** Glyph outlines of the lowercase "nata" wordmark (one path per overlapping part). */
const WORDMARK_PATHS = [
  "M0 80H24V184H0Z",
  "M0 184V132A52 52 0 0 1 104 132V184H80V132A28 28 0 0 0 24 132V184Z",
  "M118 132A54 54 0 1 0 226 132A54 54 0 1 0 118 132ZM142 132A30 30 0 1 1 202 132A30 30 0 1 1 142 132Z",
  "M202 80H226V184H202Z",
  "M258 52H282V156A4 4 0 0 0 286 160H310V184H286A28 28 0 0 1 258 156Z",
  "M238 80H310V102H238Z",
  "M322 132A54 54 0 1 0 430 132A54 54 0 1 0 322 132ZM346 132A30 30 0 1 1 406 132A30 30 0 1 1 346 132Z",
  "M406 80H430V184H406Z"
]

/** NATA's wordmark, drawn as outlines in `currentColor`. Decorative: pair it with a text label. */
export const NataWordmark = ({ className }: { className?: string }) => (
  <svg aria-hidden viewBox="0 52 430 134" className={className} focusable="false">
    {WORDMARK_PATHS.map(d => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
)
