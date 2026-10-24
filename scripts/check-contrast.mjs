#!/usr/bin/env node
/**
 * Guards the design tokens: recomputes the WCAG 2.2 contrast pairs from
 * src/app/styles/tokens.css and fails on colour literals in components.
 * Run with `pnpm check:contrast`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const css = readFileSync("src/app/styles/tokens.css", "utf8")

/** Hex tokens declared in the block that starts with `selector {`. */
const block = selector => {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf("}", start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map(m => [m[1], m[2]]))
}
const light = block(":root")
const dark = { ...light, ...block(":root.dark") }

const lin = c => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const lum = hex => {
  const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// [foreground, background, minimum ratio]: text 4.5, UI components 3.
const PAIRS = [
  ["fg", "surface-1", 4.5],
  ["fg-muted", "surface-1", 4.5],
  ["fg-muted", "surface-3", 4.5],
  ["fg-subtle", "surface-2", 4.5],
  ["accent", "surface-1", 4.5],
  ["accent-fg", "accent", 4.5],
  ["accent", "canvas", 3],
  ["border-strong", "surface-1", 3],
  ["border-strong", "surface-2", 3],
  ["success", "surface-1", 4.5],
  ["warning", "surface-1", 4.5],
  ["danger", "surface-1", 4.5],
  ["danger-fg", "danger", 4.5]
]

let failed = 0
for (const [name, tokens] of [
  ["light", light],
  ["dark", dark]
]) {
  for (const [fg, bg, min] of PAIRS) {
    const r = ratio(tokens[fg], tokens[bg])
    if (r < min) {
      failed++
      console.error(`FAIL ${name}: ${fg} on ${bg} = ${r.toFixed(2)} (needs ${min})`)
    }
  }
}

// Components use tokens only: no hex/rgb/hsl/oklch literals outside tokens.css.
const LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/
const walk = dir =>
  readdirSync(dir).flatMap(f => {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) return f === "tests" || f === "test" ? [] : walk(p)
    return /\.(tsx?|css)$/.test(f) && f !== "tokens.css" ? [p] : []
  })
for (const file of walk("src")) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (LITERAL.test(line)) {
        failed++
        console.error(`FAIL literal colour ${file}:${i + 1}: ${line.trim()}`)
      }
    })
}

if (failed) process.exit(1)
console.log("Design tokens OK: contrast pairs pass in both themes, no colour literals.")
