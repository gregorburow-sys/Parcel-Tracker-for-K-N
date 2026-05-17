// Manual mock for the Appwrite SDK so tests don't reach the real backend.
const Client = jest.fn().mockImplementation(() => ({
  setEndpoint: jest.fn().mockReturnThis(),
  setProject: jest.fn().mockReturnThis(),
  subscribe: jest.fn(() => () => {}),
}))

const Databases = jest.fn().mockImplementation(() => ({
  getDocument: jest.fn(),
  listDocuments: jest.fn(),
}))

const Account = jest.fn().mockImplementation(() => ({}))

const Query = {
  equal: jest.fn((field, values) => `equal("${field}", ${JSON.stringify(values)})`),
}

module.exports = {
  Client,
  Databases,
  Account,
  Query,
}
