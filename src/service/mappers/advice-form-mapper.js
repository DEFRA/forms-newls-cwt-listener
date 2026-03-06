/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('./types.js').AdviceFormOutput} AdviceFormOutput
 */

import { formatCoordinates } from './helpers.js'

/**
 * Mapping from the xzEslQ general topic field to detailed_work_type values.
 * xzEslQ = "Which topic fits the nature of your question the best?"
 * @type {Record<string, string>}
 */
const generalTopicToDetailedWorkType = {
  'I am a SSSI landowner or land occupier and I would like advice before applying for SSSI consent':
    'SSSI - Pre Consent advice',
  'I represent a public body and I would like advice before applying for SSSI assent':
    'SSSI - Pre Assent advice',
  'I would like to report potentially damaging activity on or near a protected site':
    'SSSI - Site visits/surveys',
  'I would like to submit or request surveys or information about the condition of SSSIs':
    'SSSI - Regulation and Enforcement',
  'I have a question about Natural England managed National Nature Reserves (NNRs)':
    'SSSI - Other',
  'I have a question about designating a Local Nature Reserve (LNR)': 'LNRs',
  'I have a question about flying drones on or near a protected site':
    'SSSI - Other',
  'I have a question about designating or de-designating SSSIs': 'SSSI - Other',
  'I have a question about the sale of SSSI land': 'SSSI - Other',
  'Something else': 'SSSI - Other'
}

/**
 * Mapping from the consulting body type form value to the CWT output value.
 * @type {Record<string, string>}
 */
const consultingBodyTypeMap = {
  Consultant: 'Consultant',
  'Government Agency': 'Government Agency',
  'Harbour authority': 'Harbour Authority',
  Landowner: 'Landowner',
  'Land occupier': 'Land occupier',
  'Member of public': 'Member of public',
  Other: 'Other',
  'Regional body': 'Local Planning Authority',
  'Utility provider': 'Utility Provider'
}

/**
 * Determines the broad_work_type from the advice type fields.
 * Precedence:
 *   NVRbCy ("What type of advice are you requesting?" - FC path) ->
 *   YOwPAJ ("Tell us which type of advice you are requesting" - S28G path) ->
 *   xzEslQ ("Which topic fits the nature of your question the best?" - general topics).
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapBroadWorkType(main) {
  const nvrbcy = /** @type {string | undefined} */ (main.NVRbCy)
  const yowpaj = /** @type {string | undefined} */ (main.YOwPAJ)

  if (nvrbcy) {
    if (nvrbcy === 'HRA advice') {
      return 'Standalone HRA Reg 63'
    }
    if (nvrbcy === 'S28I SSSI advice') {
      return 'S28i Advice'
    }
    if (nvrbcy === 'Something else') {
      return 'Other casework'
    }
  }

  if (yowpaj) {
    if (yowpaj === 'Standalone HRA advice') {
      return 'Standalone HRA Reg 63'
    }
    if (yowpaj === 'S28i SSSI advice') {
      return 'S28i Advice'
    }
    if (yowpaj === 'Something else') {
      return 'Other casework'
    }
  }

  // All general topics map to "Other casework"
  return 'Other casework'
}

/**
 * Determines the detailed_work_type from the advice type fields.
 * Same precedence as broad_work_type.
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapDetailedWorkType(main) {
  // NVRbCy = "What type of advice are you requesting?"
  const nvrbcy = /** @type {string | undefined} */ (main.NVRbCy)
  // YOwPAJ = "Tell us which type of advice you are requesting"
  const yowpaj = /** @type {string | undefined} */ (main.YOwPAJ)
  // xzEslQ = "Which topic fits the nature of your question the best?"
  const xzeslq = /** @type {string | undefined} */ (main.xzEslQ)

  if (nvrbcy && nvrbcy !== 'Something else') {
    if (nvrbcy === 'HRA advice') {
      return 'Standalone HRA Reg 63'
    }
    if (nvrbcy === 'S28I SSSI advice') {
      return 'S28i Advice'
    }
  }

  if (yowpaj && yowpaj !== 'Something else') {
    if (yowpaj === 'Standalone HRA advice') {
      return 'Standalone HRA Reg 63'
    }
    if (yowpaj === 'S28i SSSI advice') {
      return 'S28i Advice'
    }
  }

  // "Something else" on NVRbCy/YOwPAJ or direct xzEslQ path
  if (xzeslq) {
    return generalTopicToDetailedWorkType[xzeslq] ?? 'SSSI - Other'
  }

  return 'SSSI - Other'
}

/**
 * Builds the description field from path-dependent fields.
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {string}
 */
function mapDescription(main, repeaters) {
  const parts = []

  // NVRbCy = "What type of advice are you requesting?"
  const nvrbcy = /** @type {string | undefined} */ (main.NVRbCy)
  // YOwPAJ = "Tell us which type of advice you are requesting"
  const yowpaj = /** @type {string | undefined} */ (main.YOwPAJ)

  const isHraPath =
    nvrbcy === 'HRA advice' || yowpaj === 'Standalone HRA advice'
  const isSssiAdvicePath =
    nvrbcy === 'S28I SSSI advice' || yowpaj === 'S28i SSSI advice'

  if (isHraPath) {
    // HRA advice path: HRA stage + European site names
    // emlmbt = "What stage of HRA advice are you requesting?"
    const emlmbt = /** @type {string | undefined} */ (main.emlmbt)
    if (emlmbt) {
      parts.push(`Advice on ${emlmbt.toLowerCase()}`)
    }
    // TJuSNf = Repeater: "European site" on page "Which European site does this plan or project affect?"
    const euroSites = repeaters.TJuSNf ?? []
    // rtuWky = "What is the name of the European site?"
    const siteNames = euroSites
      .map((entry) => /** @type {string} */ (entry.rtuWky))
      .filter(Boolean)
    if (siteNames.length > 0) {
      parts.push(siteNames.join(', '))
    }
  } else if (isSssiAdvicePath) {
    // S28I SSSI advice path: SSSI names from repeater
    // Avdzxa = "What is the name of SSSI where the activities will cause impacts?" (page: "SSSI affected")
    // NMCFES = "Where are the activities planned to take place?" (page: "SSSI affected")
    const sssiRepeater = repeaters.Avdzxa ?? repeaters.NMCFES ?? []
    // The repeater containing Avdzxa fields - look for entries with Avdzxa
    const allRepeaters = Object.values(repeaters).flat()
    const sssiNames = allRepeaters
      .map((entry) => /** @type {string} */ (entry.Avdzxa))
      .filter(Boolean)
    if (sssiNames.length > 0) {
      parts.push(sssiNames.join(', '))
    } else if (sssiRepeater.length > 0) {
      parts.push(
        sssiRepeater
          .map((e) => String(e.Avdzxa ?? ''))
          .filter(Boolean)
          .join(', ')
      )
    }
  } else {
    // General topics path
    // xzEslQ = "Which topic fits the nature of your question the best?"
    const xzeslq = /** @type {string | undefined} */ (main.xzEslQ)
    if (xzeslq) {
      parts.push(xzeslq)
    }
  }

  // Append additional description fields where present
  // QmIGor = "What is your question?"
  const qmigor = /** @type {string | undefined} */ (main.QmIGor)
  if (qmigor) {
    parts.push(qmigor)
  }

  // nJVeix = "Tell us about the proposed activities"
  const njveix = /** @type {string | undefined} */ (main.nJVeix)
  if (njveix) {
    parts.push(njveix)
  }

  // YhWlKB = "Give a description of the damaging activity"
  const yhwlkb = /** @type {string | undefined} */ (main.YhWlKB)
  if (yhwlkb) {
    parts.push(yhwlkb)
  }

  return parts.join(' - ')
}

/**
 * Resolves the consulting_body based on user type and public body selection.
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapConsultingBody(main) {
  // teEzOl = "Which category best describes who is making this application?"
  const teezol = /** @type {string | undefined} */ (main.teEzOl)
  // PBmxNM = "Who are you working on behalf of?"
  const pbmxnm = /** @type {string | undefined} */ (main.PBmxNM)
  // PvUZyQ = "Which government agency do you work for?"
  const pvuzuq = /** @type {string | undefined} */ (main.PvUZyQ)
  // hOsLRu = "Tell us which government agency you work for"
  const hoslru = /** @type {string | undefined} */ (main.hOsLRu)
  // YouDQP = "Which local authority do you work for?"
  const youdqp = /** @type {string | undefined} */ (main.YouDQP)
  // HiTHQX = "Which public body do you work for?"
  const hithqx = /** @type {string | undefined} */ (main.HiTHQX)
  // OYxtmu = "Which public body are you representing?"
  const oyxtmu = /** @type {string | undefined} */ (main.OYxtmu)

  // Determine the effective body type - either direct from teEzOl or via PBmxNM
  const effectiveType = pbmxnm ?? teezol

  if (
    effectiveType === 'Government Agency' ||
    effectiveType === 'Government agency'
  ) {
    if (pvuzuq === 'Forestry Commission') {
      return 'Forestry Commission'
    }
    if (pvuzuq === 'Environment Agency') {
      return 'Environment Agency'
    }
    if (pvuzuq === 'Other government agency') {
      return hoslru ?? ''
    }
  }

  if (
    effectiveType === 'Local Planning Authority' ||
    effectiveType === 'Regional body'
  ) {
    return youdqp ?? ''
  }

  if (
    effectiveType === 'Harbour authority' ||
    effectiveType === 'Utility provider' ||
    effectiveType === 'Public body or organisation'
  ) {
    if (hithqx === 'Other') {
      return oyxtmu ?? ''
    }
    return hithqx ?? ''
  }

  if (
    effectiveType === 'Landowner' ||
    effectiveType === 'Land occupier' ||
    effectiveType === 'None of the above'
  ) {
    return effectiveType
  }

  // Consultant or Other - follow PBmxNM chain
  if ((teezol === 'Consultant' || teezol === 'Other') && pbmxnm) {
    return mapConsultingBodyFromPbmxnm(main)
  }

  return ''
}

/**
 * Resolves consulting_body when a PBmxNM value is present (Consultant/Other working on behalf).
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapConsultingBodyFromPbmxnm(main) {
  // PBmxNM = "Who are you working on behalf of?"
  const pbmxnm = /** @type {string} */ (main.PBmxNM)
  // PvUZyQ = "Which government agency do you work for?"
  const pvuzuq = /** @type {string | undefined} */ (main.PvUZyQ)
  // hOsLRu = "Tell us which government agency you work for"
  const hoslru = /** @type {string | undefined} */ (main.hOsLRu)
  // YouDQP = "Which local authority do you work for?"
  const youdqp = /** @type {string | undefined} */ (main.YouDQP)
  // HiTHQX = "Which public body do you work for?"
  const hithqx = /** @type {string | undefined} */ (main.HiTHQX)
  // OYxtmu = "Which public body are you representing?"
  const oyxtmu = /** @type {string | undefined} */ (main.OYxtmu)

  if (pbmxnm === 'Government agency') {
    if (pvuzuq === 'Forestry Commission') {
      return 'Forestry Commission'
    }
    if (pvuzuq === 'Environment Agency') {
      return 'Environment Agency'
    }
    if (pvuzuq === 'Other government agency') {
      return hoslru ?? ''
    }
  }

  if (pbmxnm === 'Local Planning Authority') {
    return youdqp ?? ''
  }

  if (pbmxnm === 'Public body or organisation') {
    if (hithqx === 'Other') {
      return oyxtmu ?? ''
    }
    return hithqx ?? ''
  }

  if (
    pbmxnm === 'Landowner' ||
    pbmxnm === 'Land occupier' ||
    pbmxnm === 'None of the above'
  ) {
    return pbmxnm
  }

  return ''
}

/**
 * Maps the public_body_type from PBmxNM.
 * @param {string | undefined} pbmxnm
 * @returns {string}
 */
function mapPublicBodyType(pbmxnm) {
  if (!pbmxnm) {
    return ''
  }
  if (pbmxnm === 'Government agency') {
    return 'Government Agency'
  }
  return pbmxnm
}

/**
 * Maps the public_body name from PBmxNM-dependent fields.
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapPublicBody(main) {
  // PBmxNM = "Who are you working on behalf of?"
  const pbmxnm = /** @type {string | undefined} */ (main.PBmxNM)
  if (!pbmxnm) {
    return ''
  }

  // PvUZyQ = "Which government agency do you work for?"
  const pvuzuq = /** @type {string | undefined} */ (main.PvUZyQ)
  // hOsLRu = "Tell us which government agency you work for"
  const hoslru = /** @type {string | undefined} */ (main.hOsLRu)
  // YouDQP = "Which local authority do you work for?"
  const youdqp = /** @type {string | undefined} */ (main.YouDQP)
  // HiTHQX = "Which public body do you work for?"
  const hithqx = /** @type {string | undefined} */ (main.HiTHQX)
  // OYxtmu = "Which public body are you representing?"
  const oyxtmu = /** @type {string | undefined} */ (main.OYxtmu)

  if (pbmxnm === 'Government agency') {
    if (pvuzuq === 'Other government agency') {
      return hoslru ?? ''
    }
    return pvuzuq ?? ''
  }

  if (pbmxnm === 'Local Planning Authority') {
    return youdqp ?? ''
  }

  if (pbmxnm === 'Public body or organisation') {
    if (hithqx === 'Other') {
      return oyxtmu ?? ''
    }
    return hithqx ?? ''
  }

  return ''
}

/**
 * Builds SSSI_info array from repeater data.
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {import('./types.js').SSSIInfo[]}
 */
function mapSssiInfo(main, repeaters) {
  /** @type {import('./types.js').SSSIInfo[]} */
  const sssiInfo = []

  // SSSI advice path - repeater entries with:
  //   Avdzxa = "What is the name of SSSI where the activities will cause impacts?" (page: "SSSI affected")
  //   NMCFES = "Where are the activities planned to take place?" (page: "SSSI affected")
  for (const entries of Object.values(repeaters)) {
    for (const entry of entries) {
      if (entry.Avdzxa) {
        sssiInfo.push({
          SSSI_id: /** @type {string} */ (entry.Avdzxa),
          coordinates: entry.NMCFES
            ? formatCoordinates(
                /** @type {{ easting: number, northing: number }} */ (
                  entry.NMCFES
                )
              )
            : ''
        })
      }
    }
  }

  // Damage reporting path:
  //   MoCXGK = "What is the name of the SSSI that you would like to report damage for?"
  //   rSJTFC = "Where on the SSSI has the damage taken place?"
  if (sssiInfo.length === 0 && main.MoCXGK) {
    sssiInfo.push({
      SSSI_id: /** @type {string} */ (main.MoCXGK),
      coordinates: main.rSJTFC
        ? formatCoordinates(
            /** @type {{ easting: number, northing: number }} */ (main.rSJTFC)
          )
        : ''
    })
  }

  return sssiInfo
}

/**
 * Builds euro_site_info array from repeater data.
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {import('./types.js').EuroSiteInfo[]}
 */
function mapEuroSiteInfo(repeaters) {
  /** @type {import('./types.js').EuroSiteInfo[]} */
  const euroSiteInfo = []

  // TJuSNf = Repeater: "European site" on page "Which European site does this plan or project affect?"
  const euroSites = repeaters.TJuSNf ?? []
  for (const entry of euroSites) {
    // rtuWky = "What is the name of the European site?"
    if (entry.rtuWky) {
      euroSiteInfo.push({
        european_site_id: /** @type {number} */ (entry.rtuWky),
        // xeJYcG = "Where are the activities taking place?" (European site coordinates)
        european_site_coordinates: entry.xeJYcG
          ? formatCoordinates(
              /** @type {{ easting: number, northing: number }} */ (
                entry.xeJYcG
              )
            )
          : ''
      })
    }
  }

  return euroSiteInfo
}

/**
 * Maps the forms submission to the CWT advice form output.
 * @param {FormAdapterSubmissionMessage} message
 * @returns {AdviceFormOutput}
 */
export function mapFormSubmission(message) {
  if (!message.messageId) {
    throw new Error('Unexpected missing message.messageId')
  }

  const main = /** @type {Record<string, unknown>} */ (message.data.main)
  const repeaters =
    /** @type {Record<string, Array<Record<string, unknown>>>} */ (
      message.data.repeaters
    )

  // PBmxNM = "Who are you working on behalf of?"
  const pbmxnm = /** @type {string | undefined} */ (main.PBmxNM)
  // teEzOl = "Which category best describes who is making this application?"
  const teezol = /** @type {string | undefined} */ (main.teEzOl)
  const detailedWorkType = mapDetailedWorkType(main)
  const euroSiteInfo = mapEuroSiteInfo(repeaters)

  return {
    form_type: 'advice',
    broad_work_type: mapBroadWorkType(main),
    detailed_work_type: detailedWorkType,
    description: mapDescription(main, repeaters),
    consulting_body_type: teezol
      ? (consultingBodyTypeMap[teezol] ?? teezol)
      : '',
    consulting_body: mapConsultingBody(main),
    // hUpejP = "What is your full name?"
    customer_name: /** @type {string} */ (main.hUpejP) ?? '',
    // YOPYRe = "What is your email address?"
    customer_email_address: /** @type {string} */ (main.YOPYRe) ?? '',
    email_header: detailedWorkType,
    is_contractor_working_for_public_body: pbmxnm ? 'Yes' : 'No',
    public_body_type: pbmxnm ? mapPublicBodyType(pbmxnm) : '',
    public_body: pbmxnm ? mapPublicBody(main) : '',
    is_there_a_european_site: euroSiteInfo.length > 0 ? 'Yes' : 'No',
    SSSI_info: mapSssiInfo(main, repeaters),
    euro_site_info: euroSiteInfo
  }
}
