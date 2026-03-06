import { token } from '@hapi/jwt'

// import { config } from '../config.js'
import { postJson } from './fetch.js'

// const notifyAPIKey = /** @type {string} */ (config.get('notifyAPIKey'))
const notifyAPIKey = 'dummy'

const API_KEY_SUBSTRING_REDUCTION = 36
const SERVICE_ID_SUBSTRING_REDUCTION = 73
const SERVICE_ID_SUBSTRING_REDUCTION_2 = 37

// Extract the two uuids from the notifyApiKey
// See https://github.com/alphagov/notifications-node-client/blob/main/client/api_client.js#L17
// Needed until `https://github.com/alphagov/notifications-node-client/pull/200` is published
const apiKeyId = /** @type {string} */ (
  notifyAPIKey.substring(
    notifyAPIKey.length - API_KEY_SUBSTRING_REDUCTION,
    notifyAPIKey.length
  )
)
const serviceId = /** @type {string} */ (
  notifyAPIKey.substring(
    notifyAPIKey.length - SERVICE_ID_SUBSTRING_REDUCTION,
    notifyAPIKey.length - SERVICE_ID_SUBSTRING_REDUCTION_2
  )
)

/**
 * @typedef {{
 *   templateId: string
 *   emailAddress: string
 *   personalisation: { subject: string; body: string }
 * }} SendNotificationArgs
 */

/**
 * @param {string} iss
 * @param {string} secret
 */
function createToken(iss, secret) {
  const iat = Math.round(Date.now() / 1000)

  return token.generate({ iss, iat }, secret, {
    header: { typ: 'JWT', alg: 'HS256' }
  })
}

const NOTIFICATIONS_URL = new URL(
  '/v2/notifications/email',
  'https://api.notifications.service.gov.uk'
)

/**
 * Helper method to call Gov uk Notify should it be needed
 * @param {SendNotificationArgs} args
 * @returns {Promise<{response: object, body: unknown}>}
 */
export async function sendNotification(args) {
  const { templateId, emailAddress, personalisation } = args

  return postJson(NOTIFICATIONS_URL, {
    payload: {
      template_id: templateId,
      email_address: emailAddress,
      personalisation
    },
    headers: {
      Authorization: 'Bearer ' + createToken(serviceId, apiKeyId)
    }
  })
}
