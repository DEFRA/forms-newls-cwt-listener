/**
 * Resolves the name a mapping file gives its destination (e.g. "universityApi")
 * to that destination's settings: where to send, how to authenticate, which
 * handler encodes the request and how hard to retry.
 */

import { config } from '../../config.js'
import { resolveHandler } from './handlers/index.js'

/**
 * @typedef {import('./handlers/index.js').DestinationHandler} DestinationHandler
 */

/**
 * @typedef {object} RetryPolicy
 * @property {number} maxAttempts - Attempts per send, including the first
 * @property {number} initialDelayMs - Delay before the second attempt
 * @property {number} maxDelayMs - Ceiling for any single back-off delay
 */

/**
 * @typedef {object} DestinationSettings
 * @property {string} name - The name mapping files use to select this destination
 * @property {string} url - Address the mapped payloads are sent to
 * @property {string | null} apiKey - Credential passed to the handler
 * @property {string | null} healthCheckUrl - Address the health route probes, if any
 * @property {DestinationHandler} handler - Encodes and authenticates requests
 * @property {RetryPolicy} retry - Back-off policy for sends to this destination
 */

/**
 * @typedef {object} RawDestinationSettings
 * @property {string | null} [url]
 * @property {string | null} [apiKey]
 * @property {string | null} [healthCheckUrl]
 * @property {string} [handler]
 * @property {RetryPolicy} [retry]
 */

/**
 * @returns {Record<string, RawDestinationSettings>}
 */
function getAllDestinationSettings() {
  return (
    /** @type {Record<string, RawDestinationSettings> | undefined} */ (
      config.get('destinations')
    ) ?? {}
  )
}

/**
 * The destination names this service has config for. A mapping file may only
 * name one of these.
 * @returns {string[]}
 */
export function getConfiguredDestinationNames() {
  return Object.keys(getAllDestinationSettings())
}

/**
 * Resolves a destination name to its settings.
 * @param {string} name - The destination name from a mapping file
 * @returns {DestinationSettings}
 */
export function getDestinationSettings(name) {
  const settings = getAllDestinationSettings()[name]

  if (!settings) {
    const configured = getConfiguredDestinationNames()
    throw new Error(
      `Destination "${name}" has no configuration. Configured destinations: ${
        configured.length ? configured.join(', ') : 'none'
      }`
    )
  }

  if (!settings.handler) {
    throw new Error(`Destination "${name}" does not name a handler`)
  }

  return {
    name,
    url: settings.url ?? '',
    apiKey: settings.apiKey ?? null,
    healthCheckUrl: settings.healthCheckUrl ?? null,
    handler: resolveHandler(settings.handler),
    retry: {
      maxAttempts: settings.retry?.maxAttempts ?? 3,
      initialDelayMs: settings.retry?.initialDelayMs ?? 500,
      maxDelayMs: settings.retry?.maxDelayMs ?? 10000
    }
  }
}
