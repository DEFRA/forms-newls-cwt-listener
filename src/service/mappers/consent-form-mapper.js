/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('./types.js').ConsentFormOutput} ConsentFormOutput
 */

import {
  EMAIL_HEADER_MAX_LENGTH,
  fitNames,
  formatCoordinates,
  joinCoordinates,
  parseName,
  parseSssiId
} from './helpers.js'

/**
 * Mapping from the rTreXu scheme selection to detailed_work_type values.
 * rTreXu = "What land management scheme does this notice relate to?"
 * @type {Record<string, string>}
 */
const schemeToDetailedWorkType = {
  'A Countryside Stewardship Higher Tier (CSHT) agreement':
    'S28E Consent CS HT',
  'A Countryside Stewardship Mid Tier (CSMT) agreement extension':
    'S28E Consent CS MT',
  'A Countryside Stewardship Capital Grants agreement':
    'S28E Consent CS Capital Grants',
  'A Higher Level Stewardship (HLS) agreement': 'S28E Consent HLS extension',
  'A Sustainable Farming Incentive (SFI) agreement': 'S28E Consent SFI',
  'A Minor and Temporary Adjustments (MTA)': 'S28E Consent MTA',
  'Other schemes': 'S28E Consent'
}

/**
 * Mapping from KTObNK customer type to consulting_body_type output values.
 * KTObNK = "What type of customer are you?"
 * @type {Record<string, string>}
 */
const customerTypeMap = {
  'An owner of land within a SSSI': 'Landowner',
  'An occupier of land within a SSSI': 'Land occupier',
  'Someone with permission to work on behalf of an owner or occupier of land within a SSSI':
    'Consultant',
  'Somebody else': 'Other'
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
    return 'S28E Consent'
  }

  // Check for partial match on MTA (form text may be longer)
  for (const [key, value] of Object.entries(schemeToDetailedWorkType)) {
    if (landManagementScheme.startsWith(key)) {
      return value
    }
  }

  return 'S28E Consent'
}

/**
 * Collects the primary segment (scheme and/or activities) and SSSI names
 * for building the email header and description.
 * When both scheme and activities are present, the scheme is listed first.
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {{ primary: string, sssiNames: string[] }}
 */
function collectConsentSegments(main, repeaters) {
  // Collect all unique activities
  /** @type {string[]} */
  let activities = []

  // Single SSSI path - repeater iTBHrY ("Operations requiring Natural England consent")
  //   hqsZMS = "Which activity do you plan to carry out?"
  const singleRepeater = repeaters.iTBHrY ?? []
  if (singleRepeater.length > 0) {
    activities = [
      ...new Set(
        singleRepeater
          .map((entry) => /** @type {string} */ (entry.hqsZMS))
          .filter(Boolean)
      )
    ]
  }

  // Multi SSSI path - repeater cwZgSE ("Site name and operations requiring Natural England consent")
  //   BscJLV = "Which activity do you plan to carry out?"
  const multiRepeater = repeaters.cwZgSE ?? []
  if (activities.length === 0 && multiRepeater.length > 0) {
    activities = [
      ...new Set(
        multiRepeater
          .map((entry) => /** @type {string} */ (entry.BscJLV))
          .filter(Boolean)
      )
    ]
  }

  // Collect unique SSSI names (parsed from "ID---Name" format)
  /** @type {string[]} */
  let sssiNames

  // hozdvW = "What is the name of the SSSI where you plan to carry out activities?"
  const singleSssi = /** @type {string | undefined} */ (main.hozdvW)
  if (singleSssi) {
    sssiNames = [parseName(singleSssi)]
  } else if (multiRepeater.length > 0) {
    sssiNames = [
      ...new Set(
        multiRepeater
          .map((entry) => (entry.rWrBOK ? parseName(entry.rWrBOK) : ''))
          .filter(Boolean)
      )
    ]
  } else {
    // Multi SSSI scheme path - repeater gWZwzI
    //   gVlMxz = "What is the name of the SSSI where activities are planned?"
    const schemeRepeater = repeaters.gWZwzI ?? []
    sssiNames = schemeRepeater
      .map((entry) => (entry.gVlMxz ? parseName(entry.gVlMxz) : ''))
      .filter(Boolean)
  }

  // Build primary segment: scheme and/or activities (both included when present, scheme first)
  // rTreXu = "What land management scheme does this notice relate to?"
  const landManagementScheme = /** @type {string | undefined} */ (main.rTreXu)
  const primaryParts = landManagementScheme ? [landManagementScheme] : []
  primaryParts.push(...activities)
  const primary = primaryParts.join(', ')

  return { primary, sssiNames }
}

/**
 * Builds the description from activities, SSSI names, and scheme info.
 * Uses the same segments as mapEmailHeader but without a length limit.
 *
 * Format: "[scheme and/or activities] - [SSSI names]"
 * Fallback: "S28E Consent"
 *
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {string}
 */
function mapDescription(main, repeaters) {
  const { primary, sssiNames } = collectConsentSegments(main, repeaters)
  const segments = [
    primary,
    sssiNames.length > 0 ? sssiNames.join(', ') : ''
  ].filter(Boolean)
  return segments.length > 0 ? segments.join(' - ') : 'S28E Consent'
}

/**
 * Maps the agreement_reference from scheme-dependent fields.
 * @param {Record<string, unknown>} main
 * @returns {string}
 */
function mapAgreementReference(main) {
  // rTreXu = "What land management scheme does this notice relate to?"
  const landManagementScheme = /** @type {string | undefined} */ (main.rTreXu)

  if (landManagementScheme) {
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
      // WZJDQG = "What's your Countryside Stewardship agreement reference number?"
      return /** @type {string} */ (main.WZJDQG) ?? ''
    }

    if (
      landManagementScheme.startsWith(
        'A Higher Level Stewardship (HLS) agreement'
      )
    ) {
      // OFiizI = "What's your Higher Level Stewardship agreement reference number?"
      return /** @type {string} */ (main.OFiizI) ?? ''
    }

    if (
      landManagementScheme.startsWith(
        'A Sustainable Farming Incentive (SFI) agreement'
      )
    ) {
      // niVAkO = "What's your Sustainable Farming Incentive agreement number?"
      return /** @type {string} */ (main.niVAkO) ?? ''
    }

    if (landManagementScheme.startsWith('Other schemes')) {
      // WtpFqT = "What is the scheme reference number?" (optional)
      return /** @type {string} */ (main.WtpFqT) ?? ''
    }
  }

  // Another permission path
  // VacBun = "What is the name of the permission?" (page: "Other related permission")
  const permissionName = /** @type {string | undefined} */ (main.VacBun)
  if (permissionName) {
    return permissionName
  }

  // Fallback
  // WtpFqT = "What is the scheme reference number?" (optional)
  return /** @type {string} */ (main.WtpFqT) ?? ''
}

/**
 * Builds the email_header from activities, SSSI names, and scheme info.
 * Uses the same segments as mapDescription but truncated to 255 characters.
 *
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {string}
 */
function mapEmailHeader(main, repeaters) {
  const separator = ' - '
  const { primary, sssiNames } = collectConsentSegments(main, repeaters)

  if (!primary && sssiNames.length === 0) {
    return 'S28E Consent'
  }

  if (sssiNames.length === 0) {
    return primary.length <= EMAIL_HEADER_MAX_LENGTH
      ? primary
      : primary.substring(0, EMAIL_HEADER_MAX_LENGTH - 3) + '...'
  }

  if (!primary) {
    return fitNames(sssiNames, EMAIL_HEADER_MAX_LENGTH)
  }

  const prefixWithSeparator = primary + separator
  const availableForNames = EMAIL_HEADER_MAX_LENGTH - prefixWithSeparator.length
  const fittedNames = fitNames(sssiNames, availableForNames)

  return fittedNames
    ? prefixWithSeparator + fittedNames
    : primary.substring(0, EMAIL_HEADER_MAX_LENGTH)
}

/**
 * Builds SSSI_info array from repeater data.
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {import('./types.js').ConsentSSSIInfo[]}
 */
function mapSssiInfo(main, repeaters) {
  /** @type {import('./types.js').ConsentSSSIInfo[]} */
  const sssiInfo = []

  // hozdvW = "What is the name of the SSSI where you plan to carry out activities?"
  const sssiId = /** @type {string | undefined} */ (main.hozdvW)
  // lmqMaY = "Are you planning to carry out activities on more than one SSSI?"
  const isMultipleSssi = /** @type {boolean | undefined} */ (main.lmqMaY)

  if (!isMultipleSssi && sssiId) {
    // Single SSSI - scheme path (CS/HLS/MTA)
    // JPohUD = "Where are the activities taking place?" (Easting and Northing coordinates)
    const activityCoordinates =
      /** @type {{ easting: number, northing: number } | undefined} */ (
        main.JPohUD
      )

    // Single SSSI - non-scheme path with repeater iTBHrY ("Operations requiring Natural England consent")
    //   QKdhfh = "Where do you plan to carry out this activity?"
    //   hqsZMS = "Which activity do you plan to carry out?"
    const ornecRepeater = repeaters.iTBHrY ?? []

    if (ornecRepeater.length > 0) {
      // Non-scheme path: each repeater entry is an activity for this single SSSI
      /** @type {string[]} */
      const coordStrings = []
      /** @type {string[]} */
      const ornecNames = []

      for (const entry of ornecRepeater) {
        if (entry.QKdhfh) {
          coordStrings.push(
            formatCoordinates(
              /** @type {{ easting: number, northing: number }} */ (
                entry.QKdhfh
              )
            )
          )
        }
        if (entry.hqsZMS) {
          ornecNames.push(/** @type {string} */ (entry.hqsZMS))
        }
      }

      sssiInfo.push({
        SSSI_id: parseSssiId(sssiId),
        coordinates:
          coordStrings.length > 0 ? joinCoordinates(coordStrings) : '',
        ornec: ornecNames.join(', ')
      })
    } else if (activityCoordinates) {
      // Scheme path: single coordinate set, no ORNECs
      sssiInfo.push({
        SSSI_id: parseSssiId(sssiId),
        coordinates: formatCoordinates(activityCoordinates),
        ornec: ''
      })
    } else {
      sssiInfo.push({
        SSSI_id: parseSssiId(sssiId),
        coordinates: '',
        ornec: ''
      })
    }
  } else if (isMultipleSssi) {
    // Multi SSSI non-scheme path - repeater cwZgSE ("Site name and operations requiring Natural England consent")
    //   rWrBOK = "What is the name of the SSSI where you plan to carry out this activity?"
    //   gjWdrc = "Where on the SSSI do you plan to carry out this activity?"
    //   BscJLV = "Which activity do you plan to carry out?"
    const multiRepeater = repeaters.cwZgSE ?? []

    if (multiRepeater.length > 0) {
      /** @type {Map<string, { coords: string[], ornecs: string[] }>} */
      const sssiData = new Map()

      for (const entry of multiRepeater) {
        const entrySssiId =
          /** @type {string | undefined} */ (entry.rWrBOK) ?? 'Unknown'
        if (!sssiData.has(entrySssiId)) {
          sssiData.set(entrySssiId, { coords: [], ornecs: [] })
        }
        const data = sssiData.get(entrySssiId)
        if (entry.gjWdrc) {
          data?.coords.push(
            formatCoordinates(
              /** @type {{ easting: number, northing: number }} */ (
                entry.gjWdrc
              )
            )
          )
        }
        if (entry.BscJLV) {
          data?.ornecs.push(/** @type {string} */ (entry.BscJLV))
        }
      }

      for (const [id, data] of sssiData) {
        sssiInfo.push({
          SSSI_id: parseSssiId(id),
          coordinates:
            data.coords.length > 0 ? joinCoordinates(data.coords) : '',
          ornec: data.ornecs.join(', ')
        })
      }
    } else {
      // Multi SSSI scheme path - repeater gWZwzI ("Sites where you plan to carry out activities")
      //   gVlMxz = "What is the name of the SSSI where activities are planned?"
      // JPohUD = "Where are the activities taking place?" (shared across all SSSIs on scheme path)
      const activityCoordinates =
        /** @type {{ easting: number, northing: number } | undefined} */ (
          main.JPohUD
        )
      const formattedCoordinates = activityCoordinates
        ? formatCoordinates(activityCoordinates)
        : ''

      const schemeRepeater = repeaters.gWZwzI ?? []
      for (const entry of schemeRepeater) {
        if (entry.gVlMxz) {
          sssiInfo.push({
            SSSI_id: parseSssiId(entry.gVlMxz),
            coordinates: formattedCoordinates,
            ornec: ''
          })
        }
      }
    }
  }

  return sssiInfo
}

/**
 * Maps the forms submission to the CWT consent form output.
 * @param {FormAdapterSubmissionMessage} message
 * @returns {ConsentFormOutput}
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
  // rkIHYS = "What is the Single Business Identifier (SBI) number of where the activities will take place?" (page 15, mandatory SBI page, priority)
  const sbiNumber = /** @type {string | undefined} */ (main.rkIHYS)
  // VLUhzR = "Single business identifier (SBI)" (page 39, landowner/occupier address details page, fallback)
  const sbiNumberAddress = /** @type {string | undefined} */ (main.VLUhzR)
  const sbi = sbiNumber ?? sbiNumberAddress

  return {
    form_type: 'consent',
    DF_reference_number: message.meta.referenceNumber,
    broad_work_type: 'S28E Consent',
    detailed_work_type: mapDetailedWorkType(main),
    description: mapDescription(main, repeaters),
    consulting_body_type: customerType
      ? (customerTypeMap[customerType] ??
        (() => {
          throw new Error(`Unexpected customer type: '${customerType}'`)
        })())
      : '',
    // htlAAq = "What is your first name?", pPocjH = "What is your last name?"
    customer_name: `${main.htlAAq ?? ''} ${main.pPocjH ?? ''}`.trim(),
    // skdDtj = "What's your email address?"
    customer_email_address: /** @type {string} */ (main.skdDtj) ?? '',
    SBI: sbi ? Number(sbi) : undefined,
    agreement_reference: mapAgreementReference(main),
    email_header: mapEmailHeader(main, repeaters),
    SSSI_info: mapSssiInfo(main, repeaters)
  }
}
