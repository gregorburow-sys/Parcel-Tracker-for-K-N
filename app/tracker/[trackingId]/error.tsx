"use client";

import Link from "next/link";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TrackerError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center"
    >
      <h1 className="text-2xl font-bold">Unable to load parcel</h1>
      <p className="max-w-md text-base text-gray-400">{error.message}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="bg-white px-4 py-2 text-black hover:bg-slate-200"
        >
          Try again
        </button>
        <Link
          href="/"
          className="bg-white px-4 py-2 text-black hover:bg-slate-200"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
