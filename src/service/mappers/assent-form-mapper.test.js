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

  it('should set DF_reference_number from meta.referenceNumber', () => {
    const result = mapFormSubmission(
      buildMessage({ vUHwan: 'Landowner', htlAAq: 'John', pPocjH: 'Doe' })
    )
    expect(result.DF_reference_number).toBe('576-225-943')
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
    it('should include activities from single SSSI repeater', () => {
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

    it('should include activities and SSSI names from multiple SSSI repeater', () => {
      const result = mapFormSubmission(
        buildMessage(
          {},
          {
            QxIzSB: [
              { iNDqRN: 'Tree removal', wRGnMW: '1001001---Test SSSI A' },
              { iNDqRN: 'Drainage', wRGnMW: '1001002---Test SSSI B' }
            ]
          }
        )
      )
      expect(result.description).toBe(
        'Tree removal, Drainage - Test SSSI A, Test SSSI B'
      )
    })

    it('should fall back to "S28H Assent" when no activities and no scheme', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.description).toBe('S28H Assent')
    })

    it('should fall back to scheme with parsed SSSI names from scheme repeater', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            rTreXu: 'A Higher Level Stewardship (HLS) agreement',
            ASataH: true
          },
          {
            hhGvmX: [
              { flbYHq: '2006159---SSSI One' },
              { flbYHq: '1001610---SSSI Two' }
            ]
          }
        )
      )
      expect(result.description).toBe(
        'A Higher Level Stewardship (HLS) agreement - SSSI One, SSSI Two'
      )
    })

    it('should fall back to scheme name alone when no SSSIs', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'A Higher Level Stewardship (HLS) agreement'
        })
      )
      expect(result.description).toBe(
        'A Higher Level Stewardship (HLS) agreement'
      )
    })

    it('should fall back to scheme with parsed single SSSI name', () => {
      const result = mapFormSubmission(
        buildMessage({
          rTreXu: 'A Sustainable Farming Incentive (SFI) agreement',
          gVlMxz: '1001001---Test SSSI'
        })
      )
      expect(result.description).toBe(
        'A Sustainable Farming Incentive (SFI) agreement - Test SSSI'
      )
    })

    it('should include European site names when present', () => {
      const result = mapFormSubmission(
        buildMessage(
          { ASataH: false, gVlMxz: '1001001---Test SSSI' },
          {
            gzSkgC: [{ lGsnXi: 'Grazing' }],
            aQYWxD: [{ IzQfir: '11004---Arun Valley Ramsar' }]
          }
        )
      )
      expect(result.description).toBe(
        'Grazing - Test SSSI - Arun Valley Ramsar'
      )
    })

    it('should list scheme before activities when both are present', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            rTreXu: 'A Higher Level Stewardship (HLS) agreement',
            ASataH: true
          },
          {
            hhGvmX: [{ flbYHq: '2006159---SSSI One' }],
            QxIzSB: [
              { iNDqRN: 'Grazing', wRGnMW: '2006159---SSSI One' },
              { iNDqRN: 'Fencing', wRGnMW: '2006159---SSSI One' }
            ]
          }
        )
      )
      expect(result.description).toBe(
        'A Higher Level Stewardship (HLS) agreement, Grazing, Fencing - SSSI One'
      )
    })
  })

  describe('consulting_body_type', () => {
    it('should map "Government agency" to "Government Agency" for a public body', () => {
      const result = mapFormSubmission(
        buildMessage({
          KTObNK: 'A public body',
          vUHwan: 'Government agency'
        })
      )
      expect(result.consulting_body_type).toBe('Government Agency')
    })

    it('should map "Local planning authority" to "Local Planning Authority" for a public body', () => {
      const result = mapFormSubmission(
        buildMessage({
          KTObNK: 'A public body',
          vUHwan: 'Local planning authority'
        })
      )
      expect(result.consulting_body_type).toBe('Local Planning Authority')
    })

    it('should return "Consultant" when working on behalf of a public body', () => {
      const result = mapFormSubmission(
        buildMessage({
          KTObNK: 'Somebody working on behalf of a public body',
          vUHwan: 'Government agency'
        })
      )
      expect(result.consulting_body_type).toBe('Consultant')
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
    it('should be "Yes" when euro_site_info has entries', () => {
      const result = mapFormSubmission(
        buildMessage({}, { aQYWxD: [{ IzQfir: '11004---Arun Valley Ramsar' }] })
      )
      expect(result.is_there_a_european_site).toBe('Yes')
    })

    it('should be empty when euro_site_info has no entries', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.is_there_a_european_site).toBe('')
    })

    it('should be empty when XydYUD is true but no euro site entries', () => {
      const result = mapFormSubmission(buildMessage({ XydYUD: true }))
      expect(result.is_there_a_european_site).toBe('')
    })
  })

  describe('SSSI_info', () => {
    it('should build single SSSI info with coordinates from repeater', () => {
      const result = mapFormSubmission(
        buildMessage(
          { ASataH: false, gVlMxz: '1001001---Test SSSI' },
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
        { SSSI_id: 1001001, coordinates: '400000,300000;400100,300100' }
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
                wRGnMW: '1001001---Test SSSI A',
                KnBNzJ: { easting: 100, northing: 200 }
              },
              {
                iNDqRN: 'Fencing',
                wRGnMW: '1001001---Test SSSI A',
                KnBNzJ: { easting: 300, northing: 400 }
              },
              {
                iNDqRN: 'Drainage',
                wRGnMW: '1001002---Test SSSI B',
                KnBNzJ: { easting: 500, northing: 600 }
              }
            ]
          }
        )
      )
      expect(result.SSSI_info).toEqual([
        { SSSI_id: 1001001, coordinates: '100,200;300,400' },
        { SSSI_id: 1001002, coordinates: '500,600' }
      ])
    })
  })

  describe('email_header', () => {
    it('should include activities and SSSI name for single SSSI path', () => {
      const result = mapFormSubmission(
        buildMessage(
          { ASataH: false, gVlMxz: '1001001---Test SSSI' },
          {
            gzSkgC: [{ lGsnXi: 'Grazing' }, { lGsnXi: 'Fencing' }]
          }
        )
      )
      expect(result.email_header).toBe('Grazing, Fencing - Test SSSI')
    })

    it('should include activities and SSSI names for multi SSSI path', () => {
      const result = mapFormSubmission(
        buildMessage(
          { ASataH: true },
          {
            QxIzSB: [
              { iNDqRN: 'Tree removal', wRGnMW: '1001001---Test SSSI A' },
              { iNDqRN: 'Drainage', wRGnMW: '1001002---Test SSSI B' }
            ]
          }
        )
      )
      expect(result.email_header).toBe(
        'Tree removal, Drainage - Test SSSI A, Test SSSI B'
      )
    })

    it('should include European site names when present', () => {
      const result = mapFormSubmission(
        buildMessage(
          { ASataH: false, gVlMxz: '1001001---Test SSSI' },
          {
            gzSkgC: [{ lGsnXi: 'Grazing' }],
            aQYWxD: [{ IzQfir: '11004---Arun Valley Ramsar' }]
          }
        )
      )
      expect(result.email_header).toBe(
        'Grazing - Test SSSI - Arun Valley Ramsar'
      )
    })

    it('should fall back to scheme with SSSI names when no activities', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            rTreXu: 'A Higher Level Stewardship (HLS) agreement',
            ASataH: true
          },
          {
            hhGvmX: [
              { flbYHq: '2006159---SSSI One' },
              { flbYHq: '1001610---SSSI Two' }
            ]
          }
        )
      )
      expect(result.email_header).toBe(
        'A Higher Level Stewardship (HLS) agreement - SSSI One, SSSI Two'
      )
    })

    it('should list scheme before activities when both are present', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            rTreXu: 'A Higher Level Stewardship (HLS) agreement',
            ASataH: false,
            gVlMxz: '1001001---Test SSSI'
          },
          {
            gzSkgC: [{ lGsnXi: 'Grazing' }, { lGsnXi: 'Fencing' }]
          }
        )
      )
      expect(result.email_header).toBe(
        'A Higher Level Stewardship (HLS) agreement, Grazing, Fencing - Test SSSI'
      )
    })

    it('should fall back to "S28H Assent" when no activities, scheme, SSSIs, or Euro sites', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.email_header).toBe('S28H Assent')
    })

    it('should truncate to 255 characters when many sites', () => {
      const ornecEntries = Array.from({ length: 30 }, (_, i) => ({
        iNDqRN: 'Grazing',
        wRGnMW: `${1001000 + i}---A Very Long SSSI Name Number ${i + 1}`
      }))
      const result = mapFormSubmission(
        buildMessage({ ASataH: true }, { QxIzSB: ornecEntries })
      )
      expect(result.email_header.length).toBeLessThanOrEqual(255)
      expect(result.email_header).toContain('Grazing')
    })
  })

  describe('euro_site_info', () => {
    it('should build euro site info from aQYWxD repeater', () => {
      const result = mapFormSubmission(
        buildMessage(
          {},
          {
            aQYWxD: [{ IzQfir: '11004---Test Euro Site' }]
          }
        )
      )
      expect(result.euro_site_info).toEqual([{ european_site_id: 11004 }])
    })

    it('should return empty array when no euro sites', () => {
      const result = mapFormSubmission(buildMessage({}))
      expect(result.euro_site_info).toEqual([])
    })
  })
})
