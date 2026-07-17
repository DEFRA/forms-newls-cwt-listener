/**
 * Handler registry: the request quirks of a particular destination API - how
 * the payload is encoded on the wire, how a request is authenticated - live in
 * a handler, which keeps the transmitter itself a plain REST sender.
 *
 * A destination names its handler in its config block. That name is not exposed
 * as an environment variable: which handler an API needs is a code-level fact
 * about that API, not something an environment gets to choose.
 */

import { jsonFormDataHandler } from './json-form-data.js'

/**
 * @typedef {object} EncodedRequestBody
 * @property {BodyInit} body - The encoded payload to send
 * @property {string} contentType - Content type describing the encoded body
 */

/**
 * @typedef {object} DestinationHandler
 * @property {(message: Record<string, unknown>) => EncodedRequestBody} encodePayload -
 *   Encodes the mapped payload into a request body
 * @property {(apiKey: string | null) => Record<string, string>} authHeaders -
 *   Headers authenticating a request to the destination
 */

/** @type {Record<string, DestinationHandler>} */
const handlers = {
  jsonFormData: jsonFormDataHandler
}

/**
 * The handler names a destination's config may select.
 * @returns {string[]}
 */
export function knownHandlerNames() {
  return Object.keys(handlers)
}

/**
 * Resolves a handler name to its implementation.
 * @param {string} name - The handler name from the destination's config
 * @returns {DestinationHandler}
 */
export function resolveHandler(name) {
  const handler = handlers[name]
  if (!handler) {
    throw new Error(
      `Unknown destination handler "${name}", expected one of: ${knownHandlerNames().join(', ')}`
    )
  }
  return handler
}
