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
    it('should include activities and SSSI name for single SSSI path', () => {
      const result = mapFormSubmission(
        buildMessage(
          { hozdvW: '1001001---Test SSSI' },
          {
            iTBHrY: [
              { hqsZMS: 'Grazing', QKdhfh: { easting: 100, northing: 200 } },
              { hqsZMS: 'Fencing', QKdhfh: { easting: 300, northing: 400 } }
            ]
          }
        )
      )
      expect(result.description).toBe('Grazing, Fencing - Test SSSI')
    })

    it('should include SSSI name alone when no activities', () => {
      const result = mapFormSubmission(
        buildMessage({ hozdvW: '1001001---Test SSSI' })
      )
      expect(result.description).toBe('Test SSSI')
    })

    it('should include unique activities and SSSI names for multi SSSI path', () => {
      const result = mapFormSubmission(
        buildMessage(
          {},
          {
            cwZgSE: [
              { rWrBOK: '1001001---Test SSSI A', BscJLV: 'Grazing' },
              { rWrBOK: '1001001---Test SSSI A', BscJLV: 'Fencing' },
              { rWrBOK: '1001002---Test SSSI B', BscJLV: 'Drainage' }
            ]
          }
        )
      )
      expect(result.description).toBe(
        'Grazing, Fencing, Drainage - Test SSSI A, Test SSSI B'
      )
    })

    it('should fall back to scheme with SSSI names when no activities', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            rTreXu: 'A Countryside Stewardship Higher Tier (CSHT) agreement',
            lmqMaY: true
          },
          {
            gWZwzI: [
              { gVlMxz: '1001610---SSSI One' },
              { gVlMxz: '1003842---SSSI Two' }
            ]
          }
        )
      )
      expect(result.description).toBe(
        'A Countryside Stewardship Higher Tier (CSHT) agreement - SSSI One, SSSI Two'
      )
    })

    it('should list scheme before activities when both are present', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            rTreXu: 'A Countryside Stewardship Higher Tier (CSHT) agreement',
            hozdvW: '1001001---Test SSSI'
          },
          {
            iTBHrY: [{ hqsZMS: 'Grazing' }, { hqsZMS: 'Fencing' }]
          }
        )
      )
      expect(result.description).toBe(
        'A Countryside Stewardship Higher Tier (CSHT) agreement, Grazing, Fencing - Test SSSI'
      )
    })

    it('should fall back to "S28E Consent" when nothing available', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.description).toBe('S28E Consent')
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
            'Someone with permission to work on behalf of an owner or occupier of land within a SSSI'
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
    it('should use rkIHYS (mandatory SBI page) when present', () => {
      const result = mapFormSubmission(buildMessage({ rkIHYS: '123456789' }))
      expect(result.SBI).toBe(123456789)
    })

    it('should fall back to VLUhzR (address details page SBI)', () => {
      const result = mapFormSubmission(buildMessage({ VLUhzR: '987654321' }))
      expect(result.SBI).toBe(987654321)
    })

    it('should prioritise rkIHYS over VLUhzR when both present', () => {
      const result = mapFormSubmission(
        buildMessage({ rkIHYS: '123456789', VLUhzR: '987654321' })
      )
      expect(result.SBI).toBe(123456789)
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

    it('should use WtpFqT for Other schemes when provided', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'Other schemes',
          WtpFqT: 'OTHER-REF-42'
        })
      )
      expect(result.agreement_reference).toBe('OTHER-REF-42')
    })

    it('should be empty for Other schemes when WtpFqT not provided', () => {
      const result = mapFormSubmission(
        buildMessage({ rTreXu: 'Other schemes' })
      )
      expect(result.agreement_reference).toBe('')
    })
  })

  describe('email_header', () => {
    it('should include all activities and SSSI name for single SSSI path', () => {
      const result = mapFormSubmission(
        buildMessage(
          { hozdvW: '1001001---Test SSSI' },
          {
            iTBHrY: [{ hqsZMS: 'Grazing' }, { hqsZMS: 'Fencing' }]
          }
        )
      )
      expect(result.email_header).toBe('Grazing, Fencing - Test SSSI')
    })

    it('should include unique activities and SSSI names for multi SSSI path', () => {
      const result = mapFormSubmission(
        buildMessage(
          {},
          {
            cwZgSE: [
              { BscJLV: 'Tree removal', rWrBOK: '1001001---Test SSSI A' },
              { BscJLV: 'Drainage', rWrBOK: '1001002---Test SSSI B' }
            ]
          }
        )
      )
      expect(result.email_header).toBe(
        'Tree removal, Drainage - Test SSSI A, Test SSSI B'
      )
    })

    it('should fall back to scheme with SSSI names when no activities', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            rTreXu: 'A Countryside Stewardship Higher Tier (CSHT) agreement',
            lmqMaY: true
          },
          {
            gWZwzI: [
              { gVlMxz: '1001610---SSSI One' },
              { gVlMxz: '1003842---SSSI Two' }
            ]
          }
        )
      )
      expect(result.email_header).toBe(
        'A Countryside Stewardship Higher Tier (CSHT) agreement - SSSI One, SSSI Two'
      )
    })

    it('should fall back to scheme alone when no activities and no SSSIs', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'A Countryside Stewardship Higher Tier (CSHT) agreement'
        })
      )
      expect(result.email_header).toBe(
        'A Countryside Stewardship Higher Tier (CSHT) agreement'
      )
    })

    it('should list scheme before activities when both are present', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            rTreXu: 'A Countryside Stewardship Higher Tier (CSHT) agreement',
            hozdvW: '1001001---Test SSSI'
          },
          {
            iTBHrY: [{ hqsZMS: 'Grazing' }, { hqsZMS: 'Fencing' }]
          }
        )
      )
      expect(result.email_header).toBe(
        'A Countryside Stewardship Higher Tier (CSHT) agreement, Grazing, Fencing - Test SSSI'
      )
    })

    it('should fall back to "S28E Consent" when no activities, scheme, or SSSIs', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.email_header).toBe('S28E Consent')
    })

    it('should truncate to 255 characters when many SSSIs', () => {
      const repeaterEntries = Array.from({ length: 30 }, (_, i) => ({
        BscJLV: 'Grazing',
        rWrBOK: `${1001000 + i}---A Very Long SSSI Name Number ${i + 1}`
      }))
      const result = mapFormSubmission(
        buildMessage({}, { cwZgSE: repeaterEntries })
      )
      expect(result.email_header.length).toBeLessThanOrEqual(255)
      expect(result.email_header).toContain('Grazing')
    })
  })

  describe('SSSI_info', () => {
    it('should build single SSSI info with coordinates and ORNECs', () => {
      const result = mapFormSubmission(
        buildMessage(
          { hozdvW: '1001001---Test SSSI', lmqMaY: false },
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
          SSSI_id: 1001001,
          coordinates: '100,200;300,400',
          ornec: 'Grazing, Fencing'
        }
      ])
    })

    it('should build single SSSI info with scheme coordinates', () => {
      const result = mapFormSubmission(
        buildMessage({
          hozdvW: '1001001---Test SSSI',
          lmqMaY: false,
          JPohUD: { easting: 500, northing: 600 }
        })
      )
      expect(result.SSSI_info).toEqual([
        { SSSI_id: 1001001, coordinates: '500,600', ornec: '' }
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
              { gVlMxz: '1001610---SSSI One' },
              { gVlMxz: '1003842---SSSI Two' }
            ]
          }
        )
      )
      expect(result.SSSI_info).toEqual([
        {
          SSSI_id: 1001610,
          coordinates: '490200,139800',
          ornec: ''
        },
        {
          SSSI_id: 1003842,
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
                rWrBOK: '1001001---Test SSSI A',
                BscJLV: 'Grazing',
                gjWdrc: { easting: 100, northing: 200 }
              },
              {
                rWrBOK: '1001001---Test SSSI A',
                BscJLV: 'Fencing',
                gjWdrc: { easting: 300, northing: 400 }
              },
              {
                rWrBOK: '1001002---Test SSSI B',
                BscJLV: 'Drainage',
                gjWdrc: { easting: 500, northing: 600 }
              }
            ]
          }
        )
      )
      expect(result.SSSI_info).toEqual([
        {
          SSSI_id: 1001001,
          coordinates: '100,200;300,400',
          ornec: 'Grazing, Fencing'
        },
        { SSSI_id: 1001002, coordinates: '500,600', ornec: 'Drainage' }
      ])
    })
  })
})
