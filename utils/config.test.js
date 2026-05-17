describe("config", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("maps the expected environment variables onto the config object", () => {
    process.env.NEXT_PUBLIC_API_ENDPOINT = "https://example.test/v1";
    process.env.NEXT_PUBLIC_DATABASE_ID = "db-id";
    process.env.NEXT_PUBLIC_PARCELS_ID = "parcels-id";
    process.env.NEXT_PUBLIC_PARCELEVENTS_ID = "events-id";
    process.env.NEXT_PUBLIC_PROJECT_ID = "project-id";

    const config = require("./config").default;

    expect(config).toEqual({
      appwriteURL: "https://example.test/v1",
      appwriteDatabaseID: "db-id",
      appwriteParcelsID: "parcels-id",
      appwriteParcelEventsID: "events-id",
      appwriteProjectID: "project-id",
    });
  });

  it("exposes exactly the five expected keys", () => {
    const config = require("./config").default;

    expect(Object.keys(config).sort()).toEqual(
      [
        "appwriteDatabaseID",
        "appwriteParcelEventsID",
        "appwriteParcelsID",
        "appwriteProjectID",
        "appwriteURL",
      ].sort()
    );
  });

  it("is frozen so callers cannot mutate the configuration at runtime", () => {
    const config = require("./config").default;

    expect(Object.isFrozen(config)).toBe(true);

    expect(() => {
      "use strict";
      config.appwriteURL = "https://malicious.test";
    }).toThrow(TypeError);

    expect(() => {
      "use strict";
      config.newField = "nope";
    }).toThrow(TypeError);
  });
});
