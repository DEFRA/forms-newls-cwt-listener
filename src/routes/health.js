import fetch from 'node-fetch'
import { config } from '../config.js'
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
          {
            statusCode: response.status,
            statusText: response.statusText
          },
          'Target service health check failed'
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
      logger.error({ error }, 'Target service health check errored')
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
