import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FieldErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Field editor error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "16px", border: "1px solid #d3dce0", borderRadius: "4px" }}>
          <p style={{ color: "#d14343", marginBottom: "8px", fontWeight: 500 }}>Editor Error</p>
          <p style={{ color: "#5a657c", fontSize: "14px", marginBottom: "12px" }}>
            This field has corrupted data structure. Please clear the field content and try again.
          </p>
          <details style={{ fontSize: "12px", color: "#8091a5" }}>
            <summary style={{ cursor: "pointer", marginBottom: "8px" }}>Error details</summary>
            <pre
              style={{
                background: "#f7f9fc",
                padding: "8px",
                borderRadius: "4px",
                overflow: "auto",
              }}
            >
              {this.state.error?.message}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
