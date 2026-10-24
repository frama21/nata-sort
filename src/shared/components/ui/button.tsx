import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent text-sm font-medium transition-[color,background-color,border-color,scale] duration-(--dur-base) ease-(--ease) outline-none select-none active:scale-[.97] disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 pointer-coarse:[&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        // The ONE primary action per screen.
        default: "bg-accent text-accent-foreground hover:bg-accent/90",
        secondary: "bg-surface-hover text-foreground hover:bg-surface-hover/80",
        ghost: "hover:bg-surface-hover hover:text-foreground aria-expanded:bg-surface-hover",
        outline: "border-border-strong bg-transparent hover:bg-surface-hover aria-expanded:bg-surface-hover",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-accent underline-offset-4 hover:underline"
      },
      size: {
        default: "h-8 px-3 pointer-coarse:h-11 pointer-coarse:px-4",
        xs: "h-6 px-2 text-xs pointer-coarse:h-9 pointer-coarse:px-2.5",
        sm: "h-7 px-2 text-xs pointer-coarse:h-10 pointer-coarse:px-3 pointer-coarse:text-sm",
        lg: "h-10 px-6 pointer-coarse:h-12",
        icon: "size-8 p-0 pointer-coarse:size-11",
        "icon-xs": "size-6 p-0 pointer-coarse:size-9",
        "icon-sm": "size-7 p-0 pointer-coarse:size-10",
        "icon-lg": "size-10 p-0 pointer-coarse:size-12"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner, sets `aria-busy` and ignores repeat clicks. */
    loading?: boolean
  }

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  onClick,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={loading ? undefined : onClick}
      {...props}
    >
      {loading && <Loader2Icon aria-hidden className="animate-spin" />}
      {children}
    </button>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
