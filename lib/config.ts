function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and fill in your Appwrite project values.`,
    );
  }
  return value;
}

// Each env var is read via a literal `process.env.NEXT_PUBLIC_*` access so
// the bundler can statically inline it into the client bundle. Dynamic
// `process.env[name]` access works on the server but produces an undefined
// value in the browser.
export const config = Object.freeze({
  appwriteEndpoint: required(
    "NEXT_PUBLIC_API_ENDPOINT",
    process.env.NEXT_PUBLIC_API_ENDPOINT,
  ),
  appwriteProjectId: required(
    "NEXT_PUBLIC_PROJECT_ID",
    process.env.NEXT_PUBLIC_PROJECT_ID,
  ),
  appwriteDatabaseId: required(
    "NEXT_PUBLIC_DATABASE_ID",
    process.env.NEXT_PUBLIC_DATABASE_ID,
  ),
  appwriteParcelsCollectionId: required(
    "NEXT_PUBLIC_PARCELS_ID",
    process.env.NEXT_PUBLIC_PARCELS_ID,
  ),
  appwriteParcelEventsCollectionId: required(
    "NEXT_PUBLIC_PARCELEVENTS_ID",
    process.env.NEXT_PUBLIC_PARCELEVENTS_ID,
  ),
});

export type Config = typeof config;
