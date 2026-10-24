import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it } from "vitest"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/shared/components/ui/dialog"

// jsdom has <dialog> but not showModal()/close(); stub the minimum.
beforeAll(() => {
  const proto = HTMLDialogElement.prototype
  proto.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "")
  }
  proto.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open")
    this.dispatchEvent(new Event("close"))
  }
})

const renderDialog = () =>
  render(
    <Dialog>
      <DialogTrigger>Pintasan</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pintasan Keyboard</DialogTitle>
          <DialogDescription>Daftar pintasan.</DialogDescription>
        </DialogHeader>
        <p>Isi</p>
      </DialogContent>
    </Dialog>
  )

describe("Dialog", () => {
  it("opens from the trigger with an accessible name and description", async () => {
    const user = userEvent.setup()
    renderDialog()
    const trigger = screen.getByRole("button", { name: "Pintasan" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")

    await user.click(trigger)

    const dialog = screen.getByRole("dialog", { name: "Pintasan Keyboard" })
    expect(dialog).toHaveAttribute("open")
    expect(dialog).toHaveAccessibleDescription("Daftar pintasan.")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })

  it("closes with the close button", async () => {
    const user = userEvent.setup()
    renderDialog()
    await user.click(screen.getByRole("button", { name: "Pintasan" }))
    await user.click(screen.getByRole("button", { name: "Tutup" }))
    expect(screen.getByRole("button", { name: "Pintasan" })).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("closes on a backdrop click but not on a click inside the panel", async () => {
    const user = userEvent.setup()
    renderDialog()
    await user.click(screen.getByRole("button", { name: "Pintasan" }))
    const dialog = screen.getByRole("dialog")

    await user.click(screen.getByText("Isi"))
    expect(dialog).toHaveAttribute("open")

    fireEvent.click(dialog)
    expect(dialog).not.toHaveAttribute("open")
  })

  it("syncs state when the browser closes it (Escape)", async () => {
    const user = userEvent.setup()
    renderDialog()
    await user.click(screen.getByRole("button", { name: "Pintasan" }))
    // Native Escape handling ends in a "close" event on the element.
    fireEvent(screen.getByRole("dialog"), new Event("close"))
    expect(screen.getByRole("button", { name: "Pintasan" })).toHaveAttribute("aria-expanded", "false")
  })
})
