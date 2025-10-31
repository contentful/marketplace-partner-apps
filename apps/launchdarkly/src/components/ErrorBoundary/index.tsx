import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Note } from '@contentful/f36-components';

interface ErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
  onError?: (error: Error) => void;
  showNotification?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.componentName}:`, error, errorInfo);
    
    // Note: Cannot use useSDK hook in class component
    // Notification should be handled by parent component
    
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Note variant="negative">
          An error occurred in the {this.props.componentName}. Please try refreshing the page.
        </Note>
      );
    }

    return this.props.children;
  }
} 