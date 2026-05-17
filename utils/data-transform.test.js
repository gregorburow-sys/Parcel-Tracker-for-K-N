import {
  DEFAULT_EVENT_BG_COLOR,
  transformParcelEvents,
  transformParcelResponse,
} from "./data-transform";

describe("transformParcelResponse", () => {
  it("copies the `parcel-name` attribute into a top-level `name` field", () => {
    const raw = {
      $id: "abc-123",
      "parcel-name": "Birthday gift",
      address: "12 King's Road",
    };

    const result = transformParcelResponse(raw);

    expect(result).toEqual({
      $id: "abc-123",
      "parcel-name": "Birthday gift",
      address: "12 King's Road",
      name: "Birthday gift",
    });
  });

  it("does not mutate the original response object", () => {
    const raw = { $id: "abc-123", "parcel-name": "Box A" };

    transformParcelResponse(raw);

    expect(raw).toEqual({ $id: "abc-123", "parcel-name": "Box A" });
    expect(raw).not.toHaveProperty("name");
  });

  it("falls back to an empty object when the response is nullish", () => {
    expect(transformParcelResponse(undefined)).toEqual({});
    expect(transformParcelResponse(null)).toEqual({});
  });

  it("sets `name` to undefined when `parcel-name` is missing", () => {
    const raw = { $id: "abc-123" };

    const result = transformParcelResponse(raw);

    expect(result).toEqual({ $id: "abc-123", name: undefined });
  });
});

describe("transformParcelEvents", () => {
  it("formats `$updatedAt` into a locale string and assigns the default bg color", () => {
    const documents = [
      {
        $id: "evt-1",
        status: "Picked up",
        $updatedAt: "2024-01-15T10:30:00.000Z",
      },
    ];

    const result = transformParcelEvents(documents);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      $id: "evt-1",
      status: "Picked up",
      bgColor: "bg-green-500",
    });
    expect(result[0].datetime).toBe(
      new Date("2024-01-15T10:30:00.000Z").toLocaleString()
    );
  });

  it("assigns the same `bgColor` constant to every event", () => {
    const documents = [
      { $id: "a", $updatedAt: "2024-01-15T10:30:00.000Z", status: "In transit" },
      { $id: "b", $updatedAt: "2024-02-20T08:00:00.000Z", status: "Delivered" },
    ];

    const result = transformParcelEvents(documents);

    expect(result).toHaveLength(2);
    expect(result.every((event) => event.bgColor === DEFAULT_EVENT_BG_COLOR)).toBe(
      true
    );
    expect(DEFAULT_EVENT_BG_COLOR).toBe("bg-green-500");
  });

  it("preserves the original event fields alongside the derived ones", () => {
    const documents = [
      {
        $id: "evt-2",
        status: "In transit",
        location: "Warehouse 7",
        $updatedAt: "2024-02-20T08:00:00.000Z",
      },
    ];

    const [event] = transformParcelEvents(documents);

    expect(event.status).toBe("In transit");
    expect(event.location).toBe("Warehouse 7");
    expect(event.$id).toBe("evt-2");
  });

  it("returns an empty array when documents is missing or not an array", () => {
    expect(transformParcelEvents(undefined)).toEqual([]);
    expect(transformParcelEvents(null)).toEqual([]);
    expect(transformParcelEvents([])).toEqual([]);
  });
});
