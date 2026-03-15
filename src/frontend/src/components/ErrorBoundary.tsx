import { Component, type ReactNode } from "react";

interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: "" };

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : String(error);
    return { hasError: true, error: msg };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#c00" }}>Błąd aplikacji</h2>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 12,
              borderRadius: 8,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              fontSize: 13,
            }}
          >
            {this.state.error}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: "8px 20px",
              background: "#1d4ed8",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Odśwież
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
