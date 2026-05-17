import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const pushMock = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: pushMock,
    query: {},
    pathname: '/',
  }),
}))

const getDocumentMock = jest.fn()

jest.mock('../utils/appwrite-connection', () => ({
  __esModule: true,
  default: {
    database: {
      getDocument: (...args) => getDocumentMock(...args),
    },
    client: {
      subscribe: jest.fn(),
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

import Home from '../pages/index'

describe('Home (pages/index.js)', () => {
  beforeEach(() => {
    pushMock.mockReset()
    getDocumentMock.mockReset()
  })

  it('renders the heading and input field', () => {
    render(<Home />)

    expect(
      screen.getByRole('heading', { name: /Debby's Parcel Tracking App/i })
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/Enter your parcel's tracking number/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Track Parcel/i)).toBeInTheDocument()
  })

  it('updates the input value when the user types', async () => {
    const user = userEvent.setup()
    render(<Home />)

    const input = screen.getByPlaceholderText(
      /Enter your parcel's tracking number/i
    )
    await user.type(input, 'TRACK123')

    expect(input).toHaveValue('TRACK123')
  })

  it('fetches parcel details and navigates to /tracker on successful search', async () => {
    const parcelDoc = {
      $id: 'TRACK123',
      'parcel-name': 'Test Parcel',
      $updatedAt: '2024-01-01T00:00:00.000Z',
    }
    getDocumentMock.mockResolvedValueOnce(parcelDoc)

    const user = userEvent.setup()
    render(<Home />)

    await user.type(
      screen.getByPlaceholderText(/Enter your parcel's tracking number/i),
      'TRACK123'
    )
    await user.click(screen.getByText(/Track Parcel/i))

    await waitFor(() => {
      expect(getDocumentMock).toHaveBeenCalledWith(
        'db-id',
        'parcels-id',
        'TRACK123'
      )
    })

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith({
        pathname: './tracker',
        query: { ...parcelDoc, name: 'Test Parcel' },
      })
    })
  })

  it('shows the loading state while the parcel request is pending', async () => {
    let resolveFn
    getDocumentMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve
        })
    )

    const user = userEvent.setup()
    render(<Home />)

    await user.type(
      screen.getByPlaceholderText(/Enter your parcel's tracking number/i),
      'TRACK123'
    )
    await user.click(screen.getByText(/Track Parcel/i))

    expect(await screen.findByText(/isLoading/i)).toBeInTheDocument()

    resolveFn({
      $id: 'TRACK123',
      'parcel-name': 'Test Parcel',
    })

    await waitFor(() => {
      expect(screen.queryByText(/isLoading/i)).not.toBeInTheDocument()
    })
  })

  it('alerts the user and does not navigate when the tracking number is invalid', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    const consoleErrSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    getDocumentMock.mockRejectedValueOnce(
      new Error('Document with the requested ID could not be found')
    )

    const user = userEvent.setup()
    render(<Home />)

    await user.type(
      screen.getByPlaceholderText(/Enter your parcel's tracking number/i),
      'BAD-ID'
    )
    await user.click(screen.getByText(/Track Parcel/i))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Document with the requested ID could not be found'
      )
    })

    expect(pushMock).not.toHaveBeenCalled()

    alertSpy.mockRestore()
    consoleErrSpy.mockRestore()
  })
})
