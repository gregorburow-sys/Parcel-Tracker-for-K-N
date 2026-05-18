import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useState } from "react";
import config from "../utils/config";
import { useRouter } from "next/router";
import appwrite from "../utils/appwrite-connection";

export default function Home() {
  const [isLoading, setLoading] = useState(false);
  const [parcelID, setParcelID] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const getParcelDetails = async (trackingNo) => {
    const trimmed = (trackingNo || "").trim();
    if (!trimmed) {
      setError("Please enter a tracking number.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await appwrite.database.getDocument(
        config.appwriteDatabaseID,
        config.appwriteParcelsID,
        trimmed
      );
      router.push({
        pathname: "/tracker",
        query: { id: trimmed },
      });
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to find parcel with that tracking number.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    getParcelDetails(parcelID);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Debby&apos;s Parcel Tracker</title>
        <meta name="description" content="Parcel Tracking App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className="md:text-[2rem] text-[1.8rem] mb-2 text-center font-bold">
          🛳️ Debby&apos;s Parcel Tracking App
        </h1>
        {!isLoading ? (
          <form onSubmit={handleSubmit} className="w-full lg:w-1/2">
            <div className="flex flex-row w-full">
              <input
                type="text"
                className="w-full px-4 h-14"
                value={parcelID}
                onChange={(e) => setParcelID(e.target.value)}
                placeholder="Enter your parcel's tracking number"
                aria-label="Tracking number"
              />
              <button
                type="submit"
                className="w-[12rem] px-4 flex items-center justify-center bg-white text-black"
              >
                Track Parcel
              </button>
            </div>
            {error ? (
              <p role="alert" className="mt-4 text-red-500 text-center">
                {error}
              </p>
            ) : null}
          </form>
        ) : (
          <div
            role="status"
            aria-label="Loading"
            className="mt-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-transparent"
          />
        )}
      </main>
    </div>
  );
}
