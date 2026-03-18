import { buildFormAdapterSubmissionMessage } from '../__stubs__/event-builders.js'
import { mapFormSubmission } from './consent-form-mapper.js'

/**
 * Helper to build a message with specific main and repeaters data.
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} [repeaters]
 * @returns {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage}
 */
function buildMessage(main, repeaters = {}) {
  return buildFormAdapterSubmissionMessage({
    data: { main, repeaters, files: {} }
  })
}

describe('consent-form-mapper', () => {
  it('should throw if messageId is missing', () => {
    const message = buildFormAdapterSubmissionMessage({
      // @ts-expect-error - testing missing messageId
      messageId: undefined
    })
    expect(() => mapFormSubmission(message)).toThrow(
      'Unexpected missing message.messageId'
    )
  })

  it('should set form_type to "consent"', () => {
    const result = mapFormSubmission(buildMessage({}))
    expect(result.form_type).toBe('consent')
  })

  it('should set DF_reference_number from meta.referenceNumber', () => {
    const result = mapFormSubmission(buildMessage({}))
    expect(result.DF_reference_number).toBe('576-225-943')
  })

  it('should set broad_work_type to "S28E Consent"', () => {
    const result = mapFormSubmission(buildMessage({}))
    expect(result.broad_work_type).toBe('S28E Consent')
  })

  describe('detailed_work_type', () => {
    it('should map CSHT scheme to "S28E Consent CS HT"', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'A Countryside Stewardship Higher Tier (CSHT) agreement'
        })
      )
      expect(result.detailed_work_type).toBe('S28E Consent CS HT')
    })

    it('should map HLS scheme to "S28E Consent HLS extension"', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'A Higher Level Stewardship (HLS) agreement'
        })
      )
      expect(result.detailed_work_type).toBe('S28E Consent HLS extension')
    })

    it('should default to "S28E Consent" when no scheme', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.detailed_work_type).toBe('S28E Consent')
    })
  })

  describe('description', () => {
    it('should build description from single SSSI with ORNEC activities', () => {
      const result = mapFormSubmission(
        buildMessage(
          { hozdvW: 'Test SSSI' },
          {
            iTBHrY: [
              { hqsZMS: 'Grazing', QKdhfh: { easting: 100, northing: 200 } },
              { hqsZMS: 'Fencing', QKdhfh: { easting: 300, northing: 400 } }
            ]
          }
        )
      )
      expect(result.description).toBe('Test SSSI - Grazing, Fencing')
    })

    it('should build description from single SSSI without activities', () => {
      const result = mapFormSubmission(buildMessage({ hozdvW: 'Test SSSI' }))
      expect(result.description).toBe('Test SSSI')
    })

    it('should build description from multi SSSI with activities', () => {
      const result = mapFormSubmission(
        buildMessage(
          {},
          {
            cwZgSE: [
              { rWrBOK: 'SSSI A', BscJLV: 'Grazing' },
              { rWrBOK: 'SSSI A', BscJLV: 'Fencing' },
              { rWrBOK: 'SSSI B', BscJLV: 'Drainage' }
            ]
          }
        )
      )
      expect(result.description).toBe(
        'SSSI A - Grazing, Fencing; SSSI B - Drainage'
      )
    })
  })

  describe('consulting_body_type', () => {
    it('should map "An owner of land within a SSSI" to "Landowner"', () => {
      const result = mapFormSubmission(
        buildMessage({ KTObNK: 'An owner of land within a SSSI' })
      )
      expect(result.consulting_body_type).toBe('Landowner')
    })

    it('should map consultant type', () => {
      const result = mapFormSubmission(
        buildMessage({
          KTObNK:
            'Someone with permission to work on behalf of an owner or occupier'
        })
      )
      expect(result.consulting_body_type).toBe('Consultant')
    })

    it('should map "Somebody else" to "Other"', () => {
      const result = mapFormSubmission(
        buildMessage({ KTObNK: 'Somebody else' })
      )
      expect(result.consulting_body_type).toBe('Other')
    })
  })

  describe('customer fields', () => {
    it('should concatenate first and last name', () => {
      const result = mapFormSubmission(
        buildMessage({
          htlAAq: 'John',
          pPocjH: 'Doe',
          skdDtj: 'john@example.com'
        })
      )
      expect(result.customer_name).toBe('John Doe')
      expect(result.customer_email_address).toBe('john@example.com')
    })
  })

  describe('SBI', () => {
    it('should use oflKhi (owner/occupier SBI) when present', () => {
      const result = mapFormSubmission(buildMessage({ oflKhi: '123456789' }))
      expect(result.SBI).toBe(123456789)
    })

    it('should fall back to VLUhzR (applicant SBI)', () => {
      const result = mapFormSubmission(buildMessage({ VLUhzR: '987654321' }))
      expect(result.SBI).toBe(987654321)
    })

    it('should be undefined when no SBI provided', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.SBI).toBeUndefined()
    })
  })

  describe('agreement_reference', () => {
    it('should use WZJDQG for CS agreements', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'A Countryside Stewardship Higher Tier (CSHT) agreement',
          WZJDQG: 'CS-12345'
        })
      )
      expect(result.agreement_reference).toBe('CS-12345')
    })

    it('should use VacBun for another permission path', () => {
      const result = mapFormSubmission(
        buildMessage({ VacBun: 'Planning Permission 123' })
      )
      expect(result.agreement_reference).toBe('Planning Permission 123')
    })
  })

  describe('email_header', () => {
    it('should use first ORNEC from single SSSI repeater', () => {
      const result = mapFormSubmission(
        buildMessage(
          {},
          {
            iTBHrY: [{ hqsZMS: 'Grazing' }, { hqsZMS: 'Fencing' }]
          }
        )
      )
      expect(result.email_header).toBe('Grazing')
    })

    it('should use first ORNEC from multi SSSI repeater', () => {
      const result = mapFormSubmission(
        buildMessage(
          {},
          {
            cwZgSE: [{ BscJLV: 'Tree removal', rWrBOK: 'SSSI A' }]
          }
        )
      )
      expect(result.email_header).toBe('Tree removal')
    })

    it('should fall back to land management scheme when no ORNECs', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'A Countryside Stewardship Higher Tier (CSHT) agreement'
        })
      )
      expect(result.email_header).toBe(
        'A Countryside Stewardship Higher Tier (CSHT) agreement'
      )
    })

    it('should fall back to detailed_work_type when no ORNECs and no scheme', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.email_header).toBe('S28E Consent')
    })
  })

  describe('SSSI_info', () => {
    it('should build single SSSI info with coordinates and ORNECs', () => {
      const result = mapFormSubmission(
        buildMessage(
          { hozdvW: 'Test SSSI', lmqMaY: false },
          {
            iTBHrY: [
              {
                hqsZMS: 'Grazing',
                QKdhfh: { easting: 100, northing: 200 }
              },
              {
                hqsZMS: 'Fencing',
                QKdhfh: { easting: 300, northing: 400 }
              }
            ]
          }
        )
      )
      expect(result.SSSI_info).toEqual([
        {
          SSSI_id: 'Test SSSI',
          coordinates: '100,200;300,400',
          ornec: 'Grazing, Fencing'
        }
      ])
    })

    it('should build single SSSI info with scheme coordinates', () => {
      const result = mapFormSubmission(
        buildMessage({
          hozdvW: 'Test SSSI',
          lmqMaY: false,
          JPohUD: { easting: 500, northing: 600 }
        })
      )
      expect(result.SSSI_info).toEqual([
        { SSSI_id: 'Test SSSI', coordinates: '500,600', ornec: '' }
      ])
    })

    it('should build multi SSSI info with scheme coordinates from JPohUD', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            lmqMaY: true,
            JPohUD: { easting: 490200, northing: 139800 }
          },
          {
            gWZwzI: [
              { gVlMxz: 'Chobham Common SSSI' },
              { gVlMxz: 'Horsell Common SSSI' }
            ]
          }
        )
      )
      expect(result.SSSI_info).toEqual([
        {
          SSSI_id: 'Chobham Common SSSI',
          coordinates: '490200,139800',
          ornec: ''
        },
        {
          SSSI_id: 'Horsell Common SSSI',
          coordinates: '490200,139800',
          ornec: ''
        }
      ])
    })

    it('should build multi SSSI info grouped by name', () => {
      const result = mapFormSubmission(
        buildMessage(
          { lmqMaY: true },
          {
            cwZgSE: [
              {
                rWrBOK: 'SSSI A',
                BscJLV: 'Grazing',
                gjWdrc: { easting: 100, northing: 200 }
              },
              {
                rWrBOK: 'SSSI A',
                BscJLV: 'Fencing',
                gjWdrc: { easting: 300, northing: 400 }
              },
              {
                rWrBOK: 'SSSI B',
                BscJLV: 'Drainage',
                gjWdrc: { easting: 500, northing: 600 }
              }
            ]
          }
        )
      )
      expect(result.SSSI_info).toEqual([
        {
          SSSI_id: 'SSSI A',
          coordinates: '100,200;300,400',
          ornec: 'Grazing, Fencing'
        },
        { SSSI_id: 'SSSI B', coordinates: '500,600', ornec: 'Drainage' }
      ])
    })
  })
})
