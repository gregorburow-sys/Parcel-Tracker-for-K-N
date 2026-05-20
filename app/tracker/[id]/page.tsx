"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { Query, type Models } from "appwrite";
import { client, databases } from "@/lib/appwrite";
import { config } from "@/lib/config";
import { formatStatus, statusColor } from "@/lib/status";
import type { DisplayEvent, Parcel, ParcelEvent } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TrackerPage({ params }: PageProps) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);

  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadParcel = useCallback(async () => {
    try {
      const doc = await databases.getDocument<Parcel>(
        config.appwriteDatabaseId,
        config.appwriteParcelsCollectionId,
        id,
      );
      setParcel(doc);
    } catch (err) {
      setParcel(null);
      setError(
        err instanceof Error ? err.message : "Could not load parcel details.",
      );
    }
  }, [id]);

  const loadEvents = useCallback(async () => {
    try {
      const response = await databases.listDocuments<ParcelEvent>(
        config.appwriteDatabaseId,
        config.appwriteParcelEventsCollectionId,
        [Query.equal("parcelId", id), Query.orderAsc("$createdAt")],
      );
      const data: DisplayEvent[] = response.documents.map((doc) => ({
        id: doc.$id,
        status: doc.status,
        occurredAt: new Date(doc.$createdAt).toLocaleString(),
        bgColor: statusColor(doc.status),
      }));
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load parcel events.",
      );
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      await Promise.all([loadParcel(), loadEvents()]);
      if (!cancelled) setIsLoading(false);
    })();

    const channel = `databases.${config.appwriteDatabaseId}.collections.${config.appwriteParcelEventsCollectionId}.documents`;
    const unsubscribe = client.subscribe<Models.Document>(channel, (event) => {
      const payload = event.payload as Partial<ParcelEvent>;
      if (payload.parcelId === id) {
        void loadEvents();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [id, loadParcel, loadEvents]);

  const parcelName = parcel?.["parcel-name"];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Parcel Information</h1>
        {parcelName ? (
          <p className="mt-2 text-lg sm:text-xl">
            <span className="font-medium">Parcel Name:</span> {parcelName}
          </p>
        ) : null}
        <p className="text-lg sm:text-xl">
          <span className="font-medium">Parcel No:</span> {id}
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Loading parcel history…
        </p>
      ) : events.length === 0 ? (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          No events have been recorded for this parcel yet.
        </p>
      ) : (
        <ol role="list" className="-mb-8">
          {events.map((event, idx) => (
            <li key={event.id}>
              <div className="relative pb-8">
                {idx !== events.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-700"
                  />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  <span
                    className={`${event.bgColor} flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white dark:ring-slate-950`}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <p className="pl-1 text-base text-slate-700 dark:text-slate-200">
                      {formatStatus(event.status)}
                    </p>
                    <time className="whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">
                      {event.occurredAt}
                    </time>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-block rounded-md border border-slate-300 px-6 py-3 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
        >
          ← Back to search
        </Link>
      </div>
    </main>
  );
}
