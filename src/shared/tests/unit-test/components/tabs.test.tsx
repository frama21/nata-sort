import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"

const renderTabs = (props: { value?: string; defaultValue?: string; onValueChange?: (v: string) => void }) =>
  render(
    <Tabs {...props}>
      <TabsList aria-label="Mode">
        <TabsTrigger value="copy">Copy</TabsTrigger>
        <TabsTrigger value="cut">Cut</TabsTrigger>
        <TabsTrigger value="off" disabled>
          Off
        </TabsTrigger>
      </TabsList>
      <TabsContent value="copy">Copy panel</TabsContent>
      <TabsContent value="cut">Cut panel</TabsContent>
    </Tabs>
  )

describe("Tabs", () => {
  it("exposes the tabs pattern with only the active panel rendered", () => {
    renderTabs({ defaultValue: "copy" })
    const copy = screen.getByRole("tab", { name: "Copy" })
    expect(screen.getByRole("tablist", { name: "Mode" })).toBeInTheDocument()
    expect(copy).toHaveAttribute("aria-selected", "true")
    expect(copy).toHaveAttribute("tabindex", "0")
    expect(screen.getByRole("tab", { name: "Cut" })).toHaveAttribute("tabindex", "-1")
    const panel = screen.getByRole("tabpanel")
    expect(panel).toHaveTextContent("Copy panel")
    expect(panel).toHaveAttribute("aria-labelledby", copy.id)
    expect(copy).toHaveAttribute("aria-controls", panel.id)
  })

  it("switches panels on click when uncontrolled", async () => {
    const user = userEvent.setup()
    renderTabs({ defaultValue: "copy" })
    await user.click(screen.getByRole("tab", { name: "Cut" }))
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Cut panel")
  })

  it("moves and activates with arrow keys, wrapping and skipping disabled tabs", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderTabs({ defaultValue: "copy", onValueChange })

    await user.click(screen.getByRole("tab", { name: "Copy" }))
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Cut" })).toHaveFocus()
    expect(onValueChange).toHaveBeenLastCalledWith("cut")

    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Copy" })).toHaveFocus()

    await user.keyboard("{End}")
    expect(screen.getByRole("tab", { name: "Cut" })).toHaveFocus()
  })

  it("follows the controlled value and only reports changes", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = renderTabs({ value: "copy", onValueChange })

    await user.click(screen.getByRole("tab", { name: "Cut" }))
    expect(onValueChange).toHaveBeenCalledWith("cut")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Copy panel")

    rerender(
      <Tabs value="cut" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="copy">Copy</TabsTrigger>
          <TabsTrigger value="cut">Cut</TabsTrigger>
        </TabsList>
        <TabsContent value="copy">Copy panel</TabsContent>
        <TabsContent value="cut">Cut panel</TabsContent>
      </Tabs>
    )
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Cut panel")
  })
})
