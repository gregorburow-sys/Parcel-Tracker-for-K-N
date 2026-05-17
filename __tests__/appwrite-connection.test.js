const setEndpointMock = jest.fn().mockReturnThis()
const setProjectMock = jest.fn().mockReturnThis()
const clientInstance = {
  setEndpoint: setEndpointMock,
  setProject: setProjectMock,
}
const ClientMock = jest.fn(() => clientInstance)
const DatabasesMock = jest.fn(function Databases(client) {
  this.client = client
})
const AccountMock = jest.fn()

jest.mock('appwrite', () => ({
  Client: ClientMock,
  Databases: DatabasesMock,
  Account: AccountMock,
}))

jest.mock('../utils/config', () => ({
  __esModule: true,
  default: {
    appwriteURL: 'https://test.appwrite.io/v1',
    appwriteDatabaseID: 'db-id',
    appwriteParcelsID: 'parcels-id',
    appwriteParcelEventsID: 'events-id',
    appwriteProjectID: 'project-id',
  },
}))

describe('utils/appwrite-connection.js', () => {
  let appwrite

  beforeAll(() => {
    appwrite = require('../utils/appwrite-connection').default
  })

  it('instantiates a single Appwrite Client', () => {
    expect(ClientMock).toHaveBeenCalledTimes(1)
  })

  it('initializes the Appwrite client with config endpoint and project', () => {
    expect(setEndpointMock).toHaveBeenCalledWith('https://test.appwrite.io/v1')
    expect(setProjectMock).toHaveBeenCalledWith('project-id')
  })

  it('exposes both the client and the database instance', () => {
    expect(appwrite.client).toBe(clientInstance)
    expect(appwrite.database).toBeInstanceOf(DatabasesMock)
  })

  it('wires the database instance to the configured client', () => {
    expect(DatabasesMock).toHaveBeenCalledWith(clientInstance)
  })
})
