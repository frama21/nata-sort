import "@testing-library/jest-dom/vitest"
import "@/shared/i18n" // real English strings, so tests assert what users see
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(() => {
  cleanup()
})
