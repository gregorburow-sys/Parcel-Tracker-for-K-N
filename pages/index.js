/* eslint-disable react/no-unescaped-entities */
import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";
import config from "../utils/config";
import appwrite from "../utils/appwrite-connection";

function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [parcelID, setParcelID] = useState(undefined);
  const [parcel, setParcel] = useState({});
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount((prev) => prev + 1);
  }, []);

  const getParcelDetails = useCallback(
    async (trackingNo) => {
      try {
        setIsLoading(true);
        const response = await appwrite.database.getDocument(
          config.appwriteDatabaseID,
          config.appwriteParcelsID,
          trackingNo
        );

        const resolvedResponse = {
          ...(response || {}),
          name: response["parcel-name"],
        };

        setParcel(resolvedResponse);
        router.push({
          pathname: "./tracker",
          query: resolvedResponse,
        });
      } catch (err) {
        console.error(err);
        alert(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const handleParcelIDChange = useCallback((e) => {
    setParcelID(e.target.value);
  }, []);

  const handleTrackClick = useCallback(() => {
    getParcelDetails(parcelID);
  }, [getParcelDetails, parcelID]);

  return (
    <div className={styles.container}>
      <Head>
        <title> Debby's Parcel Tracker </title>
        <meta name="description" content="Parcel Tracking App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className="md:text-[2rem] text-[1.8rem] mb-2 text-center font-bold">
          🛳️ Debby's Parcel Tracking App
        </h1>
        {!isLoading ? (
          <div className="flex flex-row w-full lg:w-1/2">
            <input
              type="text"
              className="w-full px-4 h-14"
              onChange={handleParcelIDChange}
              placeholder="Enter your parcel's tracking number"
            />
            <a
              onClick={handleTrackClick}
              className="w-[12rem] px-4 flex items-center justify-center bg-white text-black"
            >
              Track Parcel
            </a>
          </div>
        ) : (
          <div>
            isLoading....
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
}

export default Home;
