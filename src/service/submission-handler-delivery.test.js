/**
 * Delivery success modes for expanded submissions.
 *
 * These use a synthetic mapping rather than the real mapping files, so that
 * both modes can be exercised regardless of which mode any real form happens
 * to be configured with.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('./transmitters/submission-transmitter.js', () => ({
  send: vi.fn()
}))

vi.mock('./rule-mapping/registry.js', () => ({
  findMappingForForm: vi.fn()
}))

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

vi.mock('../config.js', () => ({
  config: {
    get: vi.fn((/** @type {string | undefined} */ key) =>
      key === 'mappingEngine' ? { mappingsDir: 'mappings' } : {}
    )
  }
}))

const { handleFormSubmission } = await import('./submission-handler.js')
const { send } = await import('./transmitters/submission-transmitter.js')
const { findMappingForForm } = await import('./rule-mapping/registry.js')
const { DELIVERY_SUCCESS_MODE } = await import('./rule-mapping/types.js')

/**
 * @param {import('./rule-mapping/types.js').DeliverySuccessMode} deliverySuccessMode
 * @returns {import('./rule-mapping/types.js').MappingDefinition}
 */
function buildMapping(deliverySuccessMode) {
  return {
    id: 'test-mapping',
    name: 'Test mapping',
    version: 1,
    formIds: ['form-1'],
    outputSchema: './schema.json',
    destination: { type: 'rest', name: 'universityApi' },
    rules: [
      {
        id: 'reference',
        target: 'DF_reference_number',
        value: { type: 'meta', path: 'referenceNumber' }
      },
      {
        id: 'body.fallback',
        target: 'body',
        value: { type: 'literal', value: '' }
      }
    ],
    expand: {
      id: 'bodies',
      repeater: { id: 'people', text: 'People' },
      deliverySuccessMode,
      targets: {
        body: { type: 'answer', question: { id: 'name', text: 'Name' } }
      }
    }
  }
}

/**
 * @param {Array<Record<string, unknown>>} entries
 * @returns {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage}
 */
function buildMessage(entries) {
  return /** @type {any} */ ({
    messageId: 'test-message-id',
    meta: {
      formId: 'form-1',
      formName: 'Test',
      formSlug: 'test',
      referenceNumber: '111-222-333'
    },
    data: { main: {}, repeaters: { people: entries }, files: {} }
  })
}

const threePeople = buildMessage([
  { name: 'Jane' },
  { name: 'Raj' },
  { name: 'Sam' }
])

describe('delivery success modes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('all', () => {
    beforeEach(() => {
      vi.mocked(findMappingForForm).mockReturnValue(
        buildMapping(DELIVERY_SUCCESS_MODE.ALL)
      )
    })

    it('resolves when every payload succeeds', async () => {
      vi.mocked(send).mockResolvedValue(undefined)

      await expect(handleFormSubmission(threePeople)).resolves.toBeUndefined()
      expect(send).toHaveBeenCalledTimes(3)
    })

    it('throws so the message is retried when a payload fails', async () => {
      vi.mocked(send)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('CWT down'))

      await expect(handleFormSubmission(threePeople)).rejects.toThrow(
        'CWT down'
      )
    })

    it('stops at the first failure, rather than sending payloads the retry would duplicate', async () => {
      vi.mocked(send)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('CWT down'))

      await expect(handleFormSubmission(threePeople)).rejects.toThrow(
        'CWT down'
      )
      expect(send).toHaveBeenCalledTimes(2)
    })
  })

  describe('any', () => {
    beforeEach(() => {
      vi.mocked(findMappingForForm).mockReturnValue(
        buildMapping(DELIVERY_SUCCESS_MODE.ANY)
      )
    })

    it('attempts every payload even after one fails', async () => {
      vi.mocked(send)
        .mockRejectedValueOnce(new Error('CWT down'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      await expect(handleFormSubmission(threePeople)).resolves.toBeUndefined()
      expect(send).toHaveBeenCalledTimes(3)
    })

    it('resolves when a single payload succeeds', async () => {
      vi.mocked(send)
        .mockRejectedValueOnce(new Error('CWT down'))
        .mockRejectedValueOnce(new Error('CWT down'))
        .mockResolvedValueOnce(undefined)

      await expect(handleFormSubmission(threePeople)).resolves.toBeUndefined()
    })

    it('logs the lost payloads as errors, since nothing else records them', async () => {
      vi.mocked(send)
        .mockRejectedValueOnce(new Error('CWT down'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      await handleFormSubmission(threePeople)

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('1 of 3 submissions failed for 111-222-333')
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('"body":"Jane"')
      )
    })

    it('does not log an error when every payload succeeds', async () => {
      vi.mocked(send).mockResolvedValue(undefined)

      await handleFormSubmission(threePeople)

      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('throws when every payload fails, so nothing is silently dropped', async () => {
      vi.mocked(send).mockRejectedValue(new Error('CWT down'))

      await expect(handleFormSubmission(threePeople)).rejects.toThrow(
        'All 3 submissions failed for 111-222-333'
      )
    })

    it('throws when the only payload of an unexpanded submission fails', async () => {
      vi.mocked(send).mockRejectedValue(new Error('CWT down'))

      await expect(handleFormSubmission(buildMessage([]))).rejects.toThrow(
        'All 1 submissions failed for 111-222-333'
      )
      expect(send).toHaveBeenCalledTimes(1)
    })
  })
})
