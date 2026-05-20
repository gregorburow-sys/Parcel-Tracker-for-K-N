"use client";

import Link from "next/link";
import { useParcelEvents } from "@/hooks/useParcelEvents";
import { useParcelTracking } from "@/hooks/useParcelTracking";

interface ParcelTrackerProps {
  trackingId: string;
}

function classNames(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function ParcelTracker({ trackingId }: ParcelTrackerProps) {
  const {
    parcel,
    status: parcelStatus,
    error: parcelError,
  } = useParcelTracking(trackingId);
  const {
    events,
    status: eventsStatus,
    error: eventsError,
  } = useParcelEvents(trackingId);

  if (parcelStatus === "loading") {
    return (
      <p role="status" aria-live="polite" className="text-lg">
        Loading parcel details…
      </p>
    );
  }

  if (parcelStatus === "error" || !parcel) {
    return (
      <div role="alert" className="text-center">
        <h1 className="mb-2 text-2xl font-bold">Parcel not found</h1>
        <p className="mb-4 text-base text-gray-400">
          {parcelError ?? `No parcel with tracking number "${trackingId}".`}
        </p>
        <Link
          href="/"
          className="inline-block bg-white px-4 py-2 text-black hover:bg-slate-200"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-center">
        <h1 className="text-[3rem] font-bold">Parcel Information</h1>
        <h2 className="text-[1.8rem] font-medium">
          Parcel Name: {parcel.name}
        </h2>
        <h2 className="mb-4 text-[1.8rem] font-medium">
          Parcel No: {parcel.$id}
        </h2>
      </div>

      <div className="flow-root">
        {eventsStatus === "loading" ? (
          <p role="status" aria-live="polite" className="text-center text-lg">
            Loading events…
          </p>
        ) : null}

        {eventsStatus === "error" ? (
          <p role="alert" className="text-center text-red-400">
            {eventsError ?? "Unable to load parcel events."}
          </p>
        ) : null}

        {eventsStatus === "success" && events.length === 0 ? (
          <p className="text-center text-gray-400">
            No tracking events yet for this parcel.
          </p>
        ) : null}

        <ul role="list" className="-mb-8 mt-4">
          {events.map((event, eventIdx) => (
            <li key={event.$id}>
              <div className="relative pb-8">
                {eventIdx !== events.length - 1 ? (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={classNames(
                        event.bgColor,
                        "flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white",
                      )}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="pl-5 text-lg text-gray-500">
                        {event.status}
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-lg text-gray-500">
                      <p>{event.datetime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-20 w-full p-4 text-center hover:bg-slate-200">
          <Link
            href="/"
            className="block w-full bg-white p-4 text-black hover:bg-slate-200"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
