import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { BootSplash } from "@/shared/components/brand/BootSplash"

describe("BootSplash", () => {
  it("announces loading as a status and draws the mark over an indeterminate bar", () => {
    const { container } = render(<BootSplash />)

    expect(screen.getByRole("status")).toHaveTextContent("Loading page…")
    expect(container.querySelector("svg.boot-mark")).toBeInTheDocument()
    expect(container.querySelector(".boot-track > .boot-bar")).toBeInTheDocument()
  })

  it("does not repeat the static copy's delayed fade-in, so the handoff does not blink", () => {
    const { container } = render(<BootSplash />)

    expect(container.querySelector(".boot-html")).toBeNull()
  })
})
