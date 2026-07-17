/**
 * Generic REST transmitter: POSTs a mapped payload to whichever destination the
 * mapping file named, retrying transient failures.
 *
 * Nothing here knows about a particular API. The address, credential and
 * back-off policy come from the destination's config, and anything unusual
 * about how a given API wants its requests encoded lives in that destination's
 * handler.
 */

import { createLogger } from '../../common/helpers/logging/logger.js'
import { withRetry } from '../../lib/retry.js'
import { getDestinationSettings } from './destination-config.js'

const logger = createLogger()

const TOO_MANY_REQUESTS = 429
const SERVER_ERROR = 500

/**
 * @typedef {import('./destination-config.js').DestinationSettings} DestinationSettings
 */

/**
 * An error carrying whether the failed send is worth retrying.
 * @typedef {Error & { retryable?: boolean }} TransmissionError
 */

/**
 * Whether a failed response is transient. Server errors and rate limiting are
 * expected to clear; anything else in the 4xx range (a bad payload, a rejected
 * api key) will fail identically however many times it is sent.
 * @param {number} status
 * @returns {boolean}
 */
function isRetryableStatus(status) {
  return status >= SERVER_ERROR || status === TOO_MANY_REQUESTS
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isRetryableError(error) {
  return (
    error instanceof Error &&
    /** @type {TransmissionError} */ (error).retryable === true
  )
}

/**
 * Posts the payload to the destination once.
 * @param {DestinationSettings} destination
 * @param {Record<string, unknown> & { DF_reference_number?: string }} message
 * @returns {Promise<void>}
 */
async function sendOnce(destination, message) {
  const { handler, name, url } = destination
  const { body, contentType } = handler.encodePayload(message)
  const referenceNumber = message.DF_reference_number

  logger.debug(
    `Sending message to ${name} with payload: ${JSON.stringify(message)}`
  )

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        ...handler.authHeaders(destination.apiKey)
      },
      body
    })
  } catch (error) {
    const err = /** @type {TransmissionError} */ (
      new Error(
        `An error occurred while sending message to ${name} for submission ${referenceNumber}`
      )
    )
    err.cause = error
    err.retryable = true
    throw err
  }

  const responseBody = await response.text()

  if (!response.ok) {
    logger.error(
      `Failed to send message to ${name} for submission ${referenceNumber} with status ${response.status} ${response.statusText}: ${responseBody}`
    )
    const err = /** @type {TransmissionError} */ (
      new Error(
        `Failed to send message to ${name} for submission ${referenceNumber}: ${response.statusText}`
      )
    )
    err.retryable = isRetryableStatus(response.status)
    throw err
  }

  logger.info(
    `Successfully sent message to ${name} for submission ${referenceNumber} with status ${response.status}`
  )
}

/**
 * Submits the message to a destination, retrying transient failures with
 * exponential back-off.
 * @param {string} destinationName - The destination named by the mapping file
 * @param {Record<string, unknown> & { DF_reference_number?: string }} message - The mapped output payload
 * @returns {Promise<void>}
 */
export async function send(destinationName, message) {
  const destination = getDestinationSettings(destinationName)

  if (!destination.url) {
    throw new Error(`Destination "${destinationName}" has no url configured`)
  }

  const { maxAttempts, initialDelayMs, maxDelayMs } = destination.retry

  await withRetry(() => sendOnce(destination, message), {
    maxAttempts,
    initialDelayMs,
    maxDelayMs,
    shouldRetry: isRetryableError,
    description: `submission ${message.DF_reference_number} to ${destinationName}`
  })
}
