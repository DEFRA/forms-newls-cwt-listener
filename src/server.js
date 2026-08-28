import Hapi from '@hapi/hapi'
import { secureContext } from '@defra/hapi-secure-context'

import { config } from './config.js'
import { auth } from './plugins/auth/index.js'
import { router } from './plugins/router.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { failAction } from './common/helpers/fail-action.js'
import { pulse } from './common/helpers/pulse.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { createLogger } from './common/helpers/logging/logger.js'
import { describeProxyInfo } from './common/helpers/proxy/proxy-info.js'
import { checkDestinationsAreConfigured } from './service/rule-mapping/destinations.js'
import { runTask } from './tasks/receive-messages.js'

const logger = createLogger()

/** @type {number} */
const numberOfCoroutines = config.get('numberOfConcurrentPollingCoroutines')

async function createServer() {
  logger.info(`Startup outbound ${describeProxyInfo()}`)

  // Skipped under test for the same reason config.validate() is: the suite runs
  // without the deployed environment's destination settings.
  if (!config.get('isTest')) {
    const { mappingsDir } = /** @type {{ mappingsDir: string }} */ (
      config.get('mappingEngine')
    )
    checkDestinationsAreConfigured(mappingsDir)
  }

  const server = Hapi.server({
    host: /** @type {string} */ (config.get('host')),
    port: /** @type {number} */ (config.get('port')),
    routes: {
      auth: {
        mode: 'required'
      },
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
  // auth           - Azure OIDC JWT strategy, the default for all routes
  // router         - routes used in the app
  await server.register([
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    auth,
    router
  ])

  for (let i = 0; i < numberOfCoroutines; i++) {
    await runTask()
  }

  return server
}

export { createServer }
