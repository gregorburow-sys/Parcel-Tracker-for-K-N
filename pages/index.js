/* eslint-disable react/no-unescaped-entities */
import React from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import config from "../utils/config";
import { withRouter } from 'next/router';
import appwrite from "../utils/appwrite-connection";
import { validateParcelId } from "../utils/validation";
import logger from "../utils/logger";

const DEBOUNCE_MS = 300;

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      parcelID: "",
      parcel: {},
      validationError: null,
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleTrackClick = this.handleTrackClick.bind(this);
    this.getParcelDetails = this.getParcelDetails.bind(this);

    this.debounceTimer = null;
    this.inFlightId = null;
    this.isUnmounted = false;
  }

  componentWillUnmount() {
    this.isUnmounted = true;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  handleInputChange(e) {
    const raw = e.target.value;
    this.setState({ parcelID: raw });

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const result = validateParcelId(raw);
      if (this.isUnmounted) return;
      this.setState({ validationError: result.valid ? null : result.error });
    }, DEBOUNCE_MS);
  }

  handleTrackClick() {
    const { parcelID } = this.state;
    const result = validateParcelId(parcelID);
    if (!result.valid) {
      this.setState({ validationError: result.error });
      return;
    }
    if (this.inFlightId === result.value) return;
    this.setState({ validationError: null });
    this.getParcelDetails(result.value);
  }

  async getParcelDetails(trackingNo) {
    this.inFlightId = trackingNo;
    try {
      this.setState({ isLoading: true });
      const response = await appwrite.database.getDocument(
        config.appwriteDatabaseID,
        config.appwriteParcelsID,
        trackingNo
      );

      if (this.isUnmounted) return;

      const resolvedResponse = {
        ...(response || {}),
        name: response["parcel-name"]
      };

      this.setState({ parcel: resolvedResponse });
      this.props.router.push({
        pathname: './tracker',
        query: resolvedResponse
      })
    } catch (err) {
      logger.error("parcel_lookup_failed", {
        message: err && err.message,
        code: err && err.code,
      });
      if (!this.isUnmounted) {
        this.setState({ validationError: err && err.message ? err.message : "Lookup failed." });
      }
    } finally {
      if (!this.isUnmounted) {
        this.setState({ isLoading: false });
      }
      if (this.inFlightId === trackingNo) this.inFlightId = null;
    }
  }

  render() {
    const { isLoading, parcelID, validationError } = this.state;

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
            <div className="flex flex-col w-full lg:w-1/2">
              <div className="flex flex-row w-full">
                <input
                  type="text"
                  className="w-full px-4 h-14"
                  value={parcelID}
                  onChange={this.handleInputChange}
                  placeholder="Enter your parcel's tracking number"
                  aria-invalid={Boolean(validationError)}
                  aria-describedby="parcel-id-error"
                  maxLength={20}
                />
                <a
                  onClick={this.handleTrackClick}
                  className="w-[12rem] px-4 flex items-center justify-center bg-white text-black"
                >
                  Track Parcel
                </a>
              </div>
              {validationError ? (
                <p id="parcel-id-error" className="mt-2 text-sm text-red-500" role="alert">
                  {validationError}
                </p>
              ) : null}
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
}

export default withRouter(Home);
