import { render, screen, waitFor, within } from "@testing-library/react";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

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
const Tracker = require("./tracker").default;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("<Tracker />", () => {
  it("displays the parcel name and id from the router query", async () => {
    useRouter.mockReturnValue({
      query: { $id: "P-1", name: "Birthday gift" },
    });
    appwrite.database.listDocuments.mockResolvedValue({ documents: [] });

    render(<Tracker />);

    expect(
      screen.getByRole("heading", { name: /Parcel Information/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Parcel Name:\s*Birthday gift/i)).toBeInTheDocument();
    expect(screen.getByText(/Parcel No:\s*P-1/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(appwrite.database.listDocuments).toHaveBeenCalled();
    });
  });

  it("renders an empty timeline when there are no events", async () => {
    useRouter.mockReturnValue({
      query: { $id: "P-2", name: "Empty box" },
    });
    appwrite.database.listDocuments.mockResolvedValue({ documents: [] });

    render(<Tracker />);

    await waitFor(() => {
      expect(appwrite.database.listDocuments).toHaveBeenCalled();
    });

    const list = screen.getByRole("list");
    expect(within(list).queryAllByRole("listitem")).toHaveLength(0);
  });

  it("renders one timeline item per event with status and locale date", async () => {
    useRouter.mockReturnValue({
      query: { $id: "P-3", name: "Multi-stop" },
    });
    const firstStamp = "2024-01-15T10:30:00.000Z";
    const secondStamp = "2024-01-16T12:00:00.000Z";
    appwrite.database.listDocuments.mockResolvedValue({
      documents: [
        { $id: "e1", status: "Picked up", $updatedAt: firstStamp },
        { $id: "e2", status: "In transit", $updatedAt: secondStamp },
      ],
    });

    render(<Tracker />);

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(screen.getByText("Picked up")).toBeInTheDocument();
    expect(screen.getByText("In transit")).toBeInTheDocument();
    expect(
      screen.getByText(new Date(firstStamp).toLocaleString())
    ).toBeInTheDocument();
    expect(
      screen.getByText(new Date(secondStamp).toLocaleString())
    ).toBeInTheDocument();
  });

  it("applies the bg-green-500 class to every event marker", async () => {
    useRouter.mockReturnValue({
      query: { $id: "P-4", name: "BG check" },
    });
    appwrite.database.listDocuments.mockResolvedValue({
      documents: [
        { $id: "e1", status: "Step 1", $updatedAt: "2024-01-15T10:30:00.000Z" },
        { $id: "e2", status: "Step 2", $updatedAt: "2024-01-16T12:00:00.000Z" },
      ],
    });

    const { container } = render(<Tracker />);
    const items = await screen.findAllByRole("listitem");

    const markers = container.querySelectorAll(".bg-green-500");
    expect(markers.length).toBe(items.length);
  });

  it("registers a realtime subscription on the documents channel", async () => {
    useRouter.mockReturnValue({
      query: { $id: "P-5", name: "Subscribed" },
    });
    appwrite.database.listDocuments.mockResolvedValue({ documents: [] });

    render(<Tracker />);

    await waitFor(() => {
      expect(appwrite.client.subscribe).toHaveBeenCalledWith(
        "documents",
        expect.any(Function)
      );
    });
  });

  it("renders a Home link that points back to the index route", async () => {
    useRouter.mockReturnValue({
      query: { $id: "P-6", name: "Has home" },
    });
    appwrite.database.listDocuments.mockResolvedValue({ documents: [] });

    render(<Tracker />);

    const link = screen.getByRole("link", { name: /home/i });
    // Next.js normalizes the `./` href on Link into `/` when rendered.
    expect(link).toHaveAttribute("href", expect.stringMatching(/^\.?\/$/));

    await waitFor(() => {
      expect(appwrite.database.listDocuments).toHaveBeenCalled();
    });
  });
});
