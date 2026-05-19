"use client";

import { useCallback, useEffect, useState } from "react";
import { AppwriteException, Query } from "appwrite";
import { client, databases } from "@/lib/appwrite";
import config from "@/lib/config";
import type { ParcelEvent, ParcelEventDocument } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

interface UseParcelEventsState {
  events: ParcelEvent[];
  status: Status;
  error: string | null;
}

function toEvent(doc: ParcelEventDocument): ParcelEvent {
  const date = new Date(doc.$updatedAt);
  return {
    ...doc,
    bgColor: "bg-green-500",
    datetime: date.toLocaleString(),
  };
}

export function useParcelEvents(parcelId?: string | null) {
  const [state, setState] = useState<UseParcelEventsState>({
    events: [],
    status: parcelId ? "loading" : "idle",
    error: null,
  });

  const fetchEvents = useCallback(async (id: string) => {
    try {
      const response = await databases.listDocuments<ParcelEventDocument>(
        config.appwriteDatabaseID,
        config.appwriteParcelEventsID,
        [Query.equal("parcelId", [id])],
      );
      setState({
        events: response.documents.map(toEvent),
        status: "success",
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof AppwriteException || err instanceof Error
          ? err.message
          : "Unable to load parcel events.";
      setState((prev) => ({ ...prev, status: "error", error: message }));
    }
  }, []);

  useEffect(() => {
    if (!parcelId) {
      setState({ events: [], status: "idle", error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading", error: null }));

    void fetchEvents(parcelId).then(() => {
      if (cancelled) {
        setState((prev) => prev);
      }
    });

    const channel = `databases.${config.appwriteDatabaseID}.collections.${config.appwriteParcelEventsID}.documents`;
    const unsubscribe = client.subscribe(channel, () => {
      if (!cancelled) void fetchEvents(parcelId);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [parcelId, fetchEvents]);

  return state;
}
