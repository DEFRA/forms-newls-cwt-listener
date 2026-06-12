/**
 * Parity tests: every fixture below is run through BOTH the legacy hardcoded
 * mapper and the rule-based mapping engine (driven by the JSON mapping files
 * in /mappings), and the outputs must be deeply equal.
 *
 * These tests are the primary evidence that the mapping files faithfully
 * recreate the legacy mapping logic.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { buildFormAdapterSubmissionMessage } from '../__stubs__/event-builders.js'
import { mapFormSubmission as legacyAdviceMapper } from '../mappers/advice-form-mapper.js'
import { mapFormSubmission as legacyAssentMapper } from '../mappers/assent-form-mapper.js'
import { mapFormSubmission as legacyConsentMapper } from '../mappers/consent-form-mapper.js'
import { mapWithRules } from './engine.js'

const mappingsDir = join(import.meta.dirname, '../../../mappings')

/**
 * @param {string} fileName
 * @returns {import('./types.js').MappingDefinition}
 */
function loadMapping(fileName) {
  return JSON.parse(readFileSync(join(mappingsDir, fileName), 'utf8'))
}

const adviceMapping = loadMapping('advice-cwt.mapping.json')
const assentMapping = loadMapping('assent-cwt.mapping.json')
const consentMapping = loadMapping('consent-cwt.mapping.json')

/**
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} [repeaters]
 */
function buildMessage(main, repeaters = {}) {
  return buildFormAdapterSubmissionMessage({
    data: { main, repeaters, files: {} }
  })
}

/**
 * Asserts the rules engine output equals the legacy mapper output.
 * @param {import('./types.js').MappingDefinition} mapping
 * @param {(message: any) => unknown} legacyMapper
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} [repeaters]
 */
function expectParity(mapping, legacyMapper, main, repeaters = {}) {
  const message = buildMessage(main, repeaters)
  const legacyOutput = legacyMapper(message)
  const rulesOutput = mapWithRules(mapping, message)
  expect(rulesOutput).toEqual(legacyOutput)
}

describe('consent mapping parity', () => {
  it('matches legacy output for an empty submission', () => {
    expectParity(consentMapping, legacyConsentMapper, {})
  })

  it('matches legacy output for the CSHT single-SSSI scheme path', () => {
    expectParity(consentMapping, legacyConsentMapper, {
      rTreXu: 'A Countryside Stewardship Higher Tier (CSHT) agreement',
      hozdvW: '1001001---Pewsey Downs',
      JPohUD: { easting: 412345, northing: 167890 },
      WZJDQG: 'CS/1234/5678',
      KTObNK: 'An owner of land within a SSSI',
      htlAAq: 'Jane',
      pPocjH: 'Doe',
      skdDtj: 'jane.doe@example.com',
      rkIHYS: '123456789'
    })
  })

  it('matches legacy output for the single-SSSI ORNEC path with Other scheme', () => {
    expectParity(
      consentMapping,
      legacyConsentMapper,
      {
        rTreXu: 'Other schemes',
        aIixRu: 'My local wildlife scheme',
        WtpFqT: 'REF-001',
        hozdvW: '1001001---Pewsey Downs',
        KTObNK: 'Somebody else',
        htlAAq: 'Sam',
        pPocjH: 'Smith'
      },
      {
        iTBHrY: [
          { hqsZMS: 'Grazing', QKdhfh: { easting: 100, northing: 200 } },
          { hqsZMS: 'Fencing', QKdhfh: { easting: 300, northing: 400 } },
          { hqsZMS: 'Grazing' }
        ]
      }
    )
  })

  it('matches legacy output for the multi-SSSI ORNEC path with grouped entries', () => {
    expectParity(
      consentMapping,
      legacyConsentMapper,
      {
        lmqMaY: true,
        KTObNK:
          'Someone with permission to work on behalf of an owner or occupier of land within a SSSI',
        rTreXu: 'A Higher Level Stewardship (HLS) agreement',
        OFiizI: 'HLS-9876'
      },
      {
        cwZgSE: [
          {
            rWrBOK: '2002002---Fenn Bog',
            gjWdrc: { easting: 111, northing: 222 },
            BscJLV: 'Drainage'
          },
          {
            rWrBOK: '2002002---Fenn Bog',
            gjWdrc: { easting: 333, northing: 444 },
            BscJLV: 'Burning'
          },
          {
            rWrBOK: '3003003---Holt Heath',
            BscJLV: 'Tree felling'
          }
        ]
      }
    )
  })

  it('matches legacy output for the multi-SSSI scheme path with shared coordinates', () => {
    expectParity(
      consentMapping,
      legacyConsentMapper,
      {
        lmqMaY: true,
        JPohUD: { easting: 555, northing: 666 },
        rTreXu: 'A Sustainable Farming Incentive (SFI) agreement',
        niVAkO: 'SFI-1111',
        KTObNK: 'An occupier of land within a SSSI',
        VLUhzR: '987654321'
      },
      {
        gWZwzI: [
          { gVlMxz: '4004004---Wyre Forest' },
          { gVlMxz: '5005005---Chee Dale' }
        ]
      }
    )
  })

  it('matches legacy output for a MTA scheme with longer option text', () => {
    expectParity(consentMapping, legacyConsentMapper, {
      rTreXu: 'A Minor and Temporary Adjustments (MTA) to an agreement',
      KTObNK: 'An owner of land within a SSSI'
    })
  })
})

describe('assent mapping parity', () => {
  it('matches legacy output for an empty submission', () => {
    expectParity(assentMapping, legacyAssentMapper, {})
  })

  it('matches legacy output for the single-SSSI path with activities and European sites', () => {
    expectParity(
      assentMapping,
      legacyAssentMapper,
      {
        rTreXu: 'A Countryside Stewardship Higher Tier (CSHT) agreement',
        WZJDQG: 'CS/1111/2222',
        gVlMxz: '6006006---Lullington Heath',
        KTObNK: 'Somebody working on behalf of a public body',
        ueDuNl: 'Acme Consulting',
        htlAAq: 'Alex',
        pPocjH: 'Jones',
        skdDtj: 'alex.jones@example.com',
        ylXSKE: '106666666'
      },
      {
        gzSkgC: [
          { lGsnXi: 'Scrub clearance', uqfCOY: { easting: 1, northing: 2 } },
          { lGsnXi: 'Scrub clearance', uqfCOY: { easting: 3, northing: 4 } },
          { lGsnXi: 'Path maintenance' }
        ],
        aQYWxD: [{ IzQfir: '7---Arun Valley Ramsar' }]
      }
    )
  })

  it('matches legacy output for the multi-SSSI scheme path with a local planning authority', () => {
    expectParity(
      assentMapping,
      legacyAssentMapper,
      {
        ASataH: true,
        rTreXu: 'A Higher Level Stewardship (HLS) agreement',
        OFiizI: 'HLS-3333',
        vUHwan: 'Local planning authority',
        XAZlxH: 'Sheffield City Council'
      },
      {
        hhGvmX: [
          { flbYHq: '7007007---Wicken Fen' },
          { flbYHq: '8008008---Stiperstones' }
        ]
      }
    )
  })

  it('matches legacy output for the multi-SSSI ORNEC path with grouped coordinates', () => {
    expectParity(
      assentMapping,
      legacyAssentMapper,
      {
        ASataH: true,
        rTreXu: 'Other schemes',
        aIixRu: 'Bespoke woodland scheme',
        WtpFqT: 'WS-1',
        vUHwan: 'Government agency',
        cfPoiN: 'Other',
        FyLHmN: 'Some Other Body'
      },
      {
        QxIzSB: [
          {
            wRGnMW: '9009009---Moor House',
            iNDqRN: 'Ditch blocking',
            KnBNzJ: { easting: 10, northing: 20 }
          },
          {
            wRGnMW: '9009009---Moor House',
            iNDqRN: 'Fencing',
            KnBNzJ: { easting: 30, northing: 40 }
          },
          {
            wRGnMW: '1101101---Ingleborough',
            iNDqRN: 'Ditch blocking'
          }
        ]
      }
    )
  })

  it('matches legacy output for an Other organisation working on behalf of a public body', () => {
    expectParity(assentMapping, legacyAssentMapper, {
      KTObNK: 'Somebody working on behalf of a public body',
      ueDuNl: 'Other',
      Xszriq: 'Independent Ecology Ltd'
    })
  })

  it('matches legacy output for a harbour authority with a named public body', () => {
    expectParity(assentMapping, legacyAssentMapper, {
      vUHwan: 'Harbour authority',
      cfPoiN: 'Dover Harbour Board'
    })
  })
})

describe('advice mapping parity', () => {
  it('matches legacy output for an empty submission', () => {
    expectParity(adviceMapping, legacyAdviceMapper, {})
  })

  it('matches legacy output for the HRA path with European sites', () => {
    expectParity(
      adviceMapping,
      legacyAdviceMapper,
      {
        NVRbCy: 'Habitats Regulations Assessment (HRA) advice',
        nJVeix: 'Dredging the harbour entrance',
        teEzOl: 'Consultant',
        jYwTmN: 'Marine Surveys Ltd',
        hUpejP: 'Chris Green',
        YOPYRe: 'chris.green@example.com'
      },
      {
        TJuSNf: [
          {
            rtuWky: '7---Arun Valley Ramsar',
            xeJYcG: { easting: 510000, northing: 105000 }
          },
          { rtuWky: '11004---Solent Maritime SAC' }
        ]
      }
    )
  })

  it('matches legacy output for the S28i path via a government agency', () => {
    expectParity(
      adviceMapping,
      legacyAdviceMapper,
      {
        YOwPAJ:
          'Section 28i SSSI advice (statutory consultation, not including HRA)',
        nJVeix: 'Forestry road construction',
        teEzOl: 'Government Agency',
        PBmxNM: 'Government agency',
        PvUZyQ: 'Forestry Commission',
        hUpejP: 'Pat Brown',
        YOPYRe: 'pat.brown@example.com'
      },
      {
        SSSIaffected: [
          {
            Avdzxa: '1001---Kielder Mires',
            NMCFES: { easting: 1, northing: 2 }
          },
          { Avdzxa: '1002---Harbottle Moors' }
        ]
      }
    )
  })

  it('matches legacy output for the damage reporting path', () => {
    expectParity(adviceMapping, legacyAdviceMapper, {
      xzEslQ:
        'I would like to report potentially damaging activity on or near a protected site',
      MoCXGK: '2024---Thorne Moors',
      rSJTFC: { easting: 470000, northing: 410000 },
      YhWlKB: 'Off-road vehicles damaging the peat surface',
      teEzOl: 'Member of public',
      hUpejP: 'Sam Taylor'
    })
  })

  it('matches legacy output for the drone flying path', () => {
    expectParity(adviceMapping, legacyAdviceMapper, {
      xzEslQ:
        'I have a question about flying drones on or near a protected site',
      PxvdiH: '3055---Braunton Burrows',
      mtiMfk: 'Filming sand dune vegetation with a small drone',
      teEzOl: 'Landowner',
      hUpejP: 'Jo Field'
    })
  })

  it('matches legacy output for a general Something else question', () => {
    expectParity(adviceMapping, legacyAdviceMapper, {
      xzEslQ: 'Something else',
      QmIGor: 'Can I designate my meadow as a SSSI?',
      teEzOl: 'Other',
      jYwTmN: 'Other',
      jcctvG: 'Meadow Trust'
    })
  })

  it('matches legacy output for a local planning authority on behalf of path', () => {
    expectParity(adviceMapping, legacyAdviceMapper, {
      xzEslQ:
        'I have a question about designating a Local Nature Reserve (LNR)',
      teEzOl: 'Harbour authority',
      PBmxNM: 'Local Planning Authority',
      YouDQP: 'Arun District Council'
    })
  })

  it('matches legacy output for a public body Other selection', () => {
    expectParity(adviceMapping, legacyAdviceMapper, {
      xzEslQ: 'I have a question about the sale of SSSI land',
      teEzOl: 'Utility provider',
      PBmxNM: 'Public body or organisation',
      HiTHQX: 'Other',
      OYxtmu: 'Regional Water Board'
    })
  })

  it('matches legacy output for an NNR general topic with no sites or activity', () => {
    expectParity(adviceMapping, legacyAdviceMapper, {
      xzEslQ:
        'I have a question about Natural England managed National Nature Reserves (NNRs)',
      teEzOl: 'Land occupier'
    })
  })

  it('matches legacy output when many site names need fitting into the email header', () => {
    const manySites = Array.from({ length: 12 }, (unused, index) => ({
      rtuWky: `${1000 + index}---European Site With A Fairly Long Name Number ${index}`
    }))
    expectParity(
      adviceMapping,
      legacyAdviceMapper,
      {
        NVRbCy: 'Habitats Regulations Assessment (HRA) advice',
        teEzOl: 'Consultant',
        jYwTmN: 'Marine Surveys Ltd'
      },
      { TJuSNf: manySites }
    )
  })
})
