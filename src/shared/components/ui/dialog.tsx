import * as React from "react"
import { XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

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

const DIALOG_SIDES = {
  center:
    "m-auto max-w-[calc(100%-2rem)] rounded-lg open:animate-pop-in sm:max-w-lg max-sm:mb-0 max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-xl",
  // Drawer / sheet: the same native <dialog>, docked to an edge.
  left: "mr-auto ml-0 h-dvh max-h-dvh w-[280px] max-w-[85vw] rounded-none border-y-0 border-l-0 open:animate-slide-in-left",
  bottom:
    "mt-auto mb-0 max-h-[85dvh] max-w-full rounded-t-xl rounded-b-none border-b-0 open:animate-slide-in-bottom"
} as const

/** The modal itself. Closes on Escape, on a backdrop click, or via the close button. */
function DialogContent({
  className,
  children,
  dialogClassName,
  side = "center",
  ...props
}: React.ComponentProps<"div"> & {
  side?: keyof typeof DIALOG_SIDES
  /** Extra classes for the outer `<dialog>` (size, position); `className` styles the inner panel. */
  dialogClassName?: string
}) {
  const { t } = useTranslation()
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
      className={cn(
        "w-full border border-border bg-surface-raised p-0 text-foreground shadow-e2 backdrop:bg-black/50",
        DIALOG_SIDES[side],
        dialogClassName
      )}
    >
      <div data-slot="dialog-content" className={cn("relative grid gap-4 p-6", className)} {...props}>
        {children}
        <DialogClose className="absolute top-3 right-3 grid size-7 place-items-center rounded-md text-muted-foreground transition-colors duration-(--dur-base) hover:bg-surface-hover hover:text-foreground pointer-coarse:size-11 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
          <XIcon />
          <span className="sr-only">{t("common.close")}</span>
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
