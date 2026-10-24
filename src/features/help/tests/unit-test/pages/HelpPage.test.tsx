import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HelpPage } from "../../../pages/HelpPage"

describe("HelpPage", () => {
  it("renders the help topics under one page heading", () => {
    render(<HelpPage />)
    expect(screen.getByRole("heading", { level: 2, name: "Bantuan" })).toBeInTheDocument()
    const topics = screen.getAllByRole("heading", { level: 3 }).map(h => h.textContent)
    expect(topics).toEqual([
      "Privasi",
      "Persyaratan browser",
      "Penyimpanan progres",
      "Keamanan file",
      "Pintasan keyboard"
    ])
  })

  it("names the state file the sorter actually writes", () => {
    render(<HelpPage />)
    expect(screen.getByText(/nata-sort-db\.json/)).toBeInTheDocument()
  })
})
