describe('config utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('maps environment variables to config keys', () => {
    process.env.NEXT_PUBLIC_API_ENDPOINT = 'https://api.example.com/v1';
    process.env.NEXT_PUBLIC_DATABASE_ID = 'db-123';
    process.env.NEXT_PUBLIC_PARCELS_ID = 'parcels-456';
    process.env.NEXT_PUBLIC_PARCELEVENTS_ID = 'events-789';
    process.env.NEXT_PUBLIC_PROJECT_ID = 'proj-abc';

    const config = require('../utils/config').default;

    expect(config.appwriteURL).toBe('https://api.example.com/v1');
    expect(config.appwriteDatabaseID).toBe('db-123');
    expect(config.appwriteParcelsID).toBe('parcels-456');
    expect(config.appwriteParcelEventsID).toBe('events-789');
    expect(config.appwriteProjectID).toBe('proj-abc');
  });

  it('returns undefined for missing environment variables', () => {
    delete process.env.NEXT_PUBLIC_API_ENDPOINT;
    delete process.env.NEXT_PUBLIC_DATABASE_ID;
    delete process.env.NEXT_PUBLIC_PARCELS_ID;
    delete process.env.NEXT_PUBLIC_PARCELEVENTS_ID;
    delete process.env.NEXT_PUBLIC_PROJECT_ID;

    const config = require('../utils/config').default;

    expect(config.appwriteURL).toBeUndefined();
    expect(config.appwriteDatabaseID).toBeUndefined();
    expect(config.appwriteParcelsID).toBeUndefined();
    expect(config.appwriteParcelEventsID).toBeUndefined();
    expect(config.appwriteProjectID).toBeUndefined();
  });

  it('config object is frozen and cannot be mutated', () => {
    const config = require('../utils/config').default;

    expect(Object.isFrozen(config)).toBe(true);
    expect(() => {
      config.appwriteURL = 'hacked';
    }).toThrow();
  });
});
