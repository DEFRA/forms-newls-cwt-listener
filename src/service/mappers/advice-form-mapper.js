/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('./types.js').AdviceFormOutput} AdviceFormOutput
 */

import {
  EMAIL_HEADER_MAX_LENGTH,
  fitNames,
  formatCoordinates,
  parseEuroSiteId,
  parseName,
  parseSssiId
} from './helpers.js'

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
  const typeOfAdvice = /** @type {string | undefined} */ (main.NVRbCy)
  const adviceTypeRequested = /** @type {string | undefined} */ (main.YOwPAJ)

  if (typeOfAdvice) {
    if (typeOfAdvice === 'HRA advice') {
      return 'Standalone HRA Reg 63'
    }
    if (typeOfAdvice === 'S28I SSSI advice') {
      return 'S28i Advice'
    }
    if (typeOfAdvice === 'Something else') {
      return 'Other casework'
    }
  }

  if (adviceTypeRequested) {
    if (adviceTypeRequested === 'Standalone HRA advice') {
      return 'Standalone HRA Reg 63'
    }
    if (adviceTypeRequested === 'S28i SSSI advice') {
      return 'S28i Advice'
    }
    if (adviceTypeRequested === 'Something else') {
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
  const typeOfAdvice = /** @type {string | undefined} */ (main.NVRbCy)
  // YOwPAJ = "Tell us which type of advice you are requesting"
  const adviceTypeRequested = /** @type {string | undefined} */ (main.YOwPAJ)
  // xzEslQ = "Which topic fits the nature of your question the best?"
  const generalTopic = /** @type {string | undefined} */ (main.xzEslQ)

  if (typeOfAdvice && typeOfAdvice !== 'Something else') {
    if (typeOfAdvice === 'HRA advice') {
      return 'Standalone HRA Reg 63'
    }
    if (typeOfAdvice === 'S28I SSSI advice') {
      return 'S28i Advice'
    }
  }

  if (adviceTypeRequested && adviceTypeRequested !== 'Something else') {
    if (adviceTypeRequested === 'Standalone HRA advice') {
      return 'Standalone HRA Reg 63'
    }
    if (adviceTypeRequested === 'S28i SSSI advice') {
      return 'S28i Advice'
    }
  }

  // "Something else" on NVRbCy/YOwPAJ or direct xzEslQ path
  if (generalTopic) {
    return generalTopicToDetailedWorkType[generalTopic] ?? 'SSSI - Other'
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
  const typeOfAdvice = /** @type {string | undefined} */ (main.NVRbCy)
  // YOwPAJ = "Tell us which type of advice you are requesting"
  const adviceTypeRequested = /** @type {string | undefined} */ (main.YOwPAJ)

  const isHraPath =
    typeOfAdvice === 'HRA advice' ||
    adviceTypeRequested === 'Standalone HRA advice'
  const isSssiAdvicePath =
    typeOfAdvice === 'S28I SSSI advice' ||
    adviceTypeRequested === 'S28i SSSI advice'

  if (isHraPath) {
    // HRA advice path: HRA stage + European site names
    // emlmbt = "What stage of HRA advice are you requesting?"
    const hraStage = /** @type {string | undefined} */ (main.emlmbt)
    if (hraStage) {
      parts.push(`Advice on ${hraStage.toLowerCase()}`)
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
    const generalTopic = /** @type {string | undefined} */ (main.xzEslQ)
    if (generalTopic) {
      parts.push(generalTopic)
    }
  }

  // Append additional description fields where present
  // QmIGor = "What is your question?"
  const question = /** @type {string | undefined} */ (main.QmIGor)
  if (question) {
    parts.push(question)
  }

  // nJVeix = "Tell us about the proposed activities"
  const proposedActivities = /** @type {string | undefined} */ (main.nJVeix)
  if (proposedActivities) {
    parts.push(proposedActivities)
  }

  // YhWlKB = "Give a description of the damaging activity"
  const damagingActivityDescription = /** @type {string | undefined} */ (
    main.YhWlKB
  )
  if (damagingActivityDescription) {
    parts.push(damagingActivityDescription)
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
  const applicantCategory = /** @type {string | undefined} */ (main.teEzOl)
  // PBmxNM = "Who are you working on behalf of?"
  const workingOnBehalfOf = /** @type {string | undefined} */ (main.PBmxNM)
  // PvUZyQ = "Which government agency do you work for?"
  const governmentAgency = /** @type {string | undefined} */ (main.PvUZyQ)
  // hOsLRu = "Tell us which government agency you work for"
  const otherGovernmentAgency = /** @type {string | undefined} */ (main.hOsLRu)
  // YouDQP = "Which local authority do you work for?"
  const localAuthority = /** @type {string | undefined} */ (main.YouDQP)
  // HiTHQX = "Which public body do you work for?"
  const publicBody = /** @type {string | undefined} */ (main.HiTHQX)
  // OYxtmu = "Which public body are you representing?"
  const publicBodyRepresenting = /** @type {string | undefined} */ (main.OYxtmu)

  // Consultant or Other - use their own organisation name
  if (applicantCategory === 'Consultant' || applicantCategory === 'Other') {
    return mapOrganisationName(main)
  }

  // Determine the effective body type - either direct from teEzOl or via PBmxNM
  const effectiveType = workingOnBehalfOf ?? applicantCategory

  if (
    effectiveType === 'Government Agency' ||
    effectiveType === 'Government agency'
  ) {
    if (governmentAgency === 'Forestry Commission') {
      return 'Forestry Commission'
    }
    if (governmentAgency === 'Environment Agency') {
      return 'Environment Agency'
    }
    if (governmentAgency === 'Other government agency') {
      return otherGovernmentAgency ?? ''
    }
  }

  if (
    effectiveType === 'Local Planning Authority' ||
    effectiveType === 'Regional body'
  ) {
    return localAuthority ?? ''
  }

  if (
    effectiveType === 'Harbour authority' ||
    effectiveType === 'Utility provider' ||
    effectiveType === 'Public body or organisation'
  ) {
    if (publicBody === 'Other') {
      return publicBodyRepresenting ?? ''
    }
    return publicBody ?? ''
  }

  if (
    effectiveType === 'Landowner' ||
    effectiveType === 'Land occupier' ||
    effectiveType === 'None of the above'
  ) {
    return effectiveType
  }

  return ''
}

/**
 * Maps the public_body_type from PBmxNM.
 * @param {string | undefined} workingOnBehalfOf
 * @param {string | undefined} applicantCategory
 * @returns {string}
 */
function mapPublicBodyType(workingOnBehalfOf, applicantCategory) {
  if (workingOnBehalfOf === 'Government agency') {
    return 'Government Agency'
  }
  return workingOnBehalfOf ?? applicantCategory ?? ''
}

/**
 * Maps the organisation_name from the Consultant/Other organisation fields.
 * jYwTmN = "What is the name of your organisation?" (autocomplete from list)
 * jcctvG = "Other organisation name" (free text, shown when jYwTmN = "Other")
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapOrganisationName(main) {
  // jYwTmN = "What is the name of your organisation?"
  const organisationName = /** @type {string | undefined} */ (main.jYwTmN)
  // jcctvG = "Other organisation name"
  const otherOrganisationName = /** @type {string | undefined} */ (main.jcctvG)

  if (organisationName === 'Other') {
    return otherOrganisationName ?? ''
  }

  return organisationName ?? ''
}

/**
 * Maps the public_body name from PBmxNM-dependent fields.
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapPublicBody(main) {
  // Because of the way the form is set up, only one of these values will be truthy. Therefore, return the first truthy value.

  // hOsLRu = "Tell us which government agency you work for"
  const otherGovernmentAgency = /** @type {string | undefined} */ (main.hOsLRu)
  // PvUZyQ = "Which government agency do you work for?"
  const governmentAgency = /** @type {string | undefined} */ (main.PvUZyQ)
  // YouDQP = "Which local authority do you work for?"
  const localAuthority = /** @type {string | undefined} */ (main.YouDQP)
  // HiTHQX = "Which public body do you work for?"
  const publicBody = /** @type {string | undefined} */ (main.HiTHQX)
  // OYxtmu = "Which public body are you representing?"
  const publicBodyRepresenting = /** @type {string | undefined} */ (main.OYxtmu)

  return (
    otherGovernmentAgency ??
    governmentAgency ??
    localAuthority ??
    publicBody ??
    publicBodyRepresenting ??
    ''
  )
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
          SSSI_id: parseSssiId(entry.Avdzxa),
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
  const sssiDamageId = /** @type {string | undefined} */ (main.MoCXGK)
  if (sssiInfo.length === 0 && sssiDamageId) {
    sssiInfo.push({
      SSSI_id: parseSssiId(sssiDamageId),
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
 * Builds the email_header from the detailed work type and relevant site names.
 *
 * Rules:
 *   1. Start with the detailed_work_type as the prefix.
 *   2. HRA path: append European site names (parsed from "ID---Name" format).
 *   3. S28I SSSI path: append SSSI names (parsed from "ID---Name" format).
 *   4. Damage reporting path: append the damaged SSSI name.
 *   5. General topics path: just the detailed_work_type alone.
 *   6. Truncate to 255 characters, using "(+N more)" when site names are dropped.
 *
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @param {string} detailedWorkType
 * @returns {string}
 */
function mapEmailHeader(main, repeaters, detailedWorkType) {
  const separator = ' - '

  // NVRbCy = "What type of advice are you requesting?"
  const typeOfAdvice = /** @type {string | undefined} */ (main.NVRbCy)
  // YOwPAJ = "Tell us which type of advice you are requesting"
  const adviceTypeRequested = /** @type {string | undefined} */ (main.YOwPAJ)

  const isHraPath =
    typeOfAdvice === 'HRA advice' ||
    adviceTypeRequested === 'Standalone HRA advice'
  const isSssiAdvicePath =
    typeOfAdvice === 'S28I SSSI advice' ||
    adviceTypeRequested === 'S28i SSSI advice'

  /** @type {string[]} */
  let siteNames = []

  if (isHraPath) {
    // European site names from TJuSNf repeater
    const euroSites = repeaters.TJuSNf ?? []
    siteNames = euroSites
      .map((entry) => (entry.rtuWky ? parseName(entry.rtuWky) : ''))
      .filter(Boolean)
  } else if (isSssiAdvicePath) {
    // SSSI names from repeater entries with Avdzxa
    const allRepeaters = Object.values(repeaters).flat()
    siteNames = allRepeaters
      .map((entry) => (entry.Avdzxa ? parseName(entry.Avdzxa) : ''))
      .filter(Boolean)
  } else {
    // Damage reporting SSSI name
    // MoCXGK = "What is the name of the SSSI that you would like to report damage for?"
    const sssiDamageId = /** @type {string | undefined} */ (main.MoCXGK)
    if (sssiDamageId) {
      siteNames = [parseName(sssiDamageId)]
    }
  }

  if (siteNames.length === 0) {
    return detailedWorkType.length <= EMAIL_HEADER_MAX_LENGTH
      ? detailedWorkType
      : detailedWorkType.substring(0, EMAIL_HEADER_MAX_LENGTH - 3) + '...'
  }

  const prefixWithSeparator = detailedWorkType + separator
  const availableForNames = EMAIL_HEADER_MAX_LENGTH - prefixWithSeparator.length
  const fittedNames = fitNames(siteNames, availableForNames)

  return fittedNames
    ? prefixWithSeparator + fittedNames
    : detailedWorkType.substring(0, EMAIL_HEADER_MAX_LENGTH)
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
        european_site_id: parseEuroSiteId(entry.rtuWky),
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
  const workingOnBehalfOf = /** @type {string | undefined} */ (main.PBmxNM)
  // teEzOl = "Which category best describes who is making this application?"
  const applicantCategory = /** @type {string | undefined} */ (main.teEzOl)
  const detailedWorkType = mapDetailedWorkType(main)
  const euroSiteInfo = mapEuroSiteInfo(repeaters)

  return {
    form_type: 'advice',
    DF_reference_number: message.meta.referenceNumber,
    broad_work_type: mapBroadWorkType(main),
    detailed_work_type: detailedWorkType,
    description: mapDescription(main, repeaters),
    consulting_body_type: applicantCategory
      ? (consultingBodyTypeMap[applicantCategory] ?? applicantCategory)
      : '',
    consulting_body: mapConsultingBody(main),
    // hUpejP = "What is your full name?"
    customer_name: /** @type {string} */ (main.hUpejP) ?? '',
    // YOPYRe = "What is your email address?"
    customer_email_address: /** @type {string} */ (main.YOPYRe) ?? '',
    email_header: mapEmailHeader(main, repeaters, detailedWorkType),
    is_contractor_working_for_public_body: workingOnBehalfOf ? 'Yes' : 'No',
    public_body_type: mapPublicBodyType(workingOnBehalfOf, applicantCategory),
    public_body: mapPublicBody(main),
    is_there_a_european_site: euroSiteInfo.length > 0 ? 'Yes' : 'No',
    SSSI_info: mapSssiInfo(main, repeaters),
    euro_site_info: euroSiteInfo
  }
}
