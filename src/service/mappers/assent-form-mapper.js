/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('./types.js').AssentFormOutput} AssentFormOutput
 */

import { formatCoordinates, joinCoordinates } from './helpers.js'

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
 * Builds the description from activity repeaters.
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {string}
 */
function mapDescription(repeaters) {
  // Single SSSI path - repeater gzSkgC ("Activities requiring Natural England's assent")
  //   lGsnXi = "What activity is planned to be carried out?"
  const singleSssiActivities = repeaters.gzSkgC ?? []
  if (singleSssiActivities.length > 0) {
    return singleSssiActivities
      .map((entry) => /** @type {string} */ (entry.lGsnXi))
      .filter(Boolean)
      .join(', ')
  }

  // Multiple SSSI path - repeater QxIzSB ("Site name and activities requiring Natural England assent")
  //   iNDqRN = "What activity is planned to be carried out?"
  const multiSssiActivities = repeaters.QxIzSB ?? []
  if (multiSssiActivities.length > 0) {
    return multiSssiActivities
      .map((entry) => /** @type {string} */ (entry.iNDqRN))
      .filter(Boolean)
      .join(', ')
  }

  return ''
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
  if (customerType === 'Somebody working on behalf of a public body') {
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
  // vUHwan = "Which category best describes the public body you're representing?"
  const publicBodyCategory = /** @type {string | undefined} */ (main.vUHwan)
  if (!publicBodyCategory) {
    return ''
  }

  if (publicBodyCategory === 'Local planning authority') {
    // XAZlxH = "Which local authority are you representing?"
    return /** @type {string} */ (main.XAZlxH) ?? ''
  }

  if (publicBodyCategory === 'Other') {
    // FyLHmN = "Which public body are you representing?" (other/free text)
    return /** @type {string} */ (main.FyLHmN) ?? ''
  }

  // cfPoiN = "Which public body are you representing?"
  return /** @type {string} */ (main.cfPoiN) ?? ''
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
    const sssiName = /** @type {string | undefined} */ (main.gVlMxz)
    if (sssiName) {
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
        SSSI_id: /** @type {string} */ (sssiName),
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
          SSSI_id: /** @type {string} */ (entry.flbYHq),
          coordinates: ''
        })
      }
    }

    // ORNEC details path - repeater QxIzSB ("Site name and activities requiring Natural England assent")
    //   wRGnMW = "What is the name of the SSSI where you plan to carry out this activity?"
    //   KnBNzJ = "Where on the SSSI do you plan to carry out this activity?"
    if (sssiInfo.length === 0) {
      const ornecRepeater = repeaters.QxIzSB ?? []

      // Group by SSSI name to stitch coordinates
      /** @type {Map<string, string[]>} */
      const sssiCoords = new Map()
      for (const entry of ornecRepeater) {
        const sssiName = /** @type {string | undefined} */ (entry.wRGnMW)
        if (sssiName) {
          if (!sssiCoords.has(sssiName)) {
            sssiCoords.set(sssiName, [])
          }
          if (entry.KnBNzJ) {
            sssiCoords
              .get(sssiName)
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

      for (const [name, coords] of sssiCoords) {
        sssiInfo.push({
          SSSI_id: name,
          coordinates: coords.length > 0 ? joinCoordinates(coords) : ''
        })
      }
    }
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

  // aQYWxD = Repeater: "European site affected"
  const euroSites = repeaters.aQYWxD ?? []
  for (const entry of euroSites) {
    // IzQfir = "What is the name of the European site?"
    if (entry.IzQfir) {
      euroSiteInfo.push({
        european_site_id: /** @type {number} */ (entry.IzQfir),
        european_site_coordinates: ''
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
    broad_work_type: 'S28H Assent',
    detailed_work_type: mapDetailedWorkType(main),
    description: mapDescription(repeaters),
    consulting_body_type: publicBodyCategory
      ? (publicBodyCategoryMap[publicBodyCategory] ?? publicBodyCategory)
      : '',
    consulting_body: mapConsultingBody(main),
    // htlAAq = "What is your first name?", pPocjH = "What is your last name?"
    customer_name: `${main.htlAAq ?? ''} ${main.pPocjH ?? ''}`.trim(),
    // skdDtj = "What is your email address?"
    customer_email_address: /** @type {string} */ (main.skdDtj) ?? '',
    agreement_reference: mapAgreementReference(main),
    is_contractor_working_for_public_body:
      customerType === 'Somebody working on behalf of a public body'
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
