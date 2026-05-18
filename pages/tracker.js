import { useEffect, useState } from "react";
import appwrite from "../utils/appwrite-connection";
import config from "../utils/config";
import { Query } from "appwrite";
import { useRouter } from "next/router";
import Link from "next/link";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Tracker() {
  const [notifications, setNotifications] = useState([]);
  const [parcelData, setParcelData] = useState(null);
  const [error, setError] = useState("");

  const router = useRouter();
  const parcelId = router.query.id;

  useEffect(() => {
    if (!router.isReady) return undefined;
    if (!parcelId) {
      setError("No tracking number provided.");
      return undefined;
    }

    let cancelled = false;

    const getParcelDetails = async (id) => {
      try {
        const response = await appwrite.database.getDocument(
          config.appwriteDatabaseID,
          config.appwriteParcelsID,
          id
        );
        if (cancelled) return;
        setParcelData({ ...response, name: response["parcel-name"] });
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load parcel details.");
      }
    };

    const getParcelEvents = async (parcelNo) => {
      try {
        const response = await appwrite.database.listDocuments(
          config.appwriteDatabaseID,
          config.appwriteParcelEventsID,
          [Query.equal("parcelId", [parcelNo])]
        );
        const data = response.documents.map((document) => {
          const date = new Date(document.$updatedAt);
          return {
            ...document,
            bgColor: "bg-green-500",
            datetime: date.toLocaleString(),
          };
        });
        if (!cancelled) setNotifications(data);
      } catch (err) {
        console.error(err);
      }
    };

    const registerSubscriber = (id) => {
      try {
        return appwrite.client.subscribe("documents", () => {
          getParcelEvents(id);
        });
      } catch (err) {
        console.error(err, "error");
        return null;
      }
    };

    getParcelDetails(parcelId);
    getParcelEvents(parcelId);
    const unsubscribe = registerSubscriber(parcelId);

    return () => {
      cancelled = true;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [router.isReady, parcelId]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div>
        <div className="mb-4 text-center">
          <h1 className="text-[3rem] font-bold">Parcel Information</h1>
          {error ? (
            <p role="alert" className="text-red-500">
              {error}
            </p>
          ) : (
            <>
              <h2 className="text-[1.8rem] font-medium">
                Parcel Name: {parcelData?.name}
              </h2>
              <h2 className="text-[1.8rem] font-medium mb-4">
                Parcel No: {parcelData?.$id}
              </h2>
            </>
          )}
        </div>

        <div className="flow-root">
          <ul role="list" className="mt-4 -mb-8">
            {notifications?.map((event, eventIdx) => (
              <li key={event.$id}>
                <div className="relative pb-8">
                  {eventIdx !== notifications.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={classNames(
                          event.bgColor,
                          "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white"
                        )}
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="pl-5 text-lg text-gray-500">
                          {event.status}
                        </p>
                      </div>
                      <div className="text-lg text-right text-gray-500 whitespace-nowrap">
                        <p>{event.datetime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-20 flex w-full justify-center">
            <Link
              href="/"
              className="inline-block rounded border border-gray-300 bg-white px-6 py-3 text-black transition-colors hover:bg-slate-200"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
