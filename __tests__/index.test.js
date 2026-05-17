import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../pages/index';

const mockPush = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    const { src, alt, width, height } = props;
    return <img src={src} alt={alt} width={width} height={height} />;
  },
}));

const mockGetDocument = jest.fn();

jest.mock('../utils/appwrite-connection', () => ({
  __esModule: true,
  default: {
    database: {
      getDocument: (...args) => mockGetDocument(...args),
    },
    client: {
      subscribe: jest.fn(),
    },
  },
}));

jest.mock('../utils/config', () => ({
  __esModule: true,
  default: {
    appwriteURL: 'http://localhost/v1',
    appwriteDatabaseID: 'test-db-id',
    appwriteParcelsID: 'test-parcels-id',
    appwriteParcelEventsID: 'test-events-id',
    appwriteProjectID: 'test-project-id',
  },
}));

describe('Home page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the page title and search input', () => {
    render(<Home />);
    expect(screen.getByText(/Parcel Tracking App/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your parcel's tracking number/i)
    ).toBeInTheDocument();
  });

  it('renders the Track Parcel button', () => {
    render(<Home />);
    expect(screen.getByText('Track Parcel')).toBeInTheDocument();
  });

  it('updates input value when user types a tracking number', () => {
    render(<Home />);
    const input = screen.getByPlaceholderText(
      /Enter your parcel's tracking number/i
    );
    fireEvent.change(input, { target: { value: 'PKG-12345' } });
    expect(input.value).toBe('PKG-12345');
  });

  it('shows loading state while fetching parcel details', async () => {
    mockGetDocument.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );

    render(<Home />);
    const input = screen.getByPlaceholderText(
      /Enter your parcel's tracking number/i
    );
    fireEvent.change(input, { target: { value: 'PKG-12345' } });
    fireEvent.click(screen.getByText('Track Parcel'));

    expect(screen.getByText(/isLoading/i)).toBeInTheDocument();
  });

  it('navigates to tracker page on successful parcel lookup', async () => {
    const mockResponse = {
      $id: 'PKG-12345',
      'parcel-name': 'Test Package',
      $collectionId: 'col-1',
      $databaseId: 'db-1',
    };
    mockGetDocument.mockResolvedValueOnce(mockResponse);

    render(<Home />);
    const input = screen.getByPlaceholderText(
      /Enter your parcel's tracking number/i
    );
    fireEvent.change(input, { target: { value: 'PKG-12345' } });
    fireEvent.click(screen.getByText('Track Parcel'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: './tracker',
        query: expect.objectContaining({
          $id: 'PKG-12345',
          name: 'Test Package',
        }),
      });
    });
  });

  it('shows alert on fetch error', async () => {
    mockGetDocument.mockRejectedValueOnce(new Error('Parcel not found'));

    render(<Home />);
    const input = screen.getByPlaceholderText(
      /Enter your parcel's tracking number/i
    );
    fireEvent.change(input, { target: { value: 'INVALID-ID' } });
    fireEvent.click(screen.getByText('Track Parcel'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Parcel not found');
    });
  });

  it('restores search UI after an error', async () => {
    mockGetDocument.mockRejectedValueOnce(new Error('Network error'));

    render(<Home />);
    const input = screen.getByPlaceholderText(
      /Enter your parcel's tracking number/i
    );
    fireEvent.change(input, { target: { value: 'PKG-999' } });
    fireEvent.click(screen.getByText('Track Parcel'));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Enter your parcel's tracking number/i)
      ).toBeInTheDocument();
    });
  });

  it('resolves parcel-name field into name property', async () => {
    const mockResponse = {
      $id: 'PKG-100',
      'parcel-name': 'Fragile Electronics',
      status: 'active',
    };
    mockGetDocument.mockResolvedValueOnce(mockResponse);

    render(<Home />);
    const input = screen.getByPlaceholderText(
      /Enter your parcel's tracking number/i
    );
    fireEvent.change(input, { target: { value: 'PKG-100' } });
    fireEvent.click(screen.getByText('Track Parcel'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            name: 'Fragile Electronics',
          }),
        })
      );
    });
  });
});
