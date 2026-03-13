/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('./types.js').ConsentFormOutput} ConsentFormOutput
 */

import { formatCoordinates, joinCoordinates } from './helpers.js'

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
  'Someone with permission to work on behalf of an owner or occupier':
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
 * Builds the description from SSSI names and ORNEC activities.
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {string}
 */
function mapDescription(main, repeaters) {
  const parts = []

  // Single SSSI path
  // hozdvW = "What is the name of the SSSI where you plan to carry out activities?"
  const sssiName = /** @type {string | undefined} */ (main.hozdvW)
  if (sssiName) {
    // iTBHrY = Repeater: "Operations requiring Natural England consent"
    const activities = repeaters.iTBHrY ?? []
    // hqsZMS = "Which activity do you plan to carry out?"
    const activityNames = activities
      .map((entry) => /** @type {string} */ (entry.hqsZMS))
      .filter(Boolean)

    if (activityNames.length > 0) {
      parts.push(`${sssiName} - ${activityNames.join(', ')}`)
    } else {
      parts.push(sssiName)
    }
  }

  // Multi SSSI path - repeater cwZgSE ("Site name and operations requiring Natural England consent")
  //   rWrBOK = "What is the name of the SSSI where you plan to carry out this activity?"
  //   BscJLV = "Which activity do you plan to carry out?"
  if (!sssiName) {
    const multiRepeater = repeaters.cwZgSE ?? []

    /** @type {Map<string, string[]>} */
    const sssiActivities = new Map()
    for (const entry of multiRepeater) {
      const entrySssiName = /** @type {string | undefined} */ (entry.rWrBOK)
      const activity = /** @type {string | undefined} */ (entry.BscJLV)
      if (entrySssiName) {
        if (!sssiActivities.has(entrySssiName)) {
          sssiActivities.set(entrySssiName, [])
        }
        if (activity) {
          sssiActivities.get(entrySssiName)?.push(activity)
        }
      }
    }

    for (const [name, activities] of sssiActivities) {
      if (activities.length > 0) {
        parts.push(`${name} - ${activities.join(', ')}`)
      } else {
        parts.push(name)
      }
    }

    // Multi SSSI scheme path - repeater gWZwzI ("Sites where you plan to carry out activities")
    //   gVlMxz = "What is the name of the SSSI where activities are planned?"
    if (parts.length === 0) {
      const schemeRepeater = repeaters.gWZwzI ?? []
      for (const entry of schemeRepeater) {
        const schemeSssiName = /** @type {string | undefined} */ (entry.gVlMxz)
        if (schemeSssiName) {
          parts.push(schemeSssiName)
        }
      }
    }
  }

  return parts.join('; ')
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
  }

  // Another permission path
  // VacBun = "What is the name of the permission?" (page: "Other related permission")
  const permissionName = /** @type {string | undefined} */ (main.VacBun)
  if (permissionName) {
    return permissionName
  }

  return ''
}

/**
 * Gets the first ORNEC (activity) value for the email_header.
 * Falls back to the land management scheme if no activity is found.
 * Falls back to the detailed_work_type if no activity is found.
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} repeaters
 * @returns {string}
 */
function mapEmailHeader(main, repeaters) {
  // Single SSSI path - repeater iTBHrY ("Operations requiring Natural England consent")
  //   hqsZMS = "Which activity do you plan to carry out?"
  const singleRepeater = repeaters.iTBHrY ?? []
  if (singleRepeater.length > 0 && singleRepeater[0].hqsZMS) {
    return /** @type {string} */ (singleRepeater[0].hqsZMS)
  }

  // Multi SSSI path - repeater cwZgSE ("Site name and operations requiring Natural England consent")
  //   BscJLV = "Which activity do you plan to carry out?"
  const multiRepeater = repeaters.cwZgSE ?? []
  if (multiRepeater.length > 0 && multiRepeater[0].BscJLV) {
    return /** @type {string} */ (multiRepeater[0].BscJLV)
  }

  // Fallback to land management scheme
  // rTreXu = "What land management scheme does this notice relate to?"
  const landManagementScheme = /** @type {string | undefined} */ (main.rTreXu)
  if (landManagementScheme) {
    return landManagementScheme
  }

  // Requirement is to return the detailed_work_type as a fallback, which is what this value
  // essentially is when landManagementScheme is falsy.
  return 'S28E Consent'
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
  const sssiName = /** @type {string | undefined} */ (main.hozdvW)
  // lmqMaY = "Are you planning to carry out activities on more than one SSSI?"
  const isMultipleSssi = /** @type {boolean | undefined} */ (main.lmqMaY)

  if (!isMultipleSssi && sssiName) {
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
        SSSI_id: /** @type {string} */ (sssiName),
        coordinates:
          coordStrings.length > 0 ? joinCoordinates(coordStrings) : '',
        ornec: ornecNames.join(', ')
      })
    } else if (activityCoordinates) {
      // Scheme path: single coordinate set, no ORNECs
      sssiInfo.push({
        SSSI_id: /** @type {string} */ (sssiName),
        coordinates: formatCoordinates(activityCoordinates),
        ornec: ''
      })
    } else {
      sssiInfo.push({
        SSSI_id: /** @type {string} */ (sssiName),
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
        const entrySssiName =
          /** @type {string | undefined} */ (entry.rWrBOK) ?? 'Unknown'
        if (!sssiData.has(entrySssiName)) {
          sssiData.set(entrySssiName, { coords: [], ornecs: [] })
        }
        const data = sssiData.get(entrySssiName)
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

      for (const [name, data] of sssiData) {
        sssiInfo.push({
          SSSI_id: name,
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
            SSSI_id: /** @type {string} */ (entry.gVlMxz),
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
  // oflKhi = "Single business identifier (SBI)"
  const sbiNumber = /** @type {string | undefined} */ (main.oflKhi)
  // VLUhzR = "Single business identifier (SBI)" (page: "Address details")
  const sbiNumberAddress = /** @type {string | undefined} */ (main.VLUhzR)
  const sbi = sbiNumber ?? sbiNumberAddress

  return {
    form_type: 'consent',
    broad_work_type: 'S28E Consent',
    detailed_work_type: mapDetailedWorkType(main),
    description: mapDescription(main, repeaters),
    consulting_body_type: customerType
      ? (customerTypeMap[customerType] ?? customerType)
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
