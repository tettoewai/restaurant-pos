"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { DangerTriangle } from "@solar-icons/react/ssr";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    
    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-md w-full">
            <CardBody className="text-center space-y-4">
              <div className="flex justify-center">
                <DangerTriangle className="w-16 h-16 text-danger" />
              </div>
              <h2 className="text-xl font-bold">Something went wrong</h2>
              <p className="text-gray-600">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <Button
                color="primary"
                onPress={this.handleReset}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                variant="light"
                onPress={() => window.location.href = "/"}
                className="w-full"
              >
                Go to Home
              </Button>
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

