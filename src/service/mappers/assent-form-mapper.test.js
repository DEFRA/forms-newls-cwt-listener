import { buildFormAdapterSubmissionMessage } from '../__stubs__/event-builders.js'
import { mapFormSubmission } from './assent-form-mapper.js'

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

describe('assent-form-mapper', () => {
  it('should throw if messageId is missing', () => {
    const message = buildFormAdapterSubmissionMessage({
      // @ts-expect-error - testing missing messageId
      messageId: undefined
    })
    expect(() => mapFormSubmission(message)).toThrow(
      'Unexpected missing message.messageId'
    )
  })

  it('should set form_type to "assent"', () => {
    const result = mapFormSubmission(
      buildMessage({ vUHwan: 'Landowner', htlAAq: 'John', pPocjH: 'Doe' })
    )
    expect(result.form_type).toBe('assent')
  })

  it('should set broad_work_type to "S28H Assent"', () => {
    const result = mapFormSubmission(buildMessage({}))
    expect(result.broad_work_type).toBe('S28H Assent')
  })

  describe('detailed_work_type', () => {
    it('should map CSHT scheme to "S28H Assent CS HT"', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'A Countryside Stewardship Higher Tier (CSHT) agreement'
        })
      )
      expect(result.detailed_work_type).toBe('S28H Assent CS HT')
    })

    it('should map SFI scheme to "S28H Assent SFI"', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'A Sustainable Farming Incentive (SFI) agreement'
        })
      )
      expect(result.detailed_work_type).toBe('S28H Assent SFI')
    })

    it('should default to "S28H Assent" when no scheme selected', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.detailed_work_type).toBe('S28H Assent')
    })

    it('should default to "S28H Assent" for "Other schemes"', () => {
      const result = mapFormSubmission(
        buildMessage({ rTreXu: 'Other schemes' })
      )
      expect(result.detailed_work_type).toBe('S28H Assent')
    })
  })

  describe('description', () => {
    it('should concatenate activities from single SSSI repeater', () => {
      const result = mapFormSubmission(
        buildMessage(
          {},
          {
            gzSkgC: [{ lGsnXi: 'Grazing' }, { lGsnXi: 'Fencing' }]
          }
        )
      )
      expect(result.description).toBe('Grazing, Fencing')
    })

    it('should concatenate activities from multiple SSSI repeater', () => {
      const result = mapFormSubmission(
        buildMessage(
          {},
          {
            QxIzSB: [
              { iNDqRN: 'Tree removal', wRGnMW: 'SSSI A' },
              { iNDqRN: 'Drainage', wRGnMW: 'SSSI B' }
            ]
          }
        )
      )
      expect(result.description).toBe('Tree removal, Drainage')
    })

    it('should return empty string when no activities', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.description).toBe('')
    })
  })

  describe('consulting_body_type', () => {
    it('should map "Government agency" to "Government Agency"', () => {
      const result = mapFormSubmission(
        buildMessage({ vUHwan: 'Government agency' })
      )
      expect(result.consulting_body_type).toBe('Government Agency')
    })

    it('should map "Local planning authority" to "Local Planning Authority"', () => {
      const result = mapFormSubmission(
        buildMessage({ vUHwan: 'Local planning authority' })
      )
      expect(result.consulting_body_type).toBe('Local Planning Authority')
    })
  })

  describe('consulting_body', () => {
    it('should use organisation name for working on behalf', () => {
      const result = mapFormSubmission(
        buildMessage({
          KTObNK: 'Somebody working on behalf of a public body',
          ueDuNl: 'Acme Corp'
        })
      )
      expect(result.consulting_body).toBe('Acme Corp')
    })

    it('should use "Other" text for working on behalf with Other org', () => {
      const result = mapFormSubmission(
        buildMessage({
          KTObNK: 'Somebody working on behalf of a public body',
          ueDuNl: 'Other',
          Xszriq: 'Custom Org'
        })
      )
      expect(result.consulting_body).toBe('Custom Org')
    })

    it('should use local authority name for LPA', () => {
      const result = mapFormSubmission(
        buildMessage({
          KTObNK: 'A public body',
          vUHwan: 'Local planning authority',
          XAZlxH: 'Birmingham City Council'
        })
      )
      expect(result.consulting_body).toBe('Birmingham City Council')
    })

    it('should use public body name for other categories', () => {
      const result = mapFormSubmission(
        buildMessage({
          KTObNK: 'A public body',
          vUHwan: 'Government agency',
          cfPoiN: 'Environment Agency'
        })
      )
      expect(result.consulting_body).toBe('Environment Agency')
    })
  })

  describe('customer fields', () => {
    it('should concatenate first and last name', () => {
      const result = mapFormSubmission(
        buildMessage({
          htlAAq: 'Jane',
          pPocjH: 'Smith',
          skdDtj: 'jane@example.com'
        })
      )
      expect(result.customer_name).toBe('Jane Smith')
      expect(result.customer_email_address).toBe('jane@example.com')
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

    it('should use OFiizI for HLS agreements', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'A Higher Level Stewardship (HLS) agreement',
          OFiizI: 'HLS-67890'
        })
      )
      expect(result.agreement_reference).toBe('HLS-67890')
    })

    it('should use niVAkO for SFI agreements', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'A Sustainable Farming Incentive (SFI) agreement',
          niVAkO: 'SFI-11111'
        })
      )
      expect(result.agreement_reference).toBe('SFI-11111')
    })
  })

  describe('is_contractor_working_for_public_body', () => {
    it('should be "Yes" when working on behalf', () => {
      const result = mapFormSubmission(
        buildMessage({
          KTObNK: 'Somebody working on behalf of a public body'
        })
      )
      expect(result.is_contractor_working_for_public_body).toBe('Yes')
    })

    it('should be "No" when a public body directly', () => {
      const result = mapFormSubmission(
        buildMessage({ KTObNK: 'A public body' })
      )
      expect(result.is_contractor_working_for_public_body).toBe('No')
    })
  })

  describe('is_there_a_european_site', () => {
    it('should be "Yes" when XydYUD is true', () => {
      const result = mapFormSubmission(buildMessage({ XydYUD: true }))
      expect(result.is_there_a_european_site).toBe('Yes')
    })

    it('should be "No" when XydYUD is false', () => {
      const result = mapFormSubmission(buildMessage({ XydYUD: false }))
      expect(result.is_there_a_european_site).toBe('No')
    })
  })

  describe('SSSI_info', () => {
    it('should build single SSSI info with coordinates from repeater', () => {
      const result = mapFormSubmission(
        buildMessage(
          { ASataH: false, gVlMxz: 'Test SSSI' },
          {
            gzSkgC: [
              {
                lGsnXi: 'Grazing',
                uqfCOY: { easting: 400000, northing: 300000 }
              },
              {
                lGsnXi: 'Fencing',
                uqfCOY: { easting: 400100, northing: 300100 }
              }
            ]
          }
        )
      )
      expect(result.SSSI_info).toEqual([
        { SSSI_id: 'Test SSSI', coordinates: '400000,300000;400100,300100' }
      ])
    })

    it('should build multi SSSI info from ORNEC repeater grouped by name', () => {
      const result = mapFormSubmission(
        buildMessage(
          { ASataH: true },
          {
            QxIzSB: [
              {
                iNDqRN: 'Grazing',
                wRGnMW: 'SSSI A',
                KnBNzJ: { easting: 100, northing: 200 }
              },
              {
                iNDqRN: 'Fencing',
                wRGnMW: 'SSSI A',
                KnBNzJ: { easting: 300, northing: 400 }
              },
              {
                iNDqRN: 'Drainage',
                wRGnMW: 'SSSI B',
                KnBNzJ: { easting: 500, northing: 600 }
              }
            ]
          }
        )
      )
      expect(result.SSSI_info).toEqual([
        { SSSI_id: 'SSSI A', coordinates: '100,200;300,400' },
        { SSSI_id: 'SSSI B', coordinates: '500,600' }
      ])
    })
  })

  describe('euro_site_info', () => {
    it('should build euro site info from aQYWxD repeater', () => {
      const result = mapFormSubmission(
        buildMessage(
          {},
          {
            aQYWxD: [{ IzQfir: 'Test Euro Site' }]
          }
        )
      )
      expect(result.euro_site_info).toEqual([
        { european_site_id: 'Test Euro Site', european_site_coordinates: '' }
      ])
    })

    it('should return empty array when no euro sites', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.euro_site_info).toEqual([])
    })
  })
})
