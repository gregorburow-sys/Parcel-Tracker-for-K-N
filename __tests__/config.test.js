describe('utils/config.js', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('exposes all expected configuration keys', () => {
    const config = require('../utils/config').default

    expect(config).toEqual(
      expect.objectContaining({
        appwriteURL: expect.anything(),
        appwriteDatabaseID: expect.anything(),
        appwriteParcelsID: expect.anything(),
        appwriteParcelEventsID: expect.anything(),
        appwriteProjectID: expect.anything(),
      })
    )
  })

  it('reads values from the corresponding NEXT_PUBLIC_* environment variables', () => {
    process.env.NEXT_PUBLIC_API_ENDPOINT = 'https://example.com/v1'
    process.env.NEXT_PUBLIC_DATABASE_ID = 'database-123'
    process.env.NEXT_PUBLIC_PARCELS_ID = 'parcels-456'
    process.env.NEXT_PUBLIC_PARCELEVENTS_ID = 'events-789'
    process.env.NEXT_PUBLIC_PROJECT_ID = 'project-abc'

    const config = require('../utils/config').default

    expect(config.appwriteURL).toBe('https://example.com/v1')
    expect(config.appwriteDatabaseID).toBe('database-123')
    expect(config.appwriteParcelsID).toBe('parcels-456')
    expect(config.appwriteParcelEventsID).toBe('events-789')
    expect(config.appwriteProjectID).toBe('project-abc')
  })

  it('is frozen and cannot be mutated', () => {
    const config = require('../utils/config').default

    expect(Object.isFrozen(config)).toBe(true)
    expect(() => {
      'use strict'
      config.appwriteURL = 'https://malicious.example/v1'
    }).toThrow(TypeError)
  })
})
