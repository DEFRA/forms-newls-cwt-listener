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

  it('omits the api-key header when none is configured', () => {
    expect(jsonFormDataHandler.authHeaders(null)).toEqual({})
    expect(jsonFormDataHandler.authHeaders('')).toEqual({})
    expect(jsonFormDataHandler.authHeaders(undefined)).toEqual({})
  })
})
