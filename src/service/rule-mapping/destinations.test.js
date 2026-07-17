import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../transmitters/submission-transmitter.js', () => ({
  send: vi.fn()
}))
vi.mock('../transmitters/destination-config.js', () => ({
  getDestinationSettings: vi.fn()
}))
vi.mock('./registry.js', () => ({
  loadRegistry: vi.fn()
}))
vi.mock('../../common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  })
}))

const { resolveDestination, checkDestinationsAreConfigured } =
  await import('./destinations.js')
const { send } = await import('../transmitters/submission-transmitter.js')
const { getDestinationSettings } =
  await import('../transmitters/destination-config.js')
const { loadRegistry } = await import('./registry.js')

describe('resolveDestination', () => {
  it('sends through the transmitter using the name from the mapping file', async () => {
    const sender = resolveDestination({ type: 'rest', name: 'somewhereElse' })
    const payload = { field: 'value' }

    await sender(payload)

    expect(send).toHaveBeenCalledWith('somewhereElse', payload)
  })

  it('throws for unsupported destination types', () => {
    expect(() =>
      resolveDestination(
        /** @type {any} */ ({ type: 'queue', name: 'universityApi' })
      )
    ).toThrow('Unsupported destination type "queue"')
  })
})

describe('checkDestinationsAreConfigured', () => {
  /**
   * @param {string[]} destinationNames
   */
  function mockMappings(destinationNames) {
    vi.mocked(loadRegistry).mockReturnValue(
      /** @type {any} */ ({
        mappings: destinationNames.map((name) => ({
          destination: { type: 'rest', name }
        }))
      })
    )
  }

  beforeEach(() => {
    vi.mocked(getDestinationSettings).mockImplementation(
      /** @type {any} */ ((name) => ({ name, url: 'https://example.com/api' }))
    )
  })

  it('passes when every named destination is configured', () => {
    mockMappings(['universityApi'])

    expect(() => checkDestinationsAreConfigured('mappings')).not.toThrow()
  })

  it('checks a destination used by several mappings only once', () => {
    mockMappings(['universityApi', 'universityApi', 'universityApi'])

    checkDestinationsAreConfigured('mappings')

    expect(getDestinationSettings).toHaveBeenCalledTimes(1)
  })

  it('throws when a named destination has no config', () => {
    mockMappings(['somewhereElse'])
    vi.mocked(getDestinationSettings).mockImplementation((name) => {
      throw new Error(`Destination "${name}" has no configuration`)
    })

    expect(() => checkDestinationsAreConfigured('mappings')).toThrow(
      'Destination "somewhereElse" has no configuration'
    )
  })

  it('throws when a named destination has no valid URL', () => {
    mockMappings(['universityApi'])
    vi.mocked(getDestinationSettings).mockReturnValue(
      /** @type {any} */ ({ name: 'universityApi', url: '' })
    )

    expect(() => checkDestinationsAreConfigured('mappings')).toThrow(
      'Destination "universityApi" has no valid URL configured'
    )
  })

  it('reports every problem rather than only the first', () => {
    mockMappings(['universityApi', 'somewhereElse'])
    vi.mocked(getDestinationSettings).mockImplementation(
      /** @type {any} */ ((name) => ({ name, url: 'not-a-url' }))
    )

    expect(() => checkDestinationsAreConfigured('mappings')).toThrow(
      /somewhereElse[\s\S]*universityApi/
    )
  })
})
