import Jwt from '@hapi/jwt'

import { config } from '../../config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { getUserScopes } from '../../service/entitlements/service.js'

const logger = createLogger()

/** @type {string} */
const oidcJwksUri = config.get('oidcJwksUri')
/** @type {string} */
const oidcVerifyAud = config.get('oidcVerifyAud')
/** @type {string} */
const oidcVerifyIss = config.get('oidcVerifyIss')

/**
 * Validates user credentials from JWT token
 * @param {Artifacts<UserProfile>} artifacts - JWT artifacts
 * @returns {Promise<{ isValid: boolean, credentials?: { user: UserProfile, scope: string[] } }>} Validation result
 */
async function validateUserCredentials(artifacts) {
  const user = artifacts.decoded.payload

  if (!user) {
    logger.info('[authMissingUser] Auth: Missing user from token payload.')
    return {
      isValid: false
    }
  }

  const { oid } = user
  if (!oid) {
    logger.info('[authMissingOID] Auth: User OID is missing in token payload.')
    return {
      isValid: false
    }
  }

  const authToken = artifacts.token
  const userScopes = await getUserScopes(oid, authToken)

  return {
    isValid: true,
    credentials: {
      user,
      scope: userScopes
    }
  }
}

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const auth = {
  plugin: {
    name: 'auth',
    async register(server) {
      await server.register(Jwt)

      server.auth.strategy('azure-oidc-token', 'jwt', {
        keys: {
          uri: oidcJwksUri
        },
        verify: {
          aud: oidcVerifyAud,
          iss: oidcVerifyIss,
          sub: false,
          nbf: true,
          exp: true
        },
        validate: validateUserCredentials
      })

      // Set as the default strategy
      server.auth.default('azure-oidc-token')
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 * @import { Artifacts, UserProfile } from './types.js'
 */
