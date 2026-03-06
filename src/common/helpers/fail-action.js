import { createLogger } from './logging/logger.js'

const logger = createLogger()

/** @type {import('@hapi/hapi').Lifecycle.FailAction} */
export const failAction = function failAction(_request, _h, error) {
  logger.warn(error, error?.message)
  throw error
}
