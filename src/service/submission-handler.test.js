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
 * @param {Record<string, Array<Record<string, unknown>>>} [repeaters]
 * @returns {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage}
 */
function buildSubmissionMessage(formId, mainData = {}, repeaters = {}) {
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
      repeaters,
      files: {}
    }
  })
}

describe('submission-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // clearAllMocks leaves queued *Once implementations in place; reset so a
    // test that stops early cannot leak an unconsumed value into the next one
    vi.mocked(send).mockReset()
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
      'universityApi',
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
      'universityApi',
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
      'universityApi',
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

  describe('consent represented body expansion', () => {
    const owner = {
      BKoVeV: 'Landowner',
      qmxPye: 'Jane',
      ajJUTo: 'Smith'
    }
    const occupier = {
      BKoVeV: 'Land occupier',
      qmxPye: 'Raj',
      ajJUTo: 'Patel'
    }

    it('should send one payload omitting the represented body fields when no owner/occupier details were given', async () => {
      await handleFormSubmission(buildSubmissionMessage(CONSENT_FORM_ID))

      expect(send).toHaveBeenCalledTimes(1)

      // Both fields are optional: with no entry to expand, only the expansion
      // would have produced them, so they are absent rather than empty
      const [, payload] = vi.mocked(send).mock.calls[0]
      expect(payload).not.toHaveProperty('represented_body_type')
      expect(payload).not.toHaveProperty('represented_body_name')
    })

    it('should omit the represented body fields when every entry is filtered out', async () => {
      await handleFormSubmission(
        buildSubmissionMessage(
          CONSENT_FORM_ID,
          {},
          { bDGQoL: [{ qmxPye: 'No', ajJUTo: 'Type' }] }
        )
      )

      expect(send).toHaveBeenCalledTimes(1)

      const [, payload] = vi.mocked(send).mock.calls[0]
      expect(payload).not.toHaveProperty('represented_body_type')
      expect(payload).not.toHaveProperty('represented_body_name')
    })

    it('should send one populated payload for a single owner/occupier', async () => {
      await handleFormSubmission(
        buildSubmissionMessage(CONSENT_FORM_ID, {}, { bDGQoL: [owner] })
      )

      expect(send).toHaveBeenCalledTimes(1)
      expect(send).toHaveBeenCalledWith(
        'universityApi',
        expect.objectContaining({
          represented_body_type: 'Landowner',
          represented_body_name: 'Jane Smith'
        })
      )
    })

    it('should send one payload per owner/occupier, differing only in the represented body', async () => {
      await handleFormSubmission(
        buildSubmissionMessage(
          CONSENT_FORM_ID,
          { KTObNK: 'An owner of land within a SSSI' },
          { bDGQoL: [owner, occupier] }
        )
      )

      expect(send).toHaveBeenCalledTimes(2)

      const [, first] = vi.mocked(send).mock.calls[0]
      const [, second] = vi.mocked(send).mock.calls[1]

      expect(first).toMatchObject({
        represented_body_type: 'Landowner',
        represented_body_name: 'Jane Smith',
        DF_reference_number: '111-222-333'
      })
      expect(second).toMatchObject({
        represented_body_type: 'Land occupier',
        represented_body_name: 'Raj Patel',
        DF_reference_number: '111-222-333'
      })

      // Everything but the represented body is shared, reference number included
      const differing = Object.keys(first).filter(
        (key) =>
          JSON.stringify(first[key]) !==
          JSON.stringify(/** @type {any} */ (second)[key])
      )
      expect(differing).toEqual([
        'represented_body_type',
        'represented_body_name'
      ])
    })

    it('should skip entries with no landowner/occupier answer', async () => {
      await handleFormSubmission(
        buildSubmissionMessage(
          CONSENT_FORM_ID,
          {},
          { bDGQoL: [owner, { qmxPye: 'No', ajJUTo: 'Type' }] }
        )
      )

      expect(send).toHaveBeenCalledTimes(1)
      expect(send).toHaveBeenCalledWith(
        'universityApi',
        expect.objectContaining({ represented_body_name: 'Jane Smith' })
      )
    })

    it('should throw and stop at the first failing payload, since consent delivers on "all"', async () => {
      vi.mocked(send).mockRejectedValue(new Error('CWT down'))

      await expect(
        handleFormSubmission(
          buildSubmissionMessage(
            CONSENT_FORM_ID,
            {},
            { bDGQoL: [owner, occupier] }
          )
        )
      ).rejects.toThrow('CWT down')

      // Stops at the first failure rather than sending the second payload: the
      // whole set is re-sent on redelivery
      expect(send).toHaveBeenCalledTimes(1)
    })

    it('should throw when a later payload fails after an earlier one landed, so the message is retried', async () => {
      vi.mocked(send)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('CWT down'))

      await expect(
        handleFormSubmission(
          buildSubmissionMessage(
            CONSENT_FORM_ID,
            {},
            { bDGQoL: [owner, occupier] }
          )
        )
      ).rejects.toThrow('CWT down')

      expect(send).toHaveBeenCalledTimes(2)
    })
  })
})
