import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  expanded: boolean;
  copyStatus: 'idle' | 'success' | 'failed';
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, expanded: false, copyStatus: 'idle' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null, expanded: false } as State;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log the error to an external service here
    this.setState({ error, errorInfo });
    // Example: send to logging endpoint
    try {
      // navigator.sendBeacon or fetch could be used here
    } catch (e) {
      // ignore
    }
  }

  copyError = async () => {
    const { error, errorInfo } = this.state;
    const text = JSON.stringify({ message: error?.message, stack: error?.stack, info: errorInfo?.componentStack }, null, 2);

    // Try modern clipboard API first
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        this.setState({ copyStatus: 'success' });
        window.setTimeout(() => this.setState({ copyStatus: 'idle' }), 2000);
        return;
      }
    } catch (e) {
      // fallthrough to fallback method
    }

    // Fallback: create a hidden textarea, select and copy
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      // Avoid scrolling to bottom
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(ta);

      if (copied) {
        this.setState({ copyStatus: 'success' });
        window.setTimeout(() => this.setState({ copyStatus: 'idle' }), 2000);
      } else {
        this.setState({ copyStatus: 'failed' });
        window.setTimeout(() => this.setState({ copyStatus: 'idle' }), 2000);
      }
    } catch (e) {
      this.setState({ copyStatus: 'failed' });
      window.setTimeout(() => this.setState({ copyStatus: 'idle' }), 2000);
    }
  };

  reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, expanded: false, copyStatus: 'idle' });
    try {
      window.location.href = '/';
    } catch (e) {
      // ignore
    }
  };

  renderFallback() {
    const { error, errorInfo, expanded } = this.state;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-slate-50 p-6">
        <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="h-36 w-36 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-extrabold shadow-lg">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="-mt-1">
                  <path d="M11 15h2v2h-2z" fill="currentColor" />
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-.55 0-1-.45-1-1v-1c0-.55.45-1 1-1s1 .45 1 1v1c0 .55-.45 1-1 1zm1-7h-2V7h2v4z" fill="white" />
                </svg>
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Oops — something unexpected happened</h1>
              <p className="mt-3 text-lg text-slate-600">We couldn't complete that action. It's not your fault — try returning home, or view the details to help us diagnose the issue.</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={this.reset}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-shadow shadow"
                >
                  Return Home
                </button>

                <button
                  onClick={() => this.setState({ expanded: !expanded })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                  {expanded ? 'Hide details' : 'Show details'}
                </button>

                <button
                  onClick={this.copyError}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1z" fill="currentColor" />
                    <path d="M20 5H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h12v14z" fill="currentColor" />
                  </svg>
                  Copy error
                </button>

                {this.state.copyStatus === 'success' && (
                  <span className="inline-block ml-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm">Copied!</span>
                )}

                {this.state.copyStatus === 'failed' && (
                  <span className="inline-block ml-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-sm">Could not copy</span>
                )}
              </div>

              {expanded && (
                <div className="mt-6 bg-slate-50 border border-slate-100 rounded-md p-4 overflow-auto max-h-72 text-sm text-slate-800">
                  <div className="mb-2 font-medium text-slate-700">Error</div>
                  <pre className="whitespace-pre-wrap break-words">{error?.message || '—'}</pre>
                  <div className="mt-3 font-medium text-slate-700">Stack</div>
                  <pre className="whitespace-pre-wrap text-xs text-slate-600">{error?.stack || errorInfo?.componentStack || '—'}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children as React.ReactElement;
  }
}
