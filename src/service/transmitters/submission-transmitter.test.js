import { getDestinationSettings } from './destination-config.js'
import { jsonFormDataHandler } from './handlers/json-form-data.js'
import { send } from './submission-transmitter.js'

const mockFetch = vi.fn()
vi.mock('./destination-config.js')
vi.mock('../../common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  })
}))

const mockMessage = {
  formId: 'test',
  DF_reference_number: 'DF-REF-123',
  data: { field: 'value' }
}

/**
 * Stubs the destination's settings. Retrying defaults to a single attempt so
 * that tests asserting a failure do not wait out the back-off; the retry tests
 * opt in.
 * @param {{ url?: string, retry?: object }} [overrides]
 */
function mockDestination(overrides = {}) {
  vi.mocked(getDestinationSettings).mockReturnValue({
    name: 'universityApi',
    url: overrides.url ?? 'http://example.com/api',
    apiKey: 'test-api-key',
    healthCheckUrl: null,
    handler: jsonFormDataHandler,
    retry: /** @type {any} */ ({
      maxAttempts: 1,
      initialDelayMs: 0,
      maxDelayMs: 0,
      ...overrides.retry
    })
  })
}

describe('submission-transmitter', () => {
  beforeEach(() => {
    global.fetch = mockFetch
    mockDestination()
  })

  it('should look the destination up by the name it is given', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('OK')
    })

    await send('universityApi', mockMessage)

    expect(getDestinationSettings).toHaveBeenCalledWith('universityApi')
  })

  it('should throw if the destination has no url configured', async () => {
    mockDestination({ url: '' })

    await expect(send('universityApi', mockMessage)).rejects.toThrow(
      'Destination "universityApi" has no url configured'
    )
  })

  it('should send a POST request encoded by the destination handler', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('OK')
    })

    await send('universityApi', mockMessage)

    expect(mockFetch).toHaveBeenCalledWith('http://example.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'api-key': 'test-api-key'
      },
      body: new URLSearchParams({
        json_form_data: JSON.stringify(mockMessage)
      })
    })
  })

  it('should resolve on successful response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('OK')
    })

    await expect(send('universityApi', mockMessage)).resolves.toBeUndefined()
  })

  it('should throw when fetch rejects with a network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(send('universityApi', mockMessage)).rejects.toThrow(
      'An error occurred while sending message to universityApi for submission DF-REF-123'
    )
  })

  it('should set the original error as the cause on network error', async () => {
    const networkError = new Error('Network error')
    mockFetch.mockRejectedValue(networkError)

    try {
      await send('universityApi', mockMessage)
      expect.fail('Expected an error to be thrown')
    } catch (/** @type {any} */ error) {
      expect(error.cause).toBe(networkError)
    }
  })

  it('should throw when the response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: vi.fn().mockResolvedValue('Server error body')
    })

    await expect(send('universityApi', mockMessage)).rejects.toThrow(
      'Failed to send message to universityApi for submission DF-REF-123: Internal Server Error'
    )
  })

  describe('retrying', () => {
    /**
     * @param {number} status
     * @param {string} statusText
     */
    function failWith(status, statusText) {
      return {
        ok: false,
        status,
        statusText,
        text: vi.fn().mockResolvedValue('body')
      }
    }

    const ok = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('OK')
    }

    beforeEach(() => {
      mockDestination({ retry: { maxAttempts: 3, initialDelayMs: 0 } })
    })

    it('should use the retry policy from the destination config', async () => {
      mockDestination({ retry: { maxAttempts: 2, initialDelayMs: 0 } })
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(send('universityApi', mockMessage)).rejects.toThrow(
        'An error occurred while sending message to universityApi'
      )
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should retry a network error and resolve once it succeeds', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(ok)

      await expect(send('universityApi', mockMessage)).resolves.toBeUndefined()
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should retry a 500 and resolve once it succeeds', async () => {
      mockFetch
        .mockResolvedValueOnce(failWith(500, 'Internal Server Error'))
        .mockResolvedValueOnce(ok)

      await expect(send('universityApi', mockMessage)).resolves.toBeUndefined()
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should retry a 429', async () => {
      mockFetch
        .mockResolvedValueOnce(failWith(429, 'Too Many Requests'))
        .mockResolvedValueOnce(ok)

      await expect(send('universityApi', mockMessage)).resolves.toBeUndefined()
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should give up after the configured attempts and throw the last error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(send('universityApi', mockMessage)).rejects.toThrow(
        'An error occurred while sending message to universityApi for submission DF-REF-123'
      )
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should not retry a 400, which would fail identically every time', async () => {
      mockFetch.mockResolvedValue(failWith(400, 'Bad Request'))

      await expect(send('universityApi', mockMessage)).rejects.toThrow(
        'Failed to send message to universityApi for submission DF-REF-123: Bad Request'
      )
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should not retry a 401', async () => {
      mockFetch.mockResolvedValue(failWith(401, 'Unauthorized'))

      await expect(send('universityApi', mockMessage)).rejects.toThrow(
        'Unauthorized'
      )
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
