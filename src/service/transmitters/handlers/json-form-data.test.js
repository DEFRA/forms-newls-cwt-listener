import { describe, it, expect } from 'vitest'

import { jsonFormDataHandler } from './json-form-data.js'

describe('jsonFormDataHandler', () => {
  it('encodes the payload as JSON inside a form-encoded field', () => {
    const message = { DF_reference_number: 'DF-REF-123', data: { a: 1 } }

    const { body, contentType } = jsonFormDataHandler.encodePayload(message)

    expect(contentType).toBe('application/x-www-form-urlencoded')
    expect(body).toEqual(
      new URLSearchParams({ json_form_data: JSON.stringify(message) })
    )
  })

  it('authenticates with an api-key header', () => {
    expect(jsonFormDataHandler.authHeaders('a-key')).toEqual({
      'api-key': 'a-key'
    })
  })

  it('sends an empty api-key when none is configured', () => {
    expect(jsonFormDataHandler.authHeaders(null)).toEqual({ 'api-key': '' })
  })
})
