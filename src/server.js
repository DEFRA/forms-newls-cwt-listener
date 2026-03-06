import Hapi from '@hapi/hapi'
import { secureContext } from '@defra/hapi-secure-context'

import { config } from './config.js'
import { router } from './plugins/router.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { failAction } from './common/helpers/fail-action.js'
import { pulse } from './common/helpers/pulse.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import { runTask } from './tasks/receive-messages.js'

/** @type {number} */
const numberOfCoroutines = config.get('numberOfConcurrentPollingCoroutines')

async function createServer() {
  setupProxy()
  const server = Hapi.server({
    host: /** @type {string} */ (config.get('host')),
    port: /** @type {number} */ (config.get('port')),
    routes: {
      validate: {
        options: {
          abortEarly: false
        },
        failAction
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  // Hapi Plugins:
  // requestLogger  - automatically logs incoming requests
  // requestTracing - trace header logging and propagation
  // secureContext  - loads CA certificates from environment config
  // pulse          - provides shutdown handlers
  // router         - routes used in the app
  await server.register([
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    router
  ])

  for (let i = 0; i < numberOfCoroutines; i++) {
    await runTask()
  }

  return server
}

export { createServer }
