"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useParcelTracking } from "@/hooks/useParcelTracking";

export default function SearchForm() {
  const router = useRouter();
  const { fetchParcel } = useParcelTracking();
  const [trackingId, setTrackingId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = trackingId.trim();
    if (!id) {
      setError("Please enter a tracking number.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await fetchParcel(id);
      router.push(`/tracker/${encodeURIComponent(id)}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to look up that parcel.";
      setError(message);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="text-lg">
        Loading…
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col items-center gap-2 lg:w-1/2"
    >
      <div className="flex w-full flex-row">
        <input
          type="text"
          value={trackingId}
          onChange={(event) => setTrackingId(event.target.value)}
          placeholder="Enter your parcel's tracking number"
          aria-label="Parcel tracking number"
          className="h-14 w-full px-4 text-black"
        />
        <button
          type="submit"
          className="flex h-14 w-[12rem] items-center justify-center bg-white px-4 text-black hover:bg-slate-200"
        >
          Track Parcel
        </button>
      </div>
      {error ? (
        <p role="alert" className="w-full text-left text-red-400">
          {error}
        </p>
      ) : null}
    </form>
  );
}
