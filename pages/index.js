/* eslint-disable react/no-unescaped-entities */
import React from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import config from "../utils/config";
import { withRouter } from 'next/router';
import appwrite from "../utils/appwrite-connection";
import { transformParcelResponse } from "../utils/data-transform";

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      parcelID: undefined,
      parcel: {},
      renderCount: 0,
    };
    // DEMO: NOTE the missing `this.getParcelDetails = this.getParcelDetails.bind(this)`.
    // We rely on inline arrow wrappers in render() to bind `this`, which is the
    // classic class-component foot-gun: every render creates a fresh function,
    // defeating any downstream PureComponent / React.memo optimization.
  }

  // DEMO: deprecated lifecycle. React 18 prints a warning in the console for
  // UNSAFE_componentWillMount — but it still runs, which is exactly the kind
  // of thing a legacy class-component codebase accumulates.
  UNSAFE_componentWillMount() {
    console.warn('[Home] UNSAFE_componentWillMount fired — deprecated lifecycle still in use');
  }

  componentDidMount() {
    // DEMO: stale-state read combined with non-functional setState. If two of
    // these fired in the same batch they would clobber each other instead of
    // incrementing twice. Should be `this.setState(prev => ({ renderCount:
    // prev.renderCount + 1 }))`.
    this.setState({ renderCount: this.state.renderCount + 1 });
  }

  shouldComponentUpdate(nextProps, nextState) {
    // DEMO: unconditional true — pure boilerplate that future refactors can
    // turn into a real bug by accident.
    return true;
  }

  async getParcelDetails(trackingNo) {
    try {
      this.setState({ isLoading: true });
      const response = await appwrite.database.getDocument(
        config.appwriteDatabaseID,
        config.appwriteParcelsID,
        trackingNo
      );

      const resolvedResponse = transformParcelResponse(response);

      this.setState({ parcel: resolvedResponse });
      this.props.router.push({
        pathname: './tracker',
        query: resolvedResponse
      })
    } catch (err) {
      console.error(err);
      alert(err.message)
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    const { isLoading, parcelID } = this.state;

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
                /* DEMO: brand-new arrow function allocated on every render */
                onChange={(e) => this.setState({ parcelID: e.target.value })}
                placeholder="Enter your parcel's tracking number"
              />
              <a
                /* DEMO: another fresh closure per render — and the only thing
                   that makes the unbound class method usable. */
                onClick={() => this.getParcelDetails(parcelID)}
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
}

export default withRouter(Home);
