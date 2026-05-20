import React from 'react';
import appwrite from '../utils/appwrite-connection'
import config from '../utils/config';
import { Query } from "appwrite";
import { withRouter } from "next/router";
import Link from 'next/link';
import { transformParcelEvents } from '../utils/data-transform';

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
    // DEMO: every method bound manually in the constructor — the verbose
    // boilerplate that motivated the move to arrow class properties / hooks.
    this.getParcelEvents = this.getParcelEvents.bind(this);
    this.registerSubcriber = this.registerSubcriber.bind(this);
    // DEMO: stash the subscription handle here but never call it in
    // componentWillUnmount — the textbook class-component memory leak.
    this.unsubscribe = null;
  }

  async getParcelEvents(parcelNo) {
    try {
      const response = await appwrite.database.listDocuments(
        config.appwriteDatabaseID,
        config.appwriteParcelEventsID,
        [ Query.equal('parcelId', [parcelNo]) ]
      );
      const data = transformParcelEvents(response.documents);
      this.setState({ notifications: data });
    } catch (error) {
      console.log(error);
    }
  }

  componentDidMount() {
    const { router } = this.props;
    // DEMO: duplicate router.query into local state. Adds a redundant render
    // and lets the two sources of truth drift — the kind of thing
    // `useRouter()` makes obvious because you would just read it directly.
    this.setState({ parcelData: router.query });
    // DEMO: stale read — uses router.query.$id immediately even though
    // parcelData hasn't been committed yet. Works here only by luck.
    this.getParcelEvents(router.query.$id);
    this.registerSubcriber();
  }

  // DEMO: deprecated lifecycle. React 18 logs a warning but still calls it,
  // and it overlaps awkwardly with componentDidMount + componentDidUpdate.
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.router?.query?.$id !== this.props.router?.query?.$id) {
      this.setState({ parcelData: nextProps.router.query });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // DEMO: unconditional true — boilerplate that future refactors can break.
    return true;
  }

  registerSubcriber() {
    try {
      // DEMO: capture the unsubscribe handle... and then never invoke it.
      // Every navigation to /tracker leaks another WebSocket subscription.
      this.unsubscribe = appwrite.client.subscribe('documents', (response) => {
        const { parcelData } = this.state;
        if (parcelData?.$id) this.getParcelEvents(parcelData?.$id);
      });
    } catch (error) {
      console.log(error, 'error');
    }
  }

  // DEMO: NOTE the missing componentWillUnmount. The Appwrite subscription
  // above is intentionally never cleaned up. In a hooks/useEffect world this
  // would be a one-line cleanup return.

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
