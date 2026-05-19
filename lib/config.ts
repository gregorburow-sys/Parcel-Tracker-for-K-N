function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return "";
  }
  return value;
}

const config = Object.freeze({
  appwriteURL: requireEnv("NEXT_PUBLIC_API_ENDPOINT"),
  appwriteProjectID: requireEnv("NEXT_PUBLIC_PROJECT_ID"),
  appwriteDatabaseID: requireEnv("NEXT_PUBLIC_DATABASE_ID"),
  appwriteParcelsID: requireEnv("NEXT_PUBLIC_PARCELS_ID"),
  appwriteParcelEventsID: requireEnv("NEXT_PUBLIC_PARCELEVENTS_ID"),
});

export default config;
