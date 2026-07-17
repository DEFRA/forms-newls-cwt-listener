import { getErrorMessage } from '../common/helpers/error-message.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import {
  getConfiguredDestinationNames,
  getDestinationSettings
} from '../service/transmitters/destination-config.js'

const logger = createLogger()

const SERVICE_UNAVAILABLE = 503

/**
 * @typedef {import('../service/transmitters/destination-config.js').DestinationSettings} DestinationSettings
 */

/**
 * Probes one destination, returning an error description or null if healthy.
 * @param {DestinationSettings} destination
 * @returns {Promise<string | null>}
 */
async function checkDestination(destination) {
  const { name, handler, healthCheckUrl } = destination

  try {
    const response = await fetch(/** @type {string} */ (healthCheckUrl), {
      method: 'GET',
      headers: handler.authHeaders(destination.apiKey)
    })

    if (!response.ok) {
      logger.error(
        `Health check for ${name} failed with status ${response.status} ${response.statusText}`
      )
      return `Destination "${name}" returned ${response.status}`
    }

    return null
  } catch (error) {
    logger.error(`Health check for ${name} errored: ${getErrorMessage(error)}`)
    return `Destination "${name}" is unreachable`
  }
}

/**
 * Health endpoint for CDP container
 */
/** @type {import('@hapi/hapi').ServerRoute} */
const health = {
  method: 'GET',
  path: '/health',
  handler: async (_request, h) => {
    const destinations = getConfiguredDestinationNames()
      .map(getDestinationSettings)
      .filter((destination) => destination.healthCheckUrl)

    const errors = (
      await Promise.all(destinations.map(checkDestination))
    ).filter((error) => error !== null)

    if (errors.length) {
      return h
        .response({ message: 'error', error: errors.join('; ') })
        .code(SERVICE_UNAVAILABLE)
    }

    return h.response({ message: 'success' })
  }
}

export { health }
