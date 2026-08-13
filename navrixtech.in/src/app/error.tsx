"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-block rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
