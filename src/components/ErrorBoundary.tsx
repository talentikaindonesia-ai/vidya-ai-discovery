/**
 * ErrorBoundary — catches unhandled React render errors and shows a friendly
 * recovery UI instead of a blank page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourRoutes />
 *   </ErrorBoundary>
 *
 * To add Sentry later, call Sentry.captureException(error) inside componentDidCatch.
 */
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log to console for debugging
    console.error("[ErrorBoundary] Uncaught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

    // Auto-reload on stale chunk errors (happens after new deployment when
    // the browser tries to lazy-load a chunk whose filename has changed).
    const isChunkError =
      error.name === "ChunkLoadError" ||
      /loading (css )?chunk/i.test(error.message) ||
      /failed to fetch dynamically imported module/i.test(error.message) ||
      /error loading dynamically imported module/i.test(error.message);

    if (isChunkError) {
      // Reload once; avoid infinite loop by marking in sessionStorage
      const reloaded = sessionStorage.getItem("chunk_reload");
      if (!reloaded) {
        sessionStorage.setItem("chunk_reload", "1");
        window.location.reload();
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleHome = () => {
    this.handleReset();
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-lg w-full text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Oops! Ada yang tidak beres
              </h1>
              <p className="text-muted-foreground">
                Halaman mengalami kesalahan yang tidak terduga. Coba muat ulang
                atau kembali ke beranda.
              </p>
            </div>

            {/* Error details (dev only) */}
            {isDev && this.state.error && (
              <details className="text-left bg-muted rounded-lg p-4 text-xs font-mono overflow-auto max-h-48">
                <summary className="cursor-pointer font-semibold mb-2 text-destructive">
                  Error details (dev only)
                </summary>
                <pre className="whitespace-pre-wrap break-words text-destructive">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </Button>
              <Button onClick={this.handleHome} className="gap-2">
                <Home className="w-4 h-4" />
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
