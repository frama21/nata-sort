#!/usr/bin/env node
// Checks module boundaries on resolved paths (so relative imports can't sneak
// around the ESLint alias rules) and reports runtime import cycles.
// Usage: node scripts/check-architecture.mjs   (exit 1 on any violation)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"

const SRC = resolve("src")
const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"]

const walk = dir =>
  readdirSync(dir).flatMap(name => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts") ? [full] : []
  })

const resolveImport = (from, spec) => {
  let base
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2))
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec)
  else return null // package import
  if (existsSync(base) && statSync(base).isFile()) return /\.(ts|tsx)$/.test(base) ? base : null
  for (const ext of EXTENSIONS) if (existsSync(base + ext)) return base + ext
  return undefined // unresolved
}

// Runtime imports only: `import type` / `export type` can't create runtime cycles.
const IMPORT_RE =
  /(?:^|\n)\s*(import|export)\s+(type\s+)?(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g

const parse = file => {
  const out = []
  for (const m of readFileSync(file, "utf8").matchAll(IMPORT_RE)) {
    const spec = m[3] ?? m[4]
    out.push({ spec, typeOnly: Boolean(m[2]) })
  }
  return out
}

const area = file => {
  const parts = relative(SRC, file).split(sep)
  if (parts[0] === "features") return { layer: "features", feature: parts[1] }
  return { layer: parts[0] }
}
const isTest = file => /[\\/](tests|test)[\\/]/.test(relative(SRC, file))
const isFeatureEntry = file => /^features[\\/][^\\/]+[\\/]index\.tsx?$/.test(relative(SRC, file))

const files = walk(SRC)
const graph = new Map()
const problems = []

for (const file of files) {
  const from = area(file)
  const edges = []
  for (const { spec, typeOnly } of parse(file)) {
    const target = resolveImport(file, spec)
    if (target === null) continue
    if (target === undefined) {
      problems.push(`unresolved import "${spec}" in ${relative(SRC, file)}`)
      continue
    }
    const to = area(target)
    const where = `${relative(SRC, file)} -> ${relative(SRC, target)}`
    if (from.layer === "shared" && (to.layer === "features" || to.layer === "app"))
      problems.push(`shared must not import ${to.layer}: ${where}`)
    if (from.layer === "features" && !isTest(file)) {
      if (to.layer === "app") problems.push(`feature must not import app: ${where}`)
      if (to.layer === "features" && to.feature !== from.feature && !isFeatureEntry(target))
        problems.push(`cross-feature import must use the public index.ts: ${where}`)
    }
    if (!typeOnly) edges.push(target)
  }
  graph.set(file, edges)
}

// Cycle detection (iterative DFS with colors).
const state = new Map()
const seenCycles = new Set()
for (const start of files) {
  if (state.get(start)) continue
  const stack = [[start, 0]]
  const path = []
  while (stack.length) {
    const frame = stack[stack.length - 1]
    const [node, i] = frame
    if (i === 0) {
      state.set(node, 1)
      path.push(node)
    }
    const next = (graph.get(node) ?? [])[i]
    if (next === undefined) {
      state.set(node, 2)
      path.pop()
      stack.pop()
      continue
    }
    frame[1]++
    if (state.get(next) === 1) {
      const cycle = path.slice(path.indexOf(next)).map(f => relative(SRC, f))
      const key = [...cycle].sort().join("|")
      if (!seenCycles.has(key)) {
        seenCycles.add(key)
        problems.push(`import cycle: ${[...cycle, cycle[0]].join(" -> ")}`)
      }
    } else if (!state.get(next)) {
      stack.push([next, 0])
    }
  }
}

if (problems.length) {
  console.error(`Architecture check failed (${problems.length}):\n- ${problems.join("\n- ")}`)
  process.exit(1)
}
console.log(`Architecture check passed: ${files.length} modules, no boundary violations or cycles.`)
