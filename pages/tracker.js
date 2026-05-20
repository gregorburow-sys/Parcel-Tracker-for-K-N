import React from 'react';
import appwrite from '../utils/appwrite-connection'
import config from '../utils/config';
import { Query } from "appwrite";
import { withRouter } from "next/router";
import Link from 'next/link';
import logger from '../utils/logger';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

class Tracker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      notifications: [],
      parcelData: undefined,
    };
    this.getParcelEvents = this.getParcelEvents.bind(this);
    this.registerSubcriber = this.registerSubcriber.bind(this);
    this.unsubscribe = null;
    this.isUnmounted = false;
  }

  async getParcelEvents(parcelNo) {
    if (!parcelNo) return;
    try {
      const response = await appwrite.database.listDocuments(
        config.appwriteDatabaseID,
        config.appwriteParcelEventsID,
        [ Query.equal('parcelId', [parcelNo]) ]
      );
      if (this.isUnmounted) return;
      const data = response.documents.map((document) => {
        const date = new Date(document.$updatedAt);
        return {
          ...document,
          bgColor: "bg-green-500",
          datetime: date.toLocaleString()
        }
      });
      this.setState({ notifications: data });
    } catch (error) {
      logger.error("parcel_events_failed", {
        parcelNo,
        message: error && error.message,
      });
    }
  }

  componentDidMount() {
    const { router } = this.props;
    const query = router.query || {};
    this.setState({ parcelData: query });
    if (query.$id) {
      this.getParcelEvents(query.$id);
      this.registerSubcriber();
    }
  }

  componentDidUpdate(prevProps) {
    const prevId = prevProps.router?.query?.$id;
    const nextId = this.props.router?.query?.$id;
    if (prevId !== nextId) {
      this.setState({ parcelData: this.props.router.query });
      if (nextId) this.getParcelEvents(nextId);
    }
  }

  registerSubcriber() {
    try {
      const handle = appwrite.client.subscribe('documents', (response) => {
        if (this.isUnmounted) return;
        const { parcelData } = this.state;
        if (parcelData?.$id) this.getParcelEvents(parcelData.$id);
      });
      this.unsubscribe = typeof handle === 'function' ? handle : null;
    } catch (error) {
      logger.error("parcel_subscribe_failed", { message: error && error.message });
    }
  }

  componentWillUnmount() {
    this.isUnmounted = true;
    if (typeof this.unsubscribe === 'function') {
      try {
        this.unsubscribe();
      } catch (error) {
        logger.warn("parcel_unsubscribe_failed", { message: error && error.message });
      }
      this.unsubscribe = null;
    }
  }

  render() {
    const { notifications, parcelData } = this.state;

    return <>
    <div className='flex items-center justify-center h-screen'>
      <div>
        <div className='mb-4 text-center'>
          <h1 className='text-[3rem] font-bold'>Parcel Information</h1>
          <h2 className='text-[1.8rem] font-medium'>Parcel Name: {parcelData?.name}</h2>
          <h2 className='text-[1.8rem] font-medium mb-4'>Parcel No: {parcelData?.$id}</h2>
        </div>


        <div className="flow-root ">
          <ul role="list" className="mt-4 -mb-8">
            {notifications?.map((event, eventIdx) => (
              <li key={event.$id}>
                <div className="relative pb-8">
                  {eventIdx !== notifications.length - 1 ? (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={classNames(
                          event.bgColor,
                          'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white'
                        )}
                      >

                      </span>
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
          <div className='mt-20 w-full p-4 text-center hover:bg-slate-200 !bg-white text-black'>
            <Link href="./" className='w-full p-4 !bg-white text-color-black'>Home</Link>
          </div>
        </div>
      </div>
    </div>
    </>
  }
}

export default withRouter(Tracker);
