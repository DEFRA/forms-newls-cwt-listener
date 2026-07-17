/**
 * Handler for destinations that take the mapped payload as a JSON string inside
 * a form-encoded "json_form_data" field, authenticated with an "api-key"
 * header. This is what the CWT API expects; it is not how a REST service
 * usually accepts a JSON document, which is why it is a handler rather than the
 * transmitter's default behaviour.
 */

/**
 * @typedef {import('./index.js').DestinationHandler} DestinationHandler
 */

/** @type {DestinationHandler} */
export const jsonFormDataHandler = {
  encodePayload(message) {
    return {
      body: new URLSearchParams({
        json_form_data: JSON.stringify(message)
      }),
      contentType: 'application/x-www-form-urlencoded'
    }
  },

  authHeaders(apiKey) {
    return apiKey ? { 'api-key': apiKey } : {}
  }
}
