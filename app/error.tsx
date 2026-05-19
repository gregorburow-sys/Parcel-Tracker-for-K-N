"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center"
    >
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-base text-gray-400">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="bg-white px-4 py-2 text-black hover:bg-slate-200"
      >
        Try again
      </button>
    </div>
  );
}
