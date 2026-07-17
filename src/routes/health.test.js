import { createServer } from '../server.js'
import { jsonFormDataHandler } from '../service/transmitters/handlers/json-form-data.js'
import {
  getConfiguredDestinationNames,
  getDestinationSettings
} from '../service/transmitters/destination-config.js'

vi.mock('../tasks/receive-messages.js')
vi.mock('../service/transmitters/destination-config.js')

const mockFetch = vi.fn()

/**
 * @param {{ healthCheckUrl?: string | null }} [overrides]
 */
function mockDestination(overrides = {}) {
  vi.mocked(getConfiguredDestinationNames).mockReturnValue(['universityApi'])
  vi.mocked(getDestinationSettings).mockReturnValue({
    name: 'universityApi',
    url: 'http://example.com/api',
    apiKey: 'test-api-key',
    healthCheckUrl:
      'healthCheckUrl' in overrides
        ? /** @type {string | null} */ (overrides.healthCheckUrl)
        : 'http://example.com/health-check',
    handler: jsonFormDataHandler,
    retry: { maxAttempts: 1, initialDelayMs: 0, maxDelayMs: 0 }
  })
}

describe('Health route', () => {
  /** @type {Server} */
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    global.fetch = mockFetch
    mockDestination()
  })

  afterAll(() => {
    return server.stop()
  })

  const okStatusCode = 200
  const jsonContentType = 'application/json'

  describe('Without health check URL configured', () => {
    beforeEach(() => {
      mockDestination({ healthCheckUrl: null })
    })

    test('GET /health returns 200 success', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(response.statusCode).toEqual(okStatusCode)
      expect(response.headers['content-type']).toContain(jsonContentType)
      expect(response.result).toEqual({ message: 'success' })
    })
  })

  describe('With health check URL configured', () => {
    test('GET /health returns 200 when the destination is healthy', async () => {
      mockFetch.mockResolvedValue(
        /** @type {any} */ ({
          ok: true,
          status: 200
        })
      )

      const response = await server.inject({
        method: 'GET',
        url: '/health'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com/health-check',
        expect.objectContaining({
          method: 'GET',
          headers: { 'api-key': 'test-api-key' }
        })
      )
      expect(response.statusCode).toEqual(okStatusCode)
      expect(response.result).toEqual({ message: 'success' })
    })

    test('GET /health returns 503 when the destination returns non-OK', async () => {
      mockFetch.mockResolvedValue(
        /** @type {any} */ ({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
      )

      const response = await server.inject({
        method: 'GET',
        url: '/health'
      })

      expect(response.statusCode).toEqual(503)
      expect(response.result).toEqual({
        message: 'error',
        error: 'Destination "universityApi" returned 500'
      })
    })

    test('GET /health returns 503 when the destination is unreachable', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))

      const response = await server.inject({
        method: 'GET',
        url: '/health'
      })

      expect(response.statusCode).toEqual(503)
      expect(response.result).toEqual({
        message: 'error',
        error: 'Destination "universityApi" is unreachable'
      })
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
