import { buildFormAdapterSubmissionMessage } from '../__stubs__/event-builders.js'
import { mapFormSubmission } from './advice-form-mapper.js'

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

describe('advice-form-mapper', () => {
  it('should throw if messageId is missing', () => {
    const message = buildFormAdapterSubmissionMessage({
      // @ts-expect-error - testing missing messageId
      messageId: undefined
    })
    expect(() => mapFormSubmission(message)).toThrow(
      'Unexpected missing message.messageId'
    )
  })

  it('should set form_type to "advice"', () => {
    const result = mapFormSubmission(
      buildMessage({ teEzOl: 'Landowner', xzEslQ: 'Something else' })
    )
    expect(result.form_type).toBe('advice')
  })

  it('should set DF_reference_number from meta.referenceNumber', () => {
    const result = mapFormSubmission(
      buildMessage({ teEzOl: 'Landowner', xzEslQ: 'Something else' })
    )
    expect(result.DF_reference_number).toBe('576-225-943')
  })

  describe('broad_work_type', () => {
    it('should map NVRbCy "HRA advice" to "Standalone HRA Reg 63"', () => {
      const result = mapFormSubmission(
        buildMessage({ teEzOl: 'Government Agency', NVRbCy: 'HRA advice' })
      )
      expect(result.broad_work_type).toBe('Standalone HRA Reg 63')
    })

    it('should map NVRbCy "S28I SSSI advice" to "S28i Advice"', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Government Agency',
          NVRbCy: 'S28I SSSI advice'
        })
      )
      expect(result.broad_work_type).toBe('S28i Advice')
    })

    it('should map NVRbCy "Something else" to "Other casework"', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Government Agency',
          NVRbCy: 'Something else'
        })
      )
      expect(result.broad_work_type).toBe('Other casework')
    })

    it('should map YOwPAJ "Standalone HRA advice" to "Standalone HRA Reg 63"', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Harbour authority',
          YOwPAJ: 'Standalone HRA advice'
        })
      )
      expect(result.broad_work_type).toBe('Standalone HRA Reg 63')
    })

    it('should map YOwPAJ "S28i SSSI advice" to "S28i Advice"', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Harbour authority',
          YOwPAJ: 'S28i SSSI advice'
        })
      )
      expect(result.broad_work_type).toBe('S28i Advice')
    })

    it('should default to "Other casework" for general topics via xzEslQ', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ: 'Something else'
        })
      )
      expect(result.broad_work_type).toBe('Other casework')
    })
  })

  describe('detailed_work_type', () => {
    it('should map NVRbCy "HRA advice" to "Standalone HRA Reg 63"', () => {
      const result = mapFormSubmission(
        buildMessage({ teEzOl: 'Government Agency', NVRbCy: 'HRA advice' })
      )
      expect(result.detailed_work_type).toBe('Standalone HRA Reg 63')
    })

    it('should map xzEslQ pre-consent advice topic', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ:
            'I am a SSSI landowner or land occupier and I would like advice before applying for SSSI consent'
        })
      )
      expect(result.detailed_work_type).toBe('SSSI - Pre Consent advice')
    })

    it('should map xzEslQ LNR topic to "LNRs"', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ:
            'I have a question about designating a Local Nature Reserve (LNR)'
        })
      )
      expect(result.detailed_work_type).toBe('LNRs')
    })

    it('should fall through from NVRbCy "Something else" to xzEslQ', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Government Agency',
          NVRbCy: 'Something else',
          xzEslQ:
            'I have a question about designating a Local Nature Reserve (LNR)'
        })
      )
      expect(result.detailed_work_type).toBe('LNRs')
    })
  })

  describe('email_header', () => {
    it('should include detailed_work_type for general topics path', () => {
      const result = mapFormSubmission(
        buildMessage({ teEzOl: 'Landowner', xzEslQ: 'Something else' })
      )
      expect(result.email_header).toBe('SSSI - Other')
    })

    it('should include free text question in email_header when xzEslQ is "Something else" and QmIGor is present', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ: 'Something else',
          QmIGor: 'What is the process for FC woodland management consent?'
        })
      )
      expect(result.email_header).toBe(
        'SSSI - Other - What is the process for FC woodland management consent?'
      )
    })

    it('should truncate email_header with free text question to 255 characters', () => {
      const longQuestion = 'A'.repeat(300)
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ: 'Something else',
          QmIGor: longQuestion
        })
      )
      expect(result.email_header.length).toBeLessThanOrEqual(255)
      expect(result.email_header).toContain('SSSI - Other')
      expect(result.email_header).toMatch(/\.\.\.$/u)
    })

    it('should include Euro site names for HRA path', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            teEzOl: 'Government Agency',
            PvUZyQ: 'Forestry Commission',
            NVRbCy: 'HRA advice'
          },
          {
            TJuSNf: [
              {
                rtuWky: '11004---Arun Valley Ramsar',
                xeJYcG: { easting: 100000, northing: 200000 }
              },
              {
                rtuWky: '11001---Abberton Reservoir Ramsar',
                xeJYcG: { easting: 300000, northing: 400000 }
              }
            ]
          }
        )
      )
      expect(result.email_header).toBe(
        'Standalone HRA Reg 63 - Arun Valley Ramsar, Abberton Reservoir Ramsar'
      )
    })

    it('should include SSSI names for S28I path', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            teEzOl: 'Government Agency',
            PvUZyQ: 'Environment Agency',
            YOwPAJ: 'S28i SSSI advice'
          },
          {
            someRepeater: [
              {
                Avdzxa: '1001001---Test SSSI',
                NMCFES: { easting: 400000, northing: 300000 }
              }
            ]
          }
        )
      )
      expect(result.email_header).toBe('S28i Advice - Test SSSI')
    })

    it('should include SSSI name for damage reporting path', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ:
            'I would like to report potentially damaging activity on or near a protected site',
          MoCXGK: '2005001---Damage Reporting SSSI'
        })
      )
      expect(result.email_header).toBe(
        'SSSI - Regulation and Enforcement - Damage Reporting SSSI'
      )
    })

    it('should include SSSI name for drone flying path', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Member of public',
          xzEslQ:
            'I have a question about flying drones on or near a protected site',
          PxvdiH: '1004018---Aqualate Mere SSSI'
        })
      )
      expect(result.email_header).toBe('SSSI - Other - Aqualate Mere SSSI')
    })

    it('should truncate to 255 characters when many sites', () => {
      const euroSites = Array.from({ length: 30 }, (_, i) => ({
        rtuWky: `${11000 + i}---A Very Long European Site Name Number ${i + 1}`,
        xeJYcG: { easting: 100000, northing: 200000 }
      }))
      const result = mapFormSubmission(
        buildMessage(
          {
            teEzOl: 'Government Agency',
            PvUZyQ: 'Forestry Commission',
            NVRbCy: 'HRA advice'
          },
          { TJuSNf: euroSites }
        )
      )
      expect(result.email_header.length).toBeLessThanOrEqual(255)
      expect(result.email_header).toContain('Standalone HRA Reg 63')
    })
  })

  describe('consulting_body_type', () => {
    it('should map "Regional body" to "Local Planning Authority"', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Regional body',
          YOwPAJ: 'Something else',
          xzEslQ: 'Something else'
        })
      )
      expect(result.consulting_body_type).toBe('Local Planning Authority')
    })

    it('should map "Utility provider" to "Utility Provider"', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Utility provider',
          YOwPAJ: 'Something else',
          xzEslQ: 'Something else'
        })
      )
      expect(result.consulting_body_type).toBe('Utility Provider')
    })
  })

  describe('consulting_body', () => {
    it('should return "Forestry Commission" for Government Agency + FC', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Government Agency',
          PvUZyQ: 'Forestry Commission',
          NVRbCy: 'HRA advice'
        })
      )
      expect(result.consulting_body).toBe('Forestry Commission')
    })

    it('should return free text for other government agency', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Government Agency',
          PvUZyQ: 'Other government agency',
          hOsLRu: 'Custom Agency',
          NVRbCy: 'HRA advice'
        })
      )
      expect(result.consulting_body).toBe('Custom Agency')
    })

    it('should return local authority name for Regional body', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Regional body',
          YouDQP: 'Surrey County Council',
          YOwPAJ: 'Something else',
          xzEslQ: 'Something else'
        })
      )
      expect(result.consulting_body).toBe('Surrey County Council')
    })

    it('should return organisation name from jYwTmN for Consultant', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Consultant',
          PBmxNM: 'Local Planning Authority',
          YouDQP: 'Bristol City Council',
          jYwTmN: 'Environment Agency - EA',
          xzEslQ: 'Something else'
        })
      )
      expect(result.consulting_body).toBe('Environment Agency - EA')
    })

    it('should return free text organisation for Consultant when jYwTmN is "Other"', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Consultant',
          PBmxNM: 'Landowner',
          jYwTmN: 'Other',
          jcctvG: 'My Custom Organisation',
          xzEslQ: 'Something else'
        })
      )
      expect(result.consulting_body).toBe('My Custom Organisation')
    })

    it('should return organisation name from jYwTmN for Other category', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Other',
          PBmxNM: 'Landowner',
          jYwTmN: 'Forestry Commission',
          xzEslQ: 'Something else'
        })
      )
      expect(result.consulting_body).toBe('Forestry Commission')
    })

    it('should return customer name for Member of public', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Member of public',
          xzEslQ: 'Something else',
          hUpejP: 'Tom Walker'
        })
      )
      expect(result.consulting_body).toBe('Tom Walker')
    })

    it('should return customer name for Landowner', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ: 'Something else',
          hUpejP: 'Robert Farmer'
        })
      )
      expect(result.consulting_body).toBe('Robert Farmer')
    })
  })

  describe('customer fields', () => {
    it('should map customer_name from hUpejP', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ: 'Something else',
          hUpejP: 'Jane Smith',
          YOPYRe: 'jane@example.com'
        })
      )
      expect(result.customer_name).toBe('Jane Smith')
      expect(result.customer_email_address).toBe('jane@example.com')
    })
  })

  describe('is_contractor_working_for_public_body', () => {
    it('should be "Yes" when PBmxNM is present', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Consultant',
          PBmxNM: 'Government agency',
          PvUZyQ: 'Environment Agency',
          xzEslQ: 'Something else'
        })
      )
      expect(result.is_contractor_working_for_public_body).toBe('Yes')
    })

    it('should be "No" when PBmxNM is absent', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ: 'Something else'
        })
      )
      expect(result.is_contractor_working_for_public_body).toBe('No')
    })
  })

  describe('description', () => {
    it('should include detailed_work_type and Euro site names for HRA path', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            teEzOl: 'Government Agency',
            PvUZyQ: 'Forestry Commission',
            NVRbCy: 'HRA advice',
            emlmbt: 'Screening stage'
          },
          {
            TJuSNf: [
              {
                rtuWky: '11004---Arun Valley Ramsar',
                xeJYcG: { easting: 100000, northing: 200000 }
              }
            ]
          }
        )
      )
      expect(result.description).toBe(
        'Standalone HRA Reg 63 - Arun Valley Ramsar'
      )
    })

    it('should include detailed_work_type and SSSI names for S28I path', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            teEzOl: 'Government Agency',
            PvUZyQ: 'Environment Agency',
            YOwPAJ: 'S28i SSSI advice'
          },
          {
            someRepeater: [
              {
                Avdzxa: '1001001---Test SSSI',
                NMCFES: { easting: 400000, northing: 300000 }
              }
            ]
          }
        )
      )
      expect(result.description).toBe('S28i Advice - Test SSSI')
    })

    it('should include SSSI name for damage reporting path', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ:
            'I would like to report potentially damaging activity on or near a protected site',
          MoCXGK: '2005001---Damage Reporting SSSI'
        })
      )
      expect(result.description).toBe(
        'SSSI - Regulation and Enforcement - Damage Reporting SSSI'
      )
    })

    it('should include SSSI name for drone flying path', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Member of public',
          xzEslQ:
            'I have a question about flying drones on or near a protected site',
          PxvdiH: '1004018---Aqualate Mere SSSI'
        })
      )
      expect(result.description).toBe('SSSI - Other - Aqualate Mere SSSI')
    })

    it('should return detailed_work_type alone for general topics without free text', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ: 'Something else'
        })
      )
      expect(result.description).toBe('SSSI - Other')
    })

    it('should include free text question in description when xzEslQ is "Something else" and QmIGor is present', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ: 'Something else',
          QmIGor: 'I need advice on managing a hedgerow on my SSSI land.'
        })
      )
      expect(result.description).toBe(
        'SSSI - Other - I need advice on managing a hedgerow on my SSSI land.'
      )
    })
  })

  describe('SSSI_info', () => {
    it('should build SSSI info from repeater with Avdzxa and NMCFES', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            teEzOl: 'Government Agency',
            PvUZyQ: 'Environment Agency',
            YOwPAJ: 'S28i SSSI advice'
          },
          {
            someRepeater: [
              {
                Avdzxa: '1001001---Test SSSI',
                NMCFES: { easting: 400000, northing: 300000 }
              }
            ]
          }
        )
      )
      expect(result.SSSI_info).toEqual([
        { SSSI_id: 1001001, coordinates: '400000,300000' }
      ])
    })

    it('should build SSSI info from damage reporting fields', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Landowner',
          xzEslQ:
            'I would like to report potentially damaging activity on or near a protected site',
          MoCXGK: '2005001---Damage Reporting SSSI',
          rSJTFC: { easting: 500000, northing: 400000 }
        })
      )
      expect(result.SSSI_info).toEqual([
        { SSSI_id: 2005001, coordinates: '500000,400000' }
      ])
    })

    it('should build SSSI info from drone flying path', () => {
      const result = mapFormSubmission(
        buildMessage({
          teEzOl: 'Member of public',
          xzEslQ:
            'I have a question about flying drones on or near a protected site',
          PxvdiH: '1004018---Aqualate Mere SSSI'
        })
      )
      expect(result.SSSI_info).toEqual([{ SSSI_id: 1004018, coordinates: '' }])
    })
  })

  describe('euro_site_info', () => {
    it('should build euro site info from TJuSNf repeater', () => {
      const result = mapFormSubmission(
        buildMessage(
          {
            teEzOl: 'Government Agency',
            PvUZyQ: 'Forestry Commission',
            NVRbCy: 'HRA advice'
          },
          {
            TJuSNf: [
              {
                rtuWky: '11001---Test Euro Site',
                xeJYcG: { easting: 100000, northing: 200000 }
              }
            ]
          }
        )
      )
      expect(result.euro_site_info).toEqual([
        {
          european_site_id: 11001,
          european_site_coordinates: '100000,200000'
        }
      ])
      expect(result.is_there_a_european_site).toBe('Yes')
    })

    it('should return empty array and "No" when no euro sites', () => {
      const result = mapFormSubmission(
        buildMessage({ teEzOl: 'Landowner', xzEslQ: 'Something else' })
      )
      expect(result.euro_site_info).toEqual([])
      expect(result.is_there_a_european_site).toBe('No')
    })
  })
})
