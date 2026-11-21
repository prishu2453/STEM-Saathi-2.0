import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let displayMsg = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        displayMsg = `${parsed.error} (${parsed.operationType || 'operation'} on ${parsed.path || 'database'})`;
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, message: displayMsg };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Gyaan Graph ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F0FF] dark:bg-[#120A28] text-[#22163F] dark:text-[#E4DDFA] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-6 space-y-4 shadow-sm">
            <h1 className="text-lg font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">Workspace Recovery</h1>
            <p className="text-xs leading-relaxed text-[#4A3F66] dark:text-[#C9BFEA]">{this.state.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="rounded-lg bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5B21B6] cursor-pointer transition-colors"
            >
              Reload Gyaan Graph
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
