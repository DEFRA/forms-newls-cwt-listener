import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('./transmitters/submission-transmitter.js', () => ({
  send: vi.fn()
}))

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

// Real form ids matching the mapping files in /mappings
const ADVICE_FORM_ID = '69a07d92093ab56d4fa9f325'
const ASSENT_FORM_ID = '69a1a593093ab56d4fa9f330'
const CONSENT_FORM_ID = '69a1a64c093ab56d4fa9f339'

vi.mock('../config.js', () => ({
  config: {
    get: vi.fn((/** @type {string | undefined} */ key) => {
      if (key === 'mappingEngine') {
        return { mappingsDir: 'mappings' }
      }
      return {}
    })
  }
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
      formSlug: 'test',
      referenceNumber: '111-222-333'
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
    const message = buildSubmissionMessage(ADVICE_FORM_ID, {
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
    const message = buildSubmissionMessage(ASSENT_FORM_ID, {
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
    const message = buildSubmissionMessage(CONSENT_FORM_ID, {
      htlAAq: 'Jane',
      pPocjH: 'Smith',
      KTObNK: 'An owner of land within a SSSI'
    })

    await handleFormSubmission(message)

    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        form_type: 'consent',
        DF_reference_number: '111-222-333',
        customer_name: 'Jane Smith',
        consulting_body_type: 'Landowner'
      })
    )
  })

  it('should not send for form ids without a mapping', async () => {
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
