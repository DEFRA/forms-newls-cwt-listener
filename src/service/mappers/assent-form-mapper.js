/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('./types.js').AssentFormOutput} AssentFormOutput
 */

import {
  EMAIL_HEADER_MAX_LENGTH,
  fitNames,
  formatCoordinates,
  joinCoordinates,
  parseEuroSiteId,
  parseName,
  parseSssiId
} from './helpers.js'

/**
 * Mapping from the rTreXu scheme selection to detailed_work_type values.
 * rTreXu = "What land management scheme does this notice relate to?"
 * @type {Record<string, string>}
 */
const schemeToDetailedWorkType = {
  'A Countryside Stewardship Higher Tier (CSHT) agreement': 'S28H Assent CS HT',
  'A Countryside Stewardship Mid Tier (CSMT) agreement extension':
    'S28H Assent CS MT',
  'A Countryside Stewardship Capital Grants agreement':
    'S28H Assent CS Capital Grants',
  'A Higher Level Stewardship (HLS) agreement': 'S28H Assent HLS extension',
  'A Sustainable Farming Incentive (SFI) agreement': 'S28H Assent SFI',
  'A Minor and Temporary Adjustments (MTA)': 'S28H Assent MTA',
  'Other schemes': 'S28H Assent'
}

/**
 * Mapping from vUHwan to consulting_body_type output values.
 * vUHwan = "Which category best describes the public body you're representing?"
 * @type {Record<string, string>}
 */
const publicBodyCategoryMap = {
  Consultant: 'Consultant',
  'Government agency': 'Government Agency',
  'Harbour authority': 'Harbour authority',
  Landowner: 'Landowner',
  'Land occupier': 'Land occupier',
  'Local planning authority': 'Local Planning Authority',
  'Utility provider': 'Utility Provider',
  Other: 'Other'
}

/**
 * Determines the detailed_work_type from the scheme selection.
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapDetailedWorkType(main) {
  // rTreXu = "What land management scheme does this notice relate to?"
  const landManagementScheme = /** @type {string | undefined} */ (main.rTreXu)
  if (!landManagementScheme) {
    return 'S28H Assent'
  }

  // Check for partial match on MTA (form text may be longer)
  for (const [key, value] of Object.entries(schemeToDetailedWorkType)) {
    if (landManagementScheme.startsWith(key)) {
      return value
    }
  }

  return 'S28H Assent'
}

/**
 * Collects SSSI names from all possible sources.
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {string[]}
 */
function collectSssiNames(main, repeaters) {
  // Single SSSI path - gVlMxz = "What is the name of the SSSI where you plan to carry out activities?"
  const singleSssiName = /** @type {string | undefined} */ (main.gVlMxz)
  if (singleSssiName) {
    return [singleSssiName]
  }

  // Multiple SSSI scheme path - repeater hhGvmX
  //   flbYHq = "What is the name of the SSSI where activities are planned?"
  const schemeRepeater = repeaters.hhGvmX ?? []
  if (schemeRepeater.length > 0) {
    return schemeRepeater
      .map((entry) => /** @type {string} */ (entry.flbYHq))
      .filter(Boolean)
  }

  // Multiple SSSI ORNEC path - repeater QxIzSB
  //   wRGnMW = "What is the name of the SSSI where you plan to carry out this activity?"
  const ornecRepeater = repeaters.QxIzSB ?? []
  if (ornecRepeater.length > 0) {
    return [
      ...new Set(
        ornecRepeater
          .map((entry) => /** @type {string} */ (entry.wRGnMW))
          .filter(Boolean)
      )
    ]
  }

  return []
}

/**
 * Collects the primary segment (activities or scheme), SSSI names, and
 * European site names for building the email header and description.
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {{ primary: string, sssiNames: string[], euroSiteNames: string[] }}
 */
function collectAssentSegments(main, repeaters) {
  // Collect all unique activities
  /** @type {string[]} */
  let activities = []

  // Single SSSI path - repeater gzSkgC ("Activities requiring Natural England's assent")
  //   lGsnXi = "What activity is planned to be carried out?"
  const singleSssiActivities = repeaters.gzSkgC ?? []
  if (singleSssiActivities.length > 0) {
    activities = [
      ...new Set(
        singleSssiActivities
          .map((entry) => /** @type {string} */ (entry.lGsnXi))
          .filter(Boolean)
      )
    ]
  }

  // Multiple SSSI path - repeater QxIzSB ("Site name and activities requiring Natural England assent")
  //   iNDqRN = "What activity is planned to be carried out?"
  const multiSssiActivities = repeaters.QxIzSB ?? []
  if (activities.length === 0 && multiSssiActivities.length > 0) {
    activities = [
      ...new Set(
        multiSssiActivities
          .map((entry) => /** @type {string} */ (entry.iNDqRN))
          .filter(Boolean)
      )
    ]
  }

  // Collect unique SSSI names (parsed from "ID---Name" format)
  const sssiNames = collectSssiNames(main, repeaters).map(parseName)

  // Collect unique European site names (parsed from "ID---Name" format)
  /** @type {string[]} */
  const euroSiteNames = (repeaters.aQYWxD ?? [])
    .map((entry) => (entry.IzQfir ? parseName(entry.IzQfir) : ''))
    .filter(Boolean)

  // Build primary segment: activities or scheme
  let primary = ''
  if (activities.length > 0) {
    primary = activities.join(', ')
  } else {
    // rTreXu = "What land management scheme does this notice relate to?"
    const landManagementScheme = /** @type {string | undefined} */ (main.rTreXu)
    if (landManagementScheme) {
      primary = landManagementScheme
    }
  }

  return { primary, sssiNames, euroSiteNames }
}

/**
 * Builds the description from activities, SSSI names, European site names,
 * and scheme info. Uses the same segments as mapEmailHeader but without a
 * length limit.
 *
 * Format: "[activities or scheme] - [SSSI names] - [Euro site names]"
 * Fallback: "S28H Assent"
 *
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {string}
 */
function mapDescription(main, repeaters) {
  const { primary, sssiNames, euroSiteNames } = collectAssentSegments(
    main,
    repeaters
  )
  const segments = [
    primary,
    sssiNames.length > 0 ? sssiNames.join(', ') : '',
    euroSiteNames.length > 0 ? euroSiteNames.join(', ') : ''
  ].filter(Boolean)
  return segments.length > 0 ? segments.join(' - ') : 'S28H Assent'
}

/**
 * Resolves the consulting_body based on the customer type and public body selection.
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapConsultingBody(main) {
  // KTObNK = "What type of customer are you?"
  const customerType = /** @type {string | undefined} */ (main.KTObNK)
  // vUHwan = "Which category best describes the public body you're representing?"
  const publicBodyCategory = /** @type {string | undefined} */ (main.vUHwan)
  // ueDuNl = "What is the name of your organisation?"
  const organisationName = /** @type {string | undefined} */ (main.ueDuNl)
  // Xszriq = "Other organisation name"
  const otherOrganisationName = /** @type {string | undefined} */ (main.Xszriq)
  // XAZlxH = "Which local authority are you representing?"
  const localAuthority = /** @type {string | undefined} */ (main.XAZlxH)
  // cfPoiN = "Which public body are you representing?"
  const publicBody = /** @type {string | undefined} */ (main.cfPoiN)
  // FyLHmN = "Which public body are you representing?" (other/free text)
  const otherPublicBody = /** @type {string | undefined} */ (main.FyLHmN)

  // Working on behalf of a public body - use organisation name
  if (customerType === 'An organisation working on behalf of a public body') {
    if (organisationName === 'Other') {
      return otherOrganisationName ?? ''
    }
    return organisationName ?? ''
  }

  // Local planning authority
  if (publicBodyCategory === 'Local planning authority') {
    return localAuthority ?? ''
  }

  // All other categories - use public body autocomplete
  if (publicBody === 'Other') {
    return otherPublicBody ?? ''
  }
  return publicBody ?? ''
}

/**
 * Maps the agreement_reference from scheme-dependent fields.
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapAgreementReference(main) {
  // rTreXu = "What land management scheme does this notice relate to?"
  const landManagementScheme = /** @type {string | undefined} */ (main.rTreXu)
  if (!landManagementScheme) {
    return ''
  }

  if (
    landManagementScheme.startsWith(
      'A Countryside Stewardship Higher Tier (CSHT) agreement'
    ) ||
    landManagementScheme.startsWith(
      'A Countryside Stewardship Mid Tier (CSMT) agreement extension'
    ) ||
    landManagementScheme.startsWith(
      'A Countryside Stewardship Capital Grants agreement'
    )
  ) {
    // WZJDQG = "What's your Countryside Stewardship Scheme agreement reference number?"
    return /** @type {string} */ (main.WZJDQG) ?? ''
  }

  if (
    landManagementScheme.startsWith(
      'A Higher Level Stewardship (HLS) agreement'
    )
  ) {
    // OFiizI = "What is your Higher Level Stewardship (HLS) agreement reference number?"
    return /** @type {string} */ (main.OFiizI) ?? ''
  }

  if (
    landManagementScheme.startsWith(
      'A Sustainable Farming Incentive (SFI) agreement'
    )
  ) {
    // niVAkO = "What's your Sustainable Farming Incentive (SFI) agreement number?"
    return /** @type {string} */ (main.niVAkO) ?? ''
  }

  return ''
}

/**
 * Maps the public_body name from vUHwan-dependent fields.
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapPublicBody(main) {
  // Because of the way the form is set up, only one of these values will be truthy. Therefore, return the first truthy value.

  // XAZlxH = "Which local authority are you representing?"
  const localAuthority = /** @type {string | undefined} */ (main.XAZlxH)
  // cfPoiN = "Which public body are you representing?"
  const publicBody = /** @type {string | undefined} */ (main.cfPoiN)
  // FyLHmN = "Which public body are you representing?" (other/free text)
  const otherPublicBody = /** @type {string | undefined} */ (main.FyLHmN)

  return localAuthority ?? publicBody ?? otherPublicBody ?? ''
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

  // ASataH = "Are you planning to carry out activities on more than one SSSI?"
  const isMultipleSssi = /** @type {boolean | undefined} */ (main.ASataH)

  if (!isMultipleSssi) {
    // Single SSSI path
    // gVlMxz = "What is the name of the SSSI where you plan to carry out activities?"
    const sssiId = /** @type {string | undefined} */ (main.gVlMxz)
    if (sssiId) {
      // Coordinates from repeater gzSkgC ("Activities requiring Natural England's assent")
      //   uqfCOY = "Where do you plan to carry out this activity?"
      const activities = repeaters.gzSkgC ?? []
      const coordStrings = activities
        .filter((entry) => entry.uqfCOY)
        .map((entry) =>
          formatCoordinates(
            /** @type {{ easting: number, northing: number }} */ (entry.uqfCOY)
          )
        )

      sssiInfo.push({
        SSSI_id: parseSssiId(sssiId),
        coordinates:
          coordStrings.length > 0 ? joinCoordinates(coordStrings) : ''
      })
    }
  } else {
    // Multiple SSSI paths

    // CS/HLS/MTA scheme path - repeater hhGvmX ("Sites where you plan to carry out activities")
    //   flbYHq = "What is the name of the SSSI where activities are planned?"
    const schemeRepeater = repeaters.hhGvmX ?? []
    for (const entry of schemeRepeater) {
      if (entry.flbYHq) {
        sssiInfo.push({
          SSSI_id: parseSssiId(entry.flbYHq),
          coordinates: ''
        })
      }
    }

    // ORNEC details path - repeater QxIzSB ("Site name and activities requiring Natural England assent")
    //   wRGnMW = "What is the name of the SSSI where you plan to carry out this activity?"
    //   KnBNzJ = "Where on the SSSI do you plan to carry out this activity?"
    if (sssiInfo.length === 0) {
      const ornecRepeater = repeaters.QxIzSB ?? []

      // Group by SSSI ID to stitch coordinates
      /** @type {Map<string, string[]>} */
      const sssiCoords = new Map()
      for (const entry of ornecRepeater) {
        const sssiId = /** @type {string | undefined} */ (entry.wRGnMW)
        if (sssiId) {
          if (!sssiCoords.has(sssiId)) {
            sssiCoords.set(sssiId, [])
          }
          if (entry.KnBNzJ) {
            sssiCoords
              .get(sssiId)
              ?.push(
                formatCoordinates(
                  /** @type {{ easting: number, northing: number }} */ (
                    entry.KnBNzJ
                  )
                )
              )
          }
        }
      }

      for (const [id, coords] of sssiCoords) {
        sssiInfo.push({
          SSSI_id: parseSssiId(id),
          coordinates: coords.length > 0 ? joinCoordinates(coords) : ''
        })
      }
    }
  }

  return sssiInfo
}

/**
 * Builds the email_header from activities, SSSI names, European site names,
 * and scheme info. Uses the same segments as mapDescription but truncated
 * to 255 characters.
 *
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {string}
 */
function mapEmailHeader(main, repeaters) {
  const separator = ' - '
  const { primary, sssiNames, euroSiteNames } = collectAssentSegments(
    main,
    repeaters
  )

  if (!primary && sssiNames.length === 0 && euroSiteNames.length === 0) {
    return 'S28H Assent'
  }

  // Build segments: primary, SSSI names, Euro site names
  const segments = [primary]
  let usedLength = primary.length

  if (sssiNames.length > 0) {
    const availableForSssi =
      EMAIL_HEADER_MAX_LENGTH -
      usedLength -
      separator.length -
      (euroSiteNames.length > 0
        ? separator.length + euroSiteNames[0].length
        : 0)
    const fittedSssi = fitNames(
      sssiNames,
      Math.max(availableForSssi, sssiNames[0].length)
    )
    if (fittedSssi) {
      segments.push(fittedSssi)
      usedLength += separator.length + fittedSssi.length
    }
  }

  if (euroSiteNames.length > 0) {
    const availableForEuro =
      EMAIL_HEADER_MAX_LENGTH - usedLength - separator.length
    const fittedEuro = fitNames(euroSiteNames, availableForEuro)
    if (fittedEuro) {
      segments.push(fittedEuro)
    }
  }

  const result = segments.filter(Boolean).join(separator)

  if (result.length <= EMAIL_HEADER_MAX_LENGTH) {
    return result
  }

  return result.substring(0, EMAIL_HEADER_MAX_LENGTH - 3) + '...'
}

/**
 * Builds euro_site_info array from repeater data.
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {import('./types.js').EuroSiteInfoId[]}
 */
function mapEuroSiteInfo(repeaters) {
  /** @type {import('./types.js').EuroSiteInfoId[]} */
  const euroSiteInfo = []

  // aQYWxD = Repeater: "European site affected"
  const euroSites = repeaters.aQYWxD ?? []
  for (const entry of euroSites) {
    // IzQfir = "What is the name of the European site?"
    if (entry.IzQfir) {
      euroSiteInfo.push({
        european_site_id: parseEuroSiteId(entry.IzQfir)
      })
    }
  }

  return euroSiteInfo
}

/**
 * Maps the forms submission to the CWT assent form output.
 * @param {FormAdapterSubmissionMessage} message
 * @returns {AssentFormOutput}
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

  // KTObNK = "What type of customer are you?"
  const customerType = /** @type {string | undefined} */ (main.KTObNK)
  // vUHwan = "Which category best describes the public body you're representing?"
  const publicBodyCategory = /** @type {string | undefined} */ (main.vUHwan)
  // XydYUD = "Could the planned activities affect a European site?"
  const couldAffectEuroSite = /** @type {boolean | undefined} */ (main.XydYUD)

  return {
    form_type: 'assent',
    DF_reference_number: message.meta.referenceNumber,
    broad_work_type: 'S28H Assent',
    detailed_work_type: mapDetailedWorkType(main),
    description: mapDescription(main, repeaters),
    consulting_body_type: publicBodyCategory
      ? (publicBodyCategoryMap[publicBodyCategory] ?? publicBodyCategory)
      : '',
    consulting_body: mapConsultingBody(main),
    // htlAAq = "What is your first name?", pPocjH = "What is your last name?"
    customer_name: `${main.htlAAq ?? ''} ${main.pPocjH ?? ''}`.trim(),
    // skdDtj = "What is your email address?"
    customer_email_address: /** @type {string} */ (main.skdDtj) ?? '',
    email_header: mapEmailHeader(main, repeaters),
    agreement_reference: mapAgreementReference(main),
    is_contractor_working_for_public_body:
      customerType === 'An organisation working on behalf of a public body'
        ? 'Yes'
        : 'No',
    public_body_type: publicBodyCategory
      ? (publicBodyCategoryMap[publicBodyCategory] ?? publicBodyCategory)
      : '',
    public_body: mapPublicBody(main),
    is_there_a_european_site: couldAffectEuroSite ? 'Yes' : 'No',
    SSSI_info: mapSssiInfo(main, repeaters),
    euro_site_info: mapEuroSiteInfo(repeaters)
  }
}
