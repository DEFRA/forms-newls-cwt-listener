/**
 * Tests for the rules and dual-run (both) mapping engine modes of the
 * submission handler. The legacy mode is covered by submission-handler.test.js.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('./transmitters/submission-transmitter.js', () => ({
  send: vi.fn()
}))

vi.mock('./rule-mapping/comparison-store.js', () => ({
  storeComparison: vi.fn()
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

/** @type {{ mode: string, mappingsDir: string }} */
const mappingEngineSettings = { mode: 'legacy', mappingsDir: 'mappings' }

vi.mock('../config.js', () => ({
  config: {
    get: vi.fn((/** @type {string | undefined} */ key) => {
      if (key === 'mappingEngine') {
        return mappingEngineSettings
      }
      return {
        adviceFormId: '69a07d92093ab56d4fa9f325',
        assentFormId: '69a1a593093ab56d4fa9f330',
        consentFormId: '69a1a64c093ab56d4fa9f339'
      }
    })
  }
}))

const { handleFormSubmission } = await import('./submission-handler.js')
const { send } = await import('./transmitters/submission-transmitter.js')
const { storeComparison } = await import('./rule-mapping/comparison-store.js')

/**
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

describe('submission-handler mapping engine modes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rules mode', () => {
    beforeEach(() => {
      mappingEngineSettings.mode = 'rules'
    })

    it('maps with the rules engine and sends to the mapping destination', async () => {
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
      expect(storeComparison).not.toHaveBeenCalled()
    })

    it('does not send for form ids without a mapping', async () => {
      await handleFormSubmission(buildSubmissionMessage('unknown-form-id'))

      expect(send).not.toHaveBeenCalled()
    })
  })

  describe('both mode', () => {
    beforeEach(() => {
      mappingEngineSettings.mode = 'both'
    })

    it('transmits the legacy payload and stores a matching comparison', async () => {
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
      expect(storeComparison).toHaveBeenCalledTimes(1)
      expect(storeComparison).toHaveBeenCalledWith(
        expect.objectContaining({
          mappingId: 'assent-to-cwt',
          formId: ASSENT_FORM_ID,
          referenceNumber: '111-222-333',
          matches: true
        })
      )
    })

    it('still transmits the legacy payload when the rules engine fails', async () => {
      // Point the mappings directory somewhere without mapping files so only
      // the rules side fails; the legacy mapper is unaffected.
      mappingEngineSettings.mappingsDir = 'src'
      const message = buildSubmissionMessage(ADVICE_FORM_ID, {
        teEzOl: 'Landowner',
        hUpejP: 'Test User'
      })

      await handleFormSubmission(message)

      expect(send).toHaveBeenCalledTimes(1)
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ form_type: 'advice' })
      )
      expect(storeComparison).toHaveBeenCalledWith(
        expect.objectContaining({
          mappingId: 'unknown',
          matches: false,
          rulesPayload: null,
          rulesError: expect.stringContaining('No mapping definition found')
        })
      )

      mappingEngineSettings.mappingsDir = 'mappings'
    })

    it('does not send for form ids without a legacy mapper', async () => {
      await handleFormSubmission(buildSubmissionMessage('unknown-form-id'))

      expect(send).not.toHaveBeenCalled()
      expect(storeComparison).not.toHaveBeenCalled()
    })
  })
})
