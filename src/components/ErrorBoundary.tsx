import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: any;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("[ErrorBoundary] Captured error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-lg border p-6 space-y-3">
            <h1 className="text-xl font-semibold">Ocorreu um erro ao carregar a página</h1>
            <p className="text-sm opacity-80">Tente atualizar a página ou abrir o link novamente. Se persistir, envie o log abaixo ao suporte.</p>
            <pre className="text-xs overflow-auto max-h-40 bg-black/5 p-2 rounded">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
