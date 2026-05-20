"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { databases } from "@/lib/appwrite";
import { config } from "@/lib/config";

export default function HomePage() {
  const router = useRouter();
  const [trackingNo, setTrackingNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const id = trackingNo.trim();
    if (!id) {
      setError("Please enter a tracking number.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Verify the parcel exists before navigating, so the tracker page never
      // renders for an unknown ID. We don't pass any document data through the
      // URL — only the ID is part of the route; the tracker page refetches.
      await databases.getDocument(
        config.appwriteDatabaseId,
        config.appwriteParcelsCollectionId,
        id,
      );
      router.push(`/tracker/${encodeURIComponent(id)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not find parcel "${id}": ${err.message}`
          : `Could not find parcel "${id}".`,
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16">
      <h1 className="text-center text-3xl font-bold sm:text-4xl">
        Parcel Tracking App
      </h1>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Enter your tracking number to see the live status of your shipment.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 sm:flex-row"
        noValidate
      >
        <label htmlFor="tracking-no" className="sr-only">
          Tracking number
        </label>
        <input
          id="tracking-no"
          name="trackingNo"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoFocus
          value={trackingNo}
          onChange={(e) => setTrackingNo(e.target.value)}
          placeholder="Enter your tracking number"
          aria-invalid={error !== null}
          aria-describedby={error ? "tracking-no-error" : undefined}
          className="h-14 flex-1 rounded-md border border-slate-300 bg-white px-4 text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={isSubmitting || trackingNo.trim() === ""}
          className="h-14 rounded-md bg-slate-900 px-6 font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          {isSubmitting ? "Searching…" : "Track Parcel"}
        </button>
      </form>

      {error ? (
        <p
          id="tracking-no-error"
          role="alert"
          className="w-full rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      ) : null}
    </main>
  );
}
