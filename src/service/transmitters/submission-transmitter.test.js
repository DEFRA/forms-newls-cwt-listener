import { config } from '../../config.js'
import { send } from './submission-transmitter.js'

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }))
vi.mock('node-fetch', () => ({ default: mockFetch }))
vi.mock('../../config.js')
vi.mock('../../common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}))

const mockMessage = { formId: 'test', data: { field: 'value' } }

describe('submission-transmitter', () => {
  beforeEach(() => {
    vi.mocked(config.get).mockReturnValue(
      /** @type {any} */ ({
        universityApiUrl: 'http://example.com/api',
        universityApiKey: 'test-api-key'
      })
    )
  })

  it('should throw if universityApiUrl is not configured', async () => {
    vi.mocked(config.get).mockReturnValue(
      /** @type {any} */ ({
        universityApiUrl: '',
        universityApiKey: 'test-api-key'
      })
    )

    await expect(send(mockMessage)).rejects.toThrow(
      'universityApiUrl is not configured'
    )
  })

  it('should send a POST request with correct headers and body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('OK')
    })

    await send(mockMessage)

    expect(mockFetch).toHaveBeenCalledWith('http://example.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'api-key': 'test-api-key'
      },
      body: `json_form_data=${JSON.stringify(mockMessage)}`
    })
  })

  it('should resolve on successful response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('OK')
    })

    await expect(send(mockMessage)).resolves.toBeUndefined()
  })

  it('should throw when fetch rejects with a network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(send(mockMessage)).rejects.toThrow(
      'An error occurred while sending message to API'
    )
  })

  it('should set the original error as the cause on network error', async () => {
    const networkError = new Error('Network error')
    mockFetch.mockRejectedValue(networkError)

    try {
      await send(mockMessage)
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

    await expect(send(mockMessage)).rejects.toThrow(
      'Failed to send message to API: Internal Server Error'
    )
  })
})
