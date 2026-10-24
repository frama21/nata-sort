import { readdirSync } from "node:fs"
import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import jsdoc from "eslint-plugin-jsdoc"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

// Module boundaries (see README "Import boundaries"). One block per feature folder,
// read from disk, so adding or deleting a feature needs no edit here.
// `pnpm check:architecture` additionally catches relative-path escapes and cycles.
const features = readdirSync("src/features", { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)

const restrict = patterns => ({ "no-restricted-imports": ["error", { patterns }] })

const noApp = {
  regex: "^@/app(/|$)",
  message: "Only app/ composes the application; features and shared must not import it."
}

const boundaryRules = [
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: restrict([noApp, { regex: "^@/features(/|$)", message: "shared/ must not depend on features/." }])
  },
  ...features.map(name => ({
    files: [`src/features/${name}/**/*.{ts,tsx}`],
    rules: restrict([
      noApp,
      {
        regex: `^@/features/(?!${name}(/|$))[^/]+/.+`,
        message: "Import another feature only through its public API: @/features/<name>."
      }
    ])
  }))
]

export default defineConfig([
  globalIgnores(["dist", "playwright-report", "test-results"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsdoc.configs["flat/recommended-typescript"]
    ],
    languageOptions: {
      globals: globals.browser
    },
    rules: {
      // Destructured props are already typed by TypeScript; documenting root0.x is noise.
      "jsdoc/require-param": ["warn", { checkDestructured: false, checkDestructuredRoots: false }]
    }
  },
  {
    // Component props are typed by TypeScript and components always return JSX.
    files: ["**/*.tsx"],
    rules: { "jsdoc/require-param": "off", "jsdoc/require-returns": "off" }
  },
  {
    // Thin presentational wrappers (CardHeader, ItemTitle, …) don't need a doc
    // block each; the behavioral primitives (Dialog, Tabs, …) still have one.
    files: ["src/shared/components/ui/**"],
    rules: { "jsdoc/require-jsdoc": "off" }
  },
  {
    // Tests and test doubles document themselves through test names.
    files: ["src/test/**", "src/**/tests/**", "*.config.ts"],
    rules: { "jsdoc/require-jsdoc": "off", "jsdoc/require-param": "off", "jsdoc/require-returns": "off" }
  },
  ...boundaryRules
])
