import "@testing-library/jest-dom/vitest"
import "@/shared/i18n" // real English strings, so tests assert what users see
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// jsdom has <dialog> but not showModal()/close(); stub the minimum for components that open dialogs.
const dialogProto = HTMLDialogElement.prototype
dialogProto.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute("open", "")
}
dialogProto.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute("open")
  this.dispatchEvent(new Event("close"))
}

afterEach(() => {
  cleanup()
})
