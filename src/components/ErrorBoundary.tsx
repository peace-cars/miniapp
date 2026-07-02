import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
          <div className="max-w-md w-full bg-bg-secondary border border-border rounded-3xl p-8 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertCircle size={32} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Something went wrong</h1>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                We encountered an unexpected error. Our engineering team has been notified.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] text-white"
                style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg)' }}
              >
                <RefreshCw size={16} /> Reload Page
              </button>
              
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false })}
                className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <Home size={16} /> Go Home
              </Link>
            </div>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl overflow-x-auto text-left border border-red-100 dark:border-red-900/20">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
