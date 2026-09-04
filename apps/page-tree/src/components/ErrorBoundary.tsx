// src/components/ErrorBoundary.tsx
import React from "react";
import tokens from "@contentful/f36-tokens";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

/**
 * Last-resort error boundary. A crashed location renders a readable error
 * instead of a blank iframe, so problems are diagnosable in production.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("PageTree crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          padding: tokens.spacingM,
          fontFamily: tokens.fontStackPrimary,
          color: tokens.gray900,
        }}
      >
        <div
          style={{
            border: `1px solid ${tokens.red300}`,
            borderRadius: tokens.borderRadiusMedium,
            padding: tokens.spacingM,
            background: tokens.red100,
          }}
        >
          <strong>PageTree ran into an unexpected error.</strong>
          <p style={{ margin: `${tokens.spacingXs} 0` }}>
            Try reloading. If the problem persists, please report it with the
            details below.
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: tokens.fontStackMonospace,
              fontSize: tokens.fontSizeS,
              margin: 0,
              maxHeight: 300,
              overflow: "auto",
            }}
          >
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      </div>
    );
  }
}
