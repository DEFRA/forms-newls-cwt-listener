import { config } from '../config.js'
import { getErrorMessage } from '../common/helpers/error-message.js'
import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * Health endpoint for CDP container
 */
/** @type {import('@hapi/hapi').ServerRoute} */
const health = {
  method: 'GET',
  path: '/health',
  handler: async (_request, h) => {
    const { universityApiHealthCheckUrl, universityApiKey } =
      /** @type {{ universityApiHealthCheckUrl: string | null, universityApiKey: string | null }} */ (
        config.get()
      )

    if (!universityApiHealthCheckUrl) {
      return h.response({ message: 'success' })
    }

    try {
      const response = await fetch(universityApiHealthCheckUrl, {
        method: 'GET',
        headers: {
          'api-key': universityApiKey ?? ''
        }
      })

      if (!response.ok) {
        logger.error(
          `Target service health check failed with status ${response.status} ${response.statusText}`
        )
        return h
          .response({
            message: 'error',
            error: `Target service returned ${response.status}`
          })
          .code(503)
      }

      return h.response({ message: 'success' })
    } catch (error) {
      logger.error(
        `Target service health check errored: ${getErrorMessage(error)}`
      )
      return h
        .response({
          message: 'error',
          error: 'Target service is unreachable'
        })
        .code(503)
    }
  }
}

export { health }
