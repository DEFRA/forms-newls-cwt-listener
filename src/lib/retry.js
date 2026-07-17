/**
 * Exponential back-off retry for transient failures.
 *
 * This exists to keep transient errors from reaching the queue-level retry.
 */

import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_INITIAL_DELAY_MS = 500
const DEFAULT_MAX_DELAY_MS = 10000
const DEFAULT_FACTOR = 2
const JITTER_FLOOR = 0.5

/**
 * @typedef {object} RetryOptions
 * @property {number} [maxAttempts] - Total attempts, including the first (default 3)
 * @property {number} [initialDelayMs] - Delay before the second attempt (default 500)
 * @property {number} [maxDelayMs] - Ceiling for any single delay (default 10000)
 * @property {number} [factor] - Multiplier applied per attempt (default 2)
 * @property {(error: unknown) => boolean} [shouldRetry] - Whether an error is
 *   worth retrying. Defaults to retrying everything; callers that can tell a
 *   permanent failure from a transient one should say so here
 * @property {string} [description] - Used in the retry log lines
 */

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Back-off delay for the given attempt, with jitter.
 *
 * Jitter matters because a batch of queue messages is handled concurrently:
 * without it, a destination that just rejected several sends would receive
 * every retry at the same instant.
 * @param {number} attempt - 1-based number of the attempt that just failed
 * @param {Required<Pick<RetryOptions, 'initialDelayMs' | 'maxDelayMs' | 'factor'>>} options
 * @returns {number}
 */
function backOffDelay(attempt, options) {
  const exponential = options.initialDelayMs * options.factor ** (attempt - 1)
  const capped = Math.min(exponential, options.maxDelayMs)
  return Math.round(capped * (JITTER_FLOOR + Math.random() * JITTER_FLOOR))
}

/**
 * Runs an operation, retrying transient failures with exponential back-off.
 *
 * The error from the final attempt is thrown; earlier errors are logged. An
 * error the caller deems permanent is thrown immediately, without waiting out
 * the remaining attempts.
 * @template T
 * @param {() => Promise<T>} operation - The operation to run
 * @param {RetryOptions} [options]
 * @returns {Promise<T>}
 */
export async function withRetry(operation, options = {}) {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const initialDelayMs = options.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS
  const factor = options.factor ?? DEFAULT_FACTOR
  const shouldRetry = options.shouldRetry ?? (() => true)
  const description = options.description ?? 'operation'

  for (let attempt = 1; ; attempt++) {
    try {
      return await operation()
    } catch (error) {
      const isLastAttempt = attempt >= maxAttempts

      if (isLastAttempt || !shouldRetry(error)) {
        throw error
      }

      const delay = backOffDelay(attempt, {
        initialDelayMs,
        maxDelayMs,
        factor
      })

      logger.warn(
        `Attempt ${attempt} of ${maxAttempts} failed for ${description}, retrying in ${delay}ms: ${
          error instanceof Error ? error.message : String(error)
        }`
      )

      await sleep(delay)
    }
  }
}
