import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HelpPage } from "../../../pages/HelpPage"

describe("HelpPage", () => {
  it("renders the help topics under one page heading", () => {
    render(<HelpPage />)
    expect(screen.getByRole("heading", { level: 2, name: "Help" })).toBeInTheDocument()
    const topics = screen.getAllByRole("heading", { level: 3 }).map(h => h.textContent)
    expect(topics).toEqual([
      "Privacy",
      "Browser requirements",
      "Saving progress",
      "File safety",
      "Keyboard shortcuts"
    ])
  })

  it("names the state file the sorter actually writes", () => {
    render(<HelpPage />)
    expect(screen.getByText(/nata-photo-db\.json/)).toBeInTheDocument()
  })
})
