"use client";

import { useCallback, useEffect, useState } from "react";
import { AppwriteException } from "appwrite";
import { databases } from "@/lib/appwrite";
import config from "@/lib/config";
import type { Parcel, ParcelDocument } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

interface UseParcelTrackingState {
  parcel: Parcel | null;
  status: Status;
  error: string | null;
}

function toParcel(doc: ParcelDocument): Parcel {
  return {
    ...doc,
    name: doc["parcel-name"],
  };
}

export function useParcelTracking(trackingId?: string | null) {
  const [state, setState] = useState<UseParcelTrackingState>({
    parcel: null,
    status: trackingId ? "loading" : "idle",
    error: null,
  });

  useEffect(() => {
    if (!trackingId) {
      setState({ parcel: null, status: "idle", error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading", error: null }));

    databases
      .getDocument<ParcelDocument>(
        config.appwriteDatabaseID,
        config.appwriteParcelsID,
        trackingId,
      )
      .then((doc) => {
        if (cancelled) return;
        setState({ parcel: toParcel(doc), status: "success", error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof AppwriteException || err instanceof Error
            ? err.message
            : "Unable to load parcel details.";
        setState({ parcel: null, status: "error", error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [trackingId]);

  const fetchParcel = useCallback(
    async (id: string): Promise<Parcel> => {
      const doc = await databases.getDocument<ParcelDocument>(
        config.appwriteDatabaseID,
        config.appwriteParcelsID,
        id,
      );
      return toParcel(doc);
    },
    [],
  );

  return { ...state, fetchParcel };
}
