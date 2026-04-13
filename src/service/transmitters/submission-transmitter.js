import fetch from 'node-fetch'
import { config } from '../../config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * Submits the message to the University of Southampton API.
 * @param {import('../mappers/types.js').TransmittableFormOutput} message
 * @returns {Promise<void>}
 */
export async function send(message) {
  const { universityApiUrl, universityApiKey } =
    /** @type {{ universityApiUrl: string, universityApiKey: string }} */ (
      config.get()
    )

  if (!universityApiUrl) {
    throw new Error('universityApiUrl is not configured')
  }

  const jsonPayload = JSON.stringify(message)
  const body = new URLSearchParams({
    json_form_data: jsonPayload
  })

  logger.debug(
    { event: { payload: jsonPayload } },
    'Sending message to API with payload: %s',
    jsonPayload
  )
  let response
  try {
    response = await fetch(universityApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'api-key': universityApiKey
      },
      body
    })
  } catch (error) {
    const err = new Error('An error occurred while sending message to API')
    err.cause = error
    throw err
  }

  const responseBody = await response.text()

  if (!response.ok) {
    logger.error(
      {
        statusCode: response.status,
        statusText: response.statusText,
        body: responseBody
      },
      'Failed to send message to API'
    )
    throw new Error(`Failed to send message to API: ${response.statusText}`)
  }

  logger.info(
    { statusCode: response.status, body: responseBody },
    'Successfully sent message to API'
  )
}
