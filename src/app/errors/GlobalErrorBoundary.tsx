import { Component, type ErrorInfo, type ReactNode } from "react"

import { Button } from "@/shared/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/shared/components/ui/empty"
import { AlertTriangleIcon } from "lucide-react"
import { t } from "@/shared/i18n"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Last-resort boundary around the whole app (providers and router included).
 * Route errors are caught earlier by RouteErrorBoundary; this one catches the
 * rest so a failure never leaves a blank page.
 */
export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[GlobalErrorBoundary]", error, info.componentStack)
  }

  handleReset = () => this.setState({ error: null })

  override render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon" className="w-16 h-16 border-2">
                <AlertTriangleIcon className="size-10 text-destructive" />
              </EmptyMedia>
              <EmptyTitle>{t("error.title")}</EmptyTitle>
              <EmptyDescription>{this.state.error.message || t("error.description")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <Button onClick={this.handleReset}>{t("error.retry")}</Button>
              <Button variant="outline" onClick={() => location.reload()}>
                {t("error.reload")}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      )
    }

    return this.props.children
  }
}
