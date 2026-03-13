import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('./transmitters/submission-transmitter.js', () => ({
  send: vi.fn()
}))

vi.mock('../config.js', () => ({
  config: {
    get: vi.fn(() => ({
      adviceFormId: 'advice-form-id',
      assentFormId: 'assent-form-id',
      consentFormId: 'consent-form-id'
    }))
  }
}))

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

const { handleFormSubmission } = await import('./submission-handler.js')
const { send } = await import('./transmitters/submission-transmitter.js')

/**
 * Builds a minimal form submission message for testing.
 * @param {string} formId
 * @param {Record<string, unknown>} [mainData]
 * @returns {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage}
 */
function buildSubmissionMessage(formId, mainData = {}) {
  return /** @type {any} */ ({
    messageId: 'test-message-id',
    meta: {
      formId,
      formName: 'Test',
      formSlug: 'test'
    },
    data: {
      main: mainData,
      repeaters: {},
      files: {}
    }
  })
}

describe('submission-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle advice form submission', async () => {
    const message = buildSubmissionMessage('advice-form-id', {
      teEzOl: 'Landowner',
      xzEslQ: 'Something else',
      hUpejP: 'Test User',
      YOPYRe: 'test@example.com'
    })

    await handleFormSubmission(message)

    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ form_type: 'advice' })
    )
  })

  it('should handle assent form submission', async () => {
    const message = buildSubmissionMessage('assent-form-id', {
      htlAAq: 'John',
      pPocjH: 'Doe',
      skdDtj: 'john@example.com'
    })

    await handleFormSubmission(message)

    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ form_type: 'assent' })
    )
  })

  it('should handle consent form submission', async () => {
    const message = buildSubmissionMessage('consent-form-id', {
      htlAAq: 'Jane',
      pPocjH: 'Smith',
      skdDtj: 'jane@example.com'
    })

    await handleFormSubmission(message)

    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ form_type: 'consent' })
    )
  })

  it('should not send for unknown form IDs', async () => {
    const message = buildSubmissionMessage('unknown-form-id')

    await handleFormSubmission(message)

    expect(send).not.toHaveBeenCalled()
  })

  it('should warn and return for undefined message', async () => {
    // @ts-expect-error - testing undefined message
    await handleFormSubmission(undefined)

    expect(send).not.toHaveBeenCalled()
  })
})
