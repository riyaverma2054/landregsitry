import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  state: { hasError: boolean; message?: string } = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-rose-800/40 bg-rose-950/20 p-6">
            <div className="text-lg font-semibold">Something crashed in the UI</div>
            <div className="mt-2 text-sm text-slate-200">
              This usually happens due to an invalid contract address, wrong network, or a browser storage issue.
            </div>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3 font-mono text-xs text-slate-200">
              {this.state.message ?? "Unknown error"}
            </div>
            <div className="mt-4 text-sm text-slate-300">
              Fix the issue, then refresh the page. If you share this message, I can pinpoint the cause.
            </div>
          </div>
        </div>
      </div>
    );
  }
}

