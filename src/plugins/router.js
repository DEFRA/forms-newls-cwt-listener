import admin from '../routes/admin.js'
import { health } from '../routes/health.js'

/**
 * Router plugin, needed to return a 200 on ECS /health endpoint
 */
const router = {
  plugin: {
    name: 'router',
    register: (
      /** @type {import('@hapi/hapi').Server} */ server,
      /** @type {unknown} */ _options
    ) => {
      server.route([health, ...admin])
    }
  }
}

export { router }
