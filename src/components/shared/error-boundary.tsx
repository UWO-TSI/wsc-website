'use client';

import React from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import Button from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * ErrorBoundary: catches RENDER-TIME React errors only.
 *
 * Does NOT catch: async errors, event handler errors, or errors
 * inside setTimeout/Promise callbacks. Those are handled by
 * useSupabaseQuery/useSupabaseMutation and classifyError().
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-page px-6 text-center">
          <h2 className="title-sm">This section did not load</h2>
          <p className="body measure text-ink-muted">
            Something broke while rendering it. Try again, and if it keeps
            happening the page needs a reload.
          </p>
          <Button variant="secondary" onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
