import * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

// Built on the native <dialog> element: showModal() provides the top layer,
// focus containment, an inert background, Escape to close, and focus return to
// the opener, so none of that is reimplemented here.

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  titleId: string
  descriptionId: string
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

const useDialog = (): DialogContextValue => {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("Dialog components must be used inside <Dialog>")
  return context
}

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Dialog root. Controlled with `open`/`onOpenChange`, or uncontrolled. */
function Dialog({ children, open, defaultOpen = false, onOpenChange }: DialogProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen)
  const id = React.useId()
  const current = open ?? uncontrolled

  const context = React.useMemo<DialogContextValue>(
    () => ({
      open: current,
      setOpen: next => {
        if (open === undefined) setUncontrolled(next)
        onOpenChange?.(next)
      },
      titleId: `${id}-title`,
      descriptionId: `${id}-description`
    }),
    [current, open, onOpenChange, id]
  )

  return <DialogContext.Provider value={context}>{children}</DialogContext.Provider>
}

/** A button that opens the dialog. Style it like any button (e.g. with `buttonVariants`). */
function DialogTrigger({ onClick, ...props }: React.ComponentProps<"button">) {
  const dialog = useDialog()
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={dialog.open}
      data-slot="dialog-trigger"
      onClick={e => {
        onClick?.(e)
        dialog.setOpen(true)
      }}
      {...props}
    />
  )
}

/** A button that closes the dialog. */
function DialogClose({ onClick, ...props }: React.ComponentProps<"button">) {
  const dialog = useDialog()
  return (
    <button
      type="button"
      data-slot="dialog-close"
      onClick={e => {
        onClick?.(e)
        dialog.setOpen(false)
      }}
      {...props}
    />
  )
}

/** The modal itself. Closes on Escape, on a backdrop click, or via the close button. */
function DialogContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const dialog = useDialog()
  const ref = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (dialog.open && !el.open) el.showModal()
    if (!dialog.open && el.open) el.close()
  }, [dialog.open])

  return (
    <dialog
      ref={ref}
      data-slot="dialog"
      aria-labelledby={dialog.titleId}
      aria-describedby={dialog.descriptionId}
      // Escape and form[method=dialog] close the element natively; sync our state.
      onClose={() => dialog.open && dialog.setOpen(false)}
      // The inner panel fills the dialog, so a click that lands on the <dialog>
      // itself can only be on the backdrop.
      onClick={e => e.target === e.currentTarget && dialog.setOpen(false)}
      className="m-auto w-full max-w-[calc(100%-2rem)] rounded-xl border bg-background p-0 text-foreground shadow-lg backdrop:bg-black/50 open:animate-in open:fade-in-0 open:zoom-in-95 sm:max-w-lg"
    >
      <div data-slot="dialog-content" className={cn("relative grid gap-4 p-6", className)} {...props}>
        {children}
        <DialogClose className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
          <XIcon />
          <span className="sr-only">Tutup</span>
        </DialogClose>
      </div>
    </dialog>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

/** The dialog's accessible name. */
function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  const dialog = useDialog()
  return (
    <h2
      id={dialog.titleId}
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

/** The dialog's accessible description. */
function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  const dialog = useDialog()
  return (
    <p
      id={dialog.descriptionId}
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
}
