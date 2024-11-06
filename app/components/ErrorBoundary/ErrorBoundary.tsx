"use client";
import { Alert } from "antd";
import React from "react";
import { logError } from "@/app/utils/logger";

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // logError(error.message, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <Alert message={<b>Something went wrong.</b>} description={this.state.errorMessage} type="error" showIcon />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
