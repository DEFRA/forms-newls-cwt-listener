import { config } from '../../config.js'
import { jsonFormDataHandler } from './handlers/json-form-data.js'
import {
  getConfiguredDestinationNames,
  getDestinationSettings
} from './destination-config.js'

vi.mock('../../config.js')

/**
 * @param {Record<string, object>} destinations
 */
function mockDestinations(destinations) {
  vi.mocked(config.get).mockImplementation(
    /** @type {any} */ (
      (key) => (key === 'destinations' ? destinations : undefined)
    )
  )
}

describe('getConfiguredDestinationNames', () => {
  it('lists the configured destination names', () => {
    mockDestinations({ universityApi: {}, somewhereElse: {} })

    expect(getConfiguredDestinationNames()).toEqual([
      'universityApi',
      'somewhereElse'
    ])
  })

  it('is empty when nothing is configured', () => {
    mockDestinations(/** @type {any} */ (undefined))

    expect(getConfiguredDestinationNames()).toEqual([])
  })
})

describe('getDestinationSettings', () => {
  it('resolves settings and the named handler', () => {
    mockDestinations({
      universityApi: {
        url: 'https://example.com/api',
        apiKey: 'a-key',
        healthCheckUrl: 'https://example.com/api?is_alive=1',
        handler: 'jsonFormData',
        retry: { maxAttempts: 5, initialDelayMs: 100, maxDelayMs: 2000 }
      }
    })

    expect(getDestinationSettings('universityApi')).toEqual({
      name: 'universityApi',
      url: 'https://example.com/api',
      apiKey: 'a-key',
      healthCheckUrl: 'https://example.com/api?is_alive=1',
      handler: jsonFormDataHandler,
      retry: { maxAttempts: 5, initialDelayMs: 100, maxDelayMs: 2000 }
    })
  })

  it('falls back to the default retry policy when none is given', () => {
    mockDestinations({
      universityApi: { url: 'https://example.com/api', handler: 'jsonFormData' }
    })

    expect(getDestinationSettings('universityApi').retry).toEqual({
      maxAttempts: 3,
      initialDelayMs: 500,
      maxDelayMs: 10000
    })
  })

  it('throws for a destination with no config', () => {
    mockDestinations({ universityApi: { handler: 'jsonFormData' } })

    expect(() => getDestinationSettings('somewhereElse')).toThrow(
      'Destination "somewhereElse" has no configuration'
    )
  })

  it('throws for a destination that names no handler', () => {
    mockDestinations({ universityApi: { url: 'https://example.com/api' } })

    expect(() => getDestinationSettings('universityApi')).toThrow(
      'Destination "universityApi" does not name a handler'
    )
  })

  it('throws for an unknown handler name', () => {
    mockDestinations({
      universityApi: { url: 'https://example.com/api', handler: 'nope' }
    })

    expect(() => getDestinationSettings('universityApi')).toThrow(
      'Unknown destination handler "nope"'
    )
  })
})
