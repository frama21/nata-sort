import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import jsdoc from "eslint-plugin-jsdoc"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist", "src/components/ui"]),
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
  }
])
