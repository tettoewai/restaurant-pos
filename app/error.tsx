"use client";

import { useEffect } from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { DangerTriangle } from "@solar-icons/react/ssr";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Application error:", error);
    }

    // In production, send to error tracking service
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardBody className="text-center space-y-4">
          <div className="flex justify-center">
            <DangerTriangle className="w-16 h-16 text-danger" />
          </div>
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-gray-600">
            {error.message || "An unexpected error occurred"}
          </p>
          <div className="flex gap-2">
            <Button color="primary" onPress={reset} className="flex-1">
              Try Again
            </Button>
            <Button
              variant="light"
              onPress={() => (window.location.href = "/")}
              className="flex-1"
            >
              Go to Home
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
