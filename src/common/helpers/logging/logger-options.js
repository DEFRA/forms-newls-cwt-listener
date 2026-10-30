import { logContextMixin } from '@defra/forms-common'
import { ecsFormat } from '@elastic/ecs-pino-format'
import { config } from '../../../config.js'

const logConfig =
  /** @type {{ isEnabled: boolean, level: string, format: 'ecs' | 'pino-pretty', redact: string[] }} */ (
    config.get('log')
  )
/** @type {string} */
const serviceName = config.get('serviceName')
/** @type {string | null} */
const serviceVersion = config.get('serviceVersion')

const formatters = {
  ecs: {
    ...ecsFormat({
      serviceVersion,
      serviceName
    })
  },
  'pino-pretty': { transport: { target: 'pino-pretty' } }
}

export const loggerOptions = {
  enabled: logConfig.isEnabled,
  ignorePaths: ['/health'],
  redact: {
    paths: logConfig.redact,
    remove: true
  },
  level: logConfig.level,
  ...formatters[logConfig.format],
  nesting: true,
  mixin: logContextMixin
}
