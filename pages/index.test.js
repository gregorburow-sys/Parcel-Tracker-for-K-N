import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/router. Home is wrapped in withRouter(Home), so we need to expose
// a HOC that forwards a controllable router prop. We keep a settable mock
// router in this scope so each test can adjust it before rendering.
let mockRouter = { push: jest.fn() };

jest.mock("next/router", () => ({
  useRouter: () => mockRouter,
  withRouter: (Component) =>
    function WithRouterWrapper(props) {
      return <Component {...props} router={mockRouter} />;
    },
}));

// Mock the Appwrite-connected singleton so tests don't reach the network.
jest.mock("../utils/appwrite-connection", () => ({
  __esModule: true,
  default: {
    client: { subscribe: jest.fn() },
    database: {
      getDocument: jest.fn(),
      listDocuments: jest.fn(),
    },
  },
}));

const appwrite = require("../utils/appwrite-connection").default;
const Home = require("./index").default;

let consoleWarnSpy;

beforeEach(() => {
  jest.clearAllMocks();
  mockRouter = { push: jest.fn() };
  // Home intentionally logs from UNSAFE_componentWillMount on every render —
  // silence it so the test output stays readable.
  consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  consoleWarnSpy.mockRestore();
});

describe("<Home />", () => {
  it("renders the tracking heading and the search input", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /Debby's Parcel Tracking App/i })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your parcel's tracking number/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Track Parcel/i)).toBeInTheDocument();
  });

  it("updates the typed parcel id and forwards it to Appwrite when tracking", async () => {
    appwrite.database.getDocument.mockResolvedValue({
      $id: "XYZ-123",
      "parcel-name": "Box X",
    });

    const user = userEvent.setup();
    render(<Home />);

    await user.type(
      screen.getByPlaceholderText(/tracking number/i),
      "XYZ-123"
    );
    await user.click(screen.getByText(/Track Parcel/i));

    expect(appwrite.database.getDocument).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      "XYZ-123"
    );
  });

  it("shows the loading state while the Appwrite lookup is pending", async () => {
    let resolveLookup;
    appwrite.database.getDocument.mockReturnValue(
      new Promise((resolve) => {
        resolveLookup = resolve;
      })
    );

    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByPlaceholderText(/tracking number/i), "PENDING");
    await user.click(screen.getByText(/Track Parcel/i));

    expect(await screen.findByText(/isLoading/i)).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/tracking number/i)
    ).not.toBeInTheDocument();

    // Resolve so React can settle and avoid act() warnings.
    resolveLookup({ $id: "PENDING", "parcel-name": "Done" });
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());
  });

  it("navigates to /tracker with the transformed parcel response on success", async () => {
    appwrite.database.getDocument.mockResolvedValue({
      $id: "tracking-1",
      "parcel-name": "Birthday gift",
      address: "12 King's Road",
    });

    const user = userEvent.setup();
    render(<Home />);

    await user.type(
      screen.getByPlaceholderText(/tracking number/i),
      "tracking-1"
    );
    await user.click(screen.getByText(/Track Parcel/i));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "./tracker",
        query: expect.objectContaining({
          $id: "tracking-1",
          "parcel-name": "Birthday gift",
          address: "12 King's Road",
          name: "Birthday gift",
        }),
      });
    });
  });

  it("alerts the user and does not navigate when the Appwrite call fails", async () => {
    const error = new Error("Parcel not found");
    appwrite.database.getDocument.mockRejectedValue(error);
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByPlaceholderText(/tracking number/i), "bad-id");
    await user.click(screen.getByText(/Track Parcel/i));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Parcel not found");
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
    // Loading state should be cleared again after the failure resolves.
    await screen.findByPlaceholderText(/tracking number/i);

    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
