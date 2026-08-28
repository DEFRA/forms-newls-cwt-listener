import Boom from '@hapi/boom'

import { config } from '../../config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { getJson } from '../../lib/fetch.js'

const logger = createLogger()

/** @type {string} */
const entitlementUrl = config.get('entitlementUrl')
const entitlementsEndpoint = new URL('/', entitlementUrl)

/**
 * Fetches user scopes from the entitlements API
 * @param {string} oid - User OID
 * @param {string} [authToken] - JWT token for authentication
 * @returns {Promise<string[]>} Array of scopes
 */
export async function getUserScopes(oid, authToken) {
  const requestUrl = new URL(`./users/${oid}`, entitlementsEndpoint)

  /** @type {{ headers?: { Authorization: string } }} */
  const options = {}
  if (authToken) {
    options.headers = {
      Authorization: `Bearer ${authToken}`
    }
  }

  try {
    logger.info(`[entitlementsApi] Fetching scopes for user ${oid}`)

    const { body } = await getJson(requestUrl, options)
    const payload = /** @type {{ entity?: { scopes?: string[] } } | null} */ (
      body
    )

    if (payload?.entity?.scopes) {
      logger.info(
        `[entitlementsApi] Retrieved ${payload.entity.scopes.length} scopes for user ${oid}`
      )
      return payload.entity.scopes
    }

    logger.warn(
      `[entitlementsApi] Invalid response format for user ${oid}, expected entity object with scopes array`
    )
    return []
  } catch (err) {
    if (Boom.isBoom(err)) {
      logger.error(
        err,
        `[entitlementsApi] Failed to fetch scopes for user ${oid}`
      )
    } else {
      logger.error(
        err,
        `[entitlementsApi] Failed to fetch scopes for user ${oid}:`
      )
    }

    return []
  }
}
