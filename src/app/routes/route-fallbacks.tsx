import { Link, isRouteErrorResponse, useRouteError } from "react-router"
import { AlertTriangleIcon, MapPinOff } from "lucide-react"

import { Button, buttonVariants } from "@/shared/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/shared/components/ui/empty"
import { Spinner } from "@/shared/components/ui/spinner"

/** Shown while a lazy route module is loading. */
export const RouteLoading = () => (
  <div className="flex h-[60dvh] items-center justify-center" role="status" aria-live="polite">
    <Spinner />
    <span className="sr-only">Memuat halaman…</span>
  </div>
)

/** Catch-all for URLs no feature claims. */
export const NotFoundPage = () => (
  <Empty className="h-[70dvh]">
    <EmptyHeader>
      <EmptyMedia variant="icon" className="w-16 h-16 border-2">
        <MapPinOff className="size-10" />
      </EmptyMedia>
      <EmptyTitle>
        <h2>Halaman tidak ditemukan</h2>
      </EmptyTitle>
      <EmptyDescription>Alamat ini tidak tersedia di aplikasi.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent className="flex-row justify-center">
      <Link to="/" className={buttonVariants()}>
        Kembali ke beranda
      </Link>
    </EmptyContent>
  </Empty>
)

/**
 * Route-level error boundary: a render error or a failed lazy import in one
 * route is contained here, while the navbar and other routes keep working.
 */
export const RouteErrorBoundary = () => {
  const error = useRouteError()
  console.error("[route]", error)

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Halaman gagal dimuat."

  return (
    <Empty className="h-[70dvh]" role="alert">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="w-16 h-16 border-2">
          <AlertTriangleIcon className="size-10 text-red-500" />
        </EmptyMedia>
        <EmptyTitle>
          <h2>Halaman ini mengalami kesalahan</h2>
        </EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button onClick={() => location.reload()}>Muat ulang</Button>
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          Kembali ke beranda
        </Link>
      </EmptyContent>
    </Empty>
  )
}
