import Boom from '@hapi/boom'

/**
 * Safely extracts error message from unknown error types and the Boom message from Boom errors
 * @param {unknown} error - The error to extract message from
 * @returns {string} The error message
 */
export function getErrorMessage(error) {
  if (Boom.isBoom(error)) {
    const boomMessages =
      /** @type {{ error: string, message: string }[] | undefined } */ (
        /** @type {{ data?: { errors?: { error: string, message: string }[] } }} */ (
          error
        ).data?.errors
      )
    const boomMessage = boomMessages
      ? boomMessages.map((e) => `${e.error}: ${e.message}`).join(', ')
      : ''
    return `${error.message} ${boomMessage}`.trim()
  }
  return error instanceof Error ? error.message : String(error)
}
