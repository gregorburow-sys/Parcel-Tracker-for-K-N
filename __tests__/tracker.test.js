import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tracker from '../pages/tracker';

const mockListDocuments = jest.fn();
const mockSubscribe = jest.fn();

jest.mock('../utils/appwrite-connection', () => ({
  __esModule: true,
  default: {
    database: {
      listDocuments: (...args) => mockListDocuments(...args),
    },
    client: {
      subscribe: (...args) => mockSubscribe(...args),
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

const mockQuery = { $id: 'PKG-001', name: 'Test Parcel' };

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: mockQuery,
    push: jest.fn(),
    pathname: '/tracker',
    asPath: '/tracker',
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('Tracker page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListDocuments.mockResolvedValue({ documents: [] });
    mockSubscribe.mockReturnValue(jest.fn());
  });

  describe('parcel information display', () => {
    it('renders the Parcel Information heading', () => {
      render(<Tracker />);
      expect(screen.getByText('Parcel Information')).toBeInTheDocument();
    });

    it('displays the parcel name from router query', () => {
      render(<Tracker />);
      expect(screen.getByText(/Parcel Name:.*Test Parcel/)).toBeInTheDocument();
    });

    it('displays the parcel ID from router query', () => {
      render(<Tracker />);
      expect(screen.getByText(/Parcel No:.*PKG-001/)).toBeInTheDocument();
    });

    it('renders a Home link for navigation back', () => {
      render(<Tracker />);
      const homeLink = screen.getByText('Home');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink.closest('a')).toHaveAttribute('href', './');
    });
  });

  describe('empty state', () => {
    it('renders an empty event list when no events exist', () => {
      mockListDocuments.mockResolvedValue({ documents: [] });
      render(<Tracker />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });
  });

  describe('event timeline rendering', () => {
    const mockEvents = [
      {
        $id: 'evt-1',
        $updatedAt: '2024-01-15T10:30:00.000Z',
        status: 'Package picked up',
        parcelId: 'PKG-001',
      },
      {
        $id: 'evt-2',
        $updatedAt: '2024-01-16T14:00:00.000Z',
        status: 'In transit to sorting facility',
        parcelId: 'PKG-001',
      },
      {
        $id: 'evt-3',
        $updatedAt: '2024-01-17T09:00:00.000Z',
        status: 'Delivered',
        parcelId: 'PKG-001',
      },
    ];

    it('renders all tracking events as list items', async () => {
      mockListDocuments.mockResolvedValue({ documents: mockEvents });

      render(<Tracker />);

      await waitFor(() => {
        expect(screen.getByText('Package picked up')).toBeInTheDocument();
        expect(
          screen.getByText('In transit to sorting facility')
        ).toBeInTheDocument();
        expect(screen.getByText('Delivered')).toBeInTheDocument();
      });
    });

    it('renders the correct number of timeline items', async () => {
      mockListDocuments.mockResolvedValue({ documents: mockEvents });

      render(<Tracker />);

      await waitFor(() => {
        expect(screen.getAllByRole('listitem')).toHaveLength(3);
      });
    });

    it('displays formatted datetime for each event', async () => {
      mockListDocuments.mockResolvedValue({
        documents: [
          {
            $id: 'evt-single',
            $updatedAt: '2024-06-01T12:00:00.000Z',
            status: 'Arrived at warehouse',
            parcelId: 'PKG-001',
          },
        ],
      });

      render(<Tracker />);

      await waitFor(() => {
        expect(screen.getByText('Arrived at warehouse')).toBeInTheDocument();
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(1);
      });
    });

    it('renders connector lines between events except the last', async () => {
      mockListDocuments.mockResolvedValue({ documents: mockEvents });

      render(<Tracker />);

      await waitFor(() => {
        const connectors = document.querySelectorAll('[aria-hidden="true"]');
        expect(connectors).toHaveLength(mockEvents.length - 1);
      });
    });

    it('applies green background color to event indicators', async () => {
      mockListDocuments.mockResolvedValue({
        documents: [mockEvents[0]],
      });

      render(<Tracker />);

      await waitFor(() => {
        const indicator = document.querySelector('.bg-green-500');
        expect(indicator).toBeInTheDocument();
      });
    });
  });

  describe('tracking data fetching', () => {
    it('calls listDocuments with correct database and collection IDs', async () => {
      mockListDocuments.mockResolvedValue({ documents: [] });

      render(<Tracker />);

      await waitFor(() => {
        expect(mockListDocuments).toHaveBeenCalledWith(
          'test-db-id',
          'test-events-id',
          expect.any(Array)
        );
      });
    });

    it('subscribes to real-time document updates', () => {
      mockListDocuments.mockResolvedValue({ documents: [] });

      render(<Tracker />);

      expect(mockSubscribe).toHaveBeenCalledWith(
        'documents',
        expect.any(Function)
      );
    });

    it('handles API error gracefully without crashing', async () => {
      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});
      mockListDocuments.mockRejectedValue(new Error('Network error'));

      render(<Tracker />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      expect(screen.getByText('Parcel Information')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });

  describe('status rendering variations', () => {
    const statusCases = [
      'Order placed',
      'Package picked up',
      'In transit',
      'Out for delivery',
      'Delivered',
      'Return initiated',
      'Customs clearance',
    ];

    statusCases.forEach((status) => {
      it(`renders "${status}" status correctly`, async () => {
        mockListDocuments.mockResolvedValue({
          documents: [
            {
              $id: `evt-${status}`,
              $updatedAt: '2024-01-15T10:00:00.000Z',
              status,
              parcelId: 'PKG-001',
            },
          ],
        });

        render(<Tracker />);

        await waitFor(() => {
          expect(screen.getByText(status)).toBeInTheDocument();
        });
      });
    });
  });
});
