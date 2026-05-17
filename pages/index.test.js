import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/router so the component receives a controllable router instance.
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
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

const { useRouter } = require("next/router");
const appwrite = require("../utils/appwrite-connection").default;
const Home = require("./index").default;

const pushMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ push: pushMock });
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
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
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
      expect(pushMock).toHaveBeenCalledWith({
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
    expect(pushMock).not.toHaveBeenCalled();
    // Loading state should be cleared again after the failure resolves.
    await screen.findByPlaceholderText(/tracking number/i);

    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
