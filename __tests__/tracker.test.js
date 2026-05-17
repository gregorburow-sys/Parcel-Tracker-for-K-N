import { render, screen, waitFor } from '@testing-library/react'

const subscribeMock = jest.fn()
const listDocumentsMock = jest.fn()

let mockQuery = {}

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: mockQuery,
    push: jest.fn(),
  }),
}))

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  )
  MockLink.displayName = 'MockLink'
  return { __esModule: true, default: MockLink }
})

jest.mock('appwrite', () => ({
  Query: {
    equal: (key, value) => `equal(${key},${JSON.stringify(value)})`,
  },
}))

jest.mock('../utils/appwrite-connection', () => ({
  __esModule: true,
  default: {
    database: {
      listDocuments: (...args) => listDocumentsMock(...args),
    },
    client: {
      subscribe: (...args) => subscribeMock(...args),
    },
  },
}))

jest.mock('../utils/config', () => ({
  __esModule: true,
  default: {
    appwriteURL: 'http://localhost/v1',
    appwriteDatabaseID: 'db-id',
    appwriteParcelsID: 'parcels-id',
    appwriteParcelEventsID: 'events-id',
    appwriteProjectID: 'project-id',
  },
}))

import Tracker from '../pages/tracker'

describe('Tracker (pages/tracker.js)', () => {
  beforeEach(() => {
    subscribeMock.mockReset()
    listDocumentsMock.mockReset()
    mockQuery = {
      $id: 'TRACK123',
      name: 'Test Parcel',
    }
  })

  it('renders parcel data from the router query', async () => {
    listDocumentsMock.mockResolvedValue({ documents: [] })

    render(<Tracker />)

    await waitFor(() => {
      expect(screen.getByText(/Parcel Information/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Parcel Name: Test Parcel/i)).toBeInTheDocument()
    expect(screen.getByText(/Parcel No: TRACK123/i)).toBeInTheDocument()
  })

  it('lists parcel events with formatted dates and transformed data', async () => {
    const updatedAt = '2024-03-15T10:30:00.000Z'
    listDocumentsMock.mockResolvedValue({
      documents: [
        {
          $id: 'evt-1',
          status: 'Shipped',
          $updatedAt: updatedAt,
        },
        {
          $id: 'evt-2',
          status: 'In Transit',
          $updatedAt: updatedAt,
        },
      ],
    })

    render(<Tracker />)

    await waitFor(() => {
      expect(screen.getByText(/Shipped/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/In Transit/i)).toBeInTheDocument()
    expect(listDocumentsMock).toHaveBeenCalledWith(
      'db-id',
      'events-id',
      [expect.stringContaining('TRACK123')]
    )

    const expectedDate = new Date(updatedAt).toLocaleString()
    const dateMatches = screen.getAllByText(expectedDate)
    expect(dateMatches.length).toBeGreaterThanOrEqual(2)
  })

  it('renders no event items when the events list is empty', async () => {
    listDocumentsMock.mockResolvedValue({ documents: [] })

    const { container } = render(<Tracker />)

    await waitFor(() => {
      expect(listDocumentsMock).toHaveBeenCalled()
    })

    expect(container.querySelectorAll('li').length).toBe(0)
  })

  it('registers a real-time subscription for documents', async () => {
    listDocumentsMock.mockResolvedValue({ documents: [] })

    render(<Tracker />)

    await waitFor(() => {
      expect(subscribeMock).toHaveBeenCalled()
    })
    expect(subscribeMock.mock.calls[0][0]).toBe('documents')
    expect(typeof subscribeMock.mock.calls[0][1]).toBe('function')
  })

  it('refetches events when the real-time subscription callback fires', async () => {
    listDocumentsMock.mockResolvedValue({ documents: [] })

    render(<Tracker />)

    // Wait for the subscription registration that includes the populated
    // parcelData closure (the component re-registers when parcelData updates).
    await waitFor(() => {
      expect(subscribeMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    })

    const callsBefore = listDocumentsMock.mock.calls.length
    const lastCallIdx = subscribeMock.mock.calls.length - 1
    const subscriptionCallback = subscribeMock.mock.calls[lastCallIdx][1]
    subscriptionCallback({ events: ['databases.*.documents.*'] })

    await waitFor(() => {
      expect(listDocumentsMock.mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })

  it('logs an error if the events request fails', async () => {
    const consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => {})
    const err = new Error('Failed to fetch events')
    listDocumentsMock.mockRejectedValueOnce(err)

    render(<Tracker />)

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(err)
    })

    consoleLogSpy.mockRestore()
  })
})
