import { withRetry } from './retry.js'

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}))

/** Delays are set to 0 throughout so the tests assert behaviour, not timing. */
const noDelay = { initialDelayMs: 0 }

describe('withRetry', () => {
  it('returns the result without retrying when the operation succeeds', async () => {
    const operation = vi.fn().mockResolvedValue('done')

    await expect(withRetry(operation, noDelay)).resolves.toBe('done')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries until the operation succeeds', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue('done')

    await expect(withRetry(operation, noDelay)).resolves.toBe('done')
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it('throws the last error once the attempts are exhausted', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockRejectedValueOnce(new Error('third'))

    await expect(
      withRetry(operation, { ...noDelay, maxAttempts: 3 })
    ).rejects.toThrow('third')
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it('defaults to three attempts', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('nope'))

    await expect(withRetry(operation, noDelay)).rejects.toThrow('nope')
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it('makes a single attempt when maxAttempts is 1', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('nope'))

    await expect(
      withRetry(operation, { ...noDelay, maxAttempts: 1 })
    ).rejects.toThrow('nope')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('gives up immediately on an error the caller deems permanent', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('bad request'))

    await expect(
      withRetry(operation, { ...noDelay, shouldRetry: () => false })
    ).rejects.toThrow('bad request')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries only the errors the caller deems transient', async () => {
    const transient = Object.assign(new Error('transient'), { retryable: true })
    const permanent = Object.assign(new Error('permanent'), {
      retryable: false
    })
    const operation = vi
      .fn()
      .mockRejectedValueOnce(transient)
      .mockRejectedValueOnce(permanent)

    await expect(
      withRetry(operation, {
        ...noDelay,
        maxAttempts: 5,
        shouldRetry: (/** @type {any} */ error) => error.retryable === true
      })
    ).rejects.toThrow('permanent')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('backs off for longer on each attempt, up to the ceiling', async () => {
    vi.useFakeTimers()
    try {
      /** @type {number[]} */
      const delays = []
      const timeout = vi
        .spyOn(global, 'setTimeout')
        .mockImplementation((/** @type {any} */ callback, ms) => {
          delays.push(/** @type {number} */ (ms))
          callback()
          return /** @type {any} */ (0)
        })

      const operation = vi.fn().mockRejectedValue(new Error('nope'))

      await expect(
        withRetry(operation, {
          maxAttempts: 5,
          initialDelayMs: 100,
          maxDelayMs: 400,
          factor: 2
        })
      ).rejects.toThrow('nope')

      // Jitter halves a delay at most, so each band is [50%, 100%] of 100/200/400/400
      expect(delays).toHaveLength(4)
      expect(delays[0]).toBeGreaterThanOrEqual(50)
      expect(delays[0]).toBeLessThanOrEqual(100)
      expect(delays[1]).toBeGreaterThanOrEqual(100)
      expect(delays[1]).toBeLessThanOrEqual(200)
      expect(delays[2]).toBeGreaterThanOrEqual(200)
      expect(delays[2]).toBeLessThanOrEqual(400)
      expect(delays[3]).toBeGreaterThanOrEqual(200)
      expect(delays[3]).toBeLessThanOrEqual(400)

      timeout.mockRestore()
    } finally {
      vi.useRealTimers()
    }
  })
})
