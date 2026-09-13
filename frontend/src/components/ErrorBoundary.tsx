'use client';

/**
 * ErrorBoundary — обработка ошибок рендеринга в разделах приложения.
 */
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary поймал ошибку:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center"
          role="alert"
          data-testid="error-boundary"
        >
          <h2 className="mb-2 text-lg font-semibold text-red-800">Что-то пошло не так</h2>
          <p className="mb-4 text-sm text-red-700">
            {this.state.error?.message ?? 'Произошла непредвиденная ошибка.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}