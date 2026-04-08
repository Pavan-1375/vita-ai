import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected runtime error',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="max-w-lg w-full rounded-2xl border border-destructive/20 bg-white p-6 shadow-lg">
            <h1 className="text-xl font-bold text-destructive mb-2">App crashed while rendering</h1>
            <p className="text-sm text-on-surface-variant mb-4">
              This usually happens due to corrupted local data or a runtime bug. Reload once. If it repeats, share this message.
            </p>
            <pre className="text-xs bg-surface-container-low rounded-lg p-3 overflow-auto text-on-surface-variant whitespace-pre-wrap">
              {this.state.errorMessage}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
