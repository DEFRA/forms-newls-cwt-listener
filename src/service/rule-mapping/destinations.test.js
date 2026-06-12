import { vi, describe, it, expect } from 'vitest'

vi.mock('../transmitters/submission-transmitter.js', () => ({
  send: vi.fn()
}))

const { resolveDestination } = await import('./destinations.js')
const { send } = await import('../transmitters/submission-transmitter.js')

describe('resolveDestination', () => {
  it('resolves the universityApi rest destination to the transmitter', () => {
    const sender = resolveDestination({ type: 'rest', name: 'universityApi' })
    expect(sender).toBe(send)
  })

  it('throws for unsupported destination types', () => {
    expect(() =>
      resolveDestination(
        /** @type {any} */ ({ type: 'queue', name: 'universityApi' })
      )
    ).toThrow('Unsupported destination type "queue"')
  })

  it('throws for unknown destination names', () => {
    expect(() =>
      resolveDestination({ type: 'rest', name: 'somewhereElse' })
    ).toThrow('Unknown destination "somewhereElse"')
  })
})
