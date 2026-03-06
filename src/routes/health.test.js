import fetch from 'node-fetch'
import { createServer } from '../server.js'
import { config } from '../config.js'

vi.mock('../tasks/receive-messages.js')
vi.mock('node-fetch')

describe('Health route', () => {
  /** @type {Server} */
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(() => {
    return server.stop()
  })

  const okStatusCode = 200
  const jsonContentType = 'application/json'

  describe('Without health check URL configured', () => {
    beforeEach(() => {
      config.set('universityApiHealthCheckUrl', null)
    })

    test('GET /health returns 200 success', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      })

      expect(response.statusCode).toEqual(okStatusCode)
      expect(response.headers['content-type']).toContain(jsonContentType)
      expect(response.result).toEqual({ message: 'success' })
    })
  })

  describe('With health check URL configured', () => {
    beforeEach(() => {
      config.set(
        'universityApiHealthCheckUrl',
        'http://example.com/health-check'
      )
      config.set('universityApiKey', 'test-api-key')
    })

    test('GET /health returns 200 when target service is healthy', async () => {
      vi.mocked(fetch).mockResolvedValue(
        /** @type {any} */ ({
          ok: true,
          status: 200
        })
      )

      const response = await server.inject({
        method: 'GET',
        url: '/health'
      })

      expect(fetch).toHaveBeenCalledWith(
        'http://example.com/health-check',
        expect.objectContaining({
          method: 'GET',
          headers: { 'api-key': 'test-api-key' }
        })
      )
      expect(response.statusCode).toEqual(okStatusCode)
      expect(response.result).toEqual({ message: 'success' })
    })

    test('GET /health returns 503 when target service returns non-OK', async () => {
      vi.mocked(fetch).mockResolvedValue(
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
        error: 'Target service returned 500'
      })
    })

    test('GET /health returns 503 when target service is unreachable', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'))

      const response = await server.inject({
        method: 'GET',
        url: '/health'
      })

      expect(response.statusCode).toEqual(503)
      expect(response.result).toEqual({
        message: 'error',
        error: 'Target service is unreachable'
      })
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
