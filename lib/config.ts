function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and fill in your Appwrite project values.`,
    );
  }
  return value;
}

export const config = Object.freeze({
  appwriteEndpoint: readEnv("NEXT_PUBLIC_API_ENDPOINT"),
  appwriteProjectId: readEnv("NEXT_PUBLIC_PROJECT_ID"),
  appwriteDatabaseId: readEnv("NEXT_PUBLIC_DATABASE_ID"),
  appwriteParcelsCollectionId: readEnv("NEXT_PUBLIC_PARCELS_ID"),
  appwriteParcelEventsCollectionId: readEnv("NEXT_PUBLIC_PARCELEVENTS_ID"),
});

export type Config = typeof config;
