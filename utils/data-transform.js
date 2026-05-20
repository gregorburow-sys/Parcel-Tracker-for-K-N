// Pure helpers for shaping Appwrite responses into the structures the UI consumes.

// Default background color used for the timeline status dots.
export const DEFAULT_EVENT_BG_COLOR = "bg-green-500";

// Map a raw parcel document into the shape the UI expects.
// Adds a top-level `name` field copied from the `parcel-name` attribute.
export function transformParcelResponse(response) {
  if (!response) return {};
  return {
    ...response,
    name: response["parcel-name"],
  };
}

// Map a list of raw parcel event documents into render-ready entries.
// Each entry receives a `bgColor` and a locale-formatted `datetime` string.
export function transformParcelEvents(documents) {
  if (!Array.isArray(documents)) return [];
  return documents.map((document) => {
    const date = new Date(document.$updatedAt);
    return {
      ...document,
      bgColor: DEFAULT_EVENT_BG_COLOR,
      datetime: date.toLocaleString(),
    };
  });
}
