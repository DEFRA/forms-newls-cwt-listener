import { afterAll, beforeAll } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'
import nock from 'nock'

const jwksUri = import.meta.env.OIDC_JWKS_URI
const okStatusCode = 200

const fetchMock = createFetchMock(vi)

beforeAll(async () => {
  // Setup fetch mock
  fetchMock.enableMocks()
  global.fetch = fetchMock
  global.fetchMock = fetchMock
  setupJwksMock()
})

afterAll(async () => {
  fetchMock.disableMocks()
})

function setupJwksMock() {
  const testJwks = {
    keys: [
      {
        kty: 'RSA',
        use: 'sig',
        kid: 'test-jwks-key',
        alg: 'RS256',
        n: 'test-key-modulus',
        e: 'AQAB'
      }
    ]
  }

  if (jwksUri) {
    const { origin, pathname, search } = new URL(jwksUri)

    nock.cleanAll()

    nock(origin)
      .persist()
      .get(`${pathname}${search}`)
      .reply(okStatusCode, testJwks)
  }
}
