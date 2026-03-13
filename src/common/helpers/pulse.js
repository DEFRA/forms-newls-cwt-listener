import hapiPulse from 'hapi-pulse'
import { createLogger } from './logging/logger.js'

const tenSeconds = 10 * 1000

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- hapi-pulse has no type declarations
const hapiPulsePlugin =
  /** @type {import('@hapi/hapi').Plugin<{ logger: unknown, timeout: number }>} */ (
    /** @type {unknown} */ (hapiPulse)
  )

const pulse = {
  plugin: hapiPulsePlugin,
  options: {
    logger: createLogger(),
    timeout: tenSeconds
  }
}

export { pulse }
