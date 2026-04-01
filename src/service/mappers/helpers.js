/**
 * Formats an easting/northing object into a coordinate string.
 * @param {{ easting: number, northing: number }} coords
 * @returns {string} Format "<easting>,<northing>"
 */
export function formatCoordinates(coords) {
  return `${coords.easting},${coords.northing}`
}

/**
 * Joins multiple coordinate strings with semicolons.
 * @param {string[]} coordStrings
 * @returns {string} Format "<e1>,<n1>;<e2>,<n2>"
 */
export function joinCoordinates(coordStrings) {
  return coordStrings.join(';')
}

/**
 * Parses an SSSI ID value from a form submission string into a number.
 * @param {unknown} value - The raw value from the form submission
 * @returns {number} The parsed integer SSSI ID
 * @throws {Error} If the value is non-empty but cannot be parsed into an integer
 */
export function parseSssiId(value) {
  const stringValue = String(value)
  const parsed = parseInt(stringValue, 10)
  if (isNaN(parsed)) {
    throw new Error(
      `SSSI_id value "${stringValue}" cannot be parsed into an integer`
    )
  }
  return parsed
}

/**
 * Parses a European Site ID value from a form submission string.
 * Expects format "Euro_site_id---Euro Site Name" (e.g. "7---Arun Valley Ramsar").
 * Returns the numeric portion as an integer.
 * @param {unknown} value - The raw value from the form submission
 * @returns {number} The European Site ID as a number (e.g. 42)
 * @throws {Error} If the value does not contain the expected separator or cannot be parsed into a number
 */
export function parseEuroSiteId(value) {
  const stringValue = String(value)
  const separatorIndex = stringValue.indexOf('---')
  if (separatorIndex === -1) {
    throw new Error(
      `european_site_id value "${stringValue}" does not contain the expected "---" separator`
    )
  }
  const rawId = stringValue.substring(0, separatorIndex)
  const parsed = parseInt(rawId, 10)
  if (isNaN(parsed)) {
    throw new Error(
      `european_site_id value "${rawId}" cannot be parsed into a number`
    )
  }
  return parsed
}

/**
 * Extracts the display name from a combined "ID---Name" value.
 * Returns the original string if no "---" separator is found.
 * @param {unknown} value - The raw value from the form submission
 * @returns {string} The display name (e.g. "Arun Valley Ramsar" from "11004---Arun Valley Ramsar")
 */
export function parseName(value) {
  const stringValue = String(value)
  const separatorIndex = stringValue.indexOf('---')
  if (separatorIndex === -1) {
    return stringValue
  }
  return stringValue.substring(separatorIndex + 3)
}

/**
 * Maximum length for the email_header field.
 */
export const EMAIL_HEADER_MAX_LENGTH = 255

/**
 * Fits a list of names into the available character length.
 * Joins with ", " and appends "(+N more)" when truncation is needed.
 * @param {string[]} names - The names to fit
 * @param {number} maxLength - Maximum character length available
 * @returns {string}
 */
export function fitNames(names, maxLength) {
  if (names.length === 0) {
    return ''
  }

  const joined = names.join(', ')
  if (joined.length <= maxLength) {
    return joined
  }

  // Progressively drop names from the end
  for (let count = names.length - 1; count >= 1; count--) {
    const partial = names.slice(0, count).join(', ')
    const remaining = names.length - count
    const suffix = ` (+${remaining} more)`
    if (partial.length + suffix.length <= maxLength) {
      return partial + suffix
    }
  }

  // Even one name doesn't fit - truncate the first name
  const remaining = names.length - 1
  const suffix = remaining > 0 ? ` (+${remaining} more)` : ''
  const availableForName = maxLength - suffix.length
  if (availableForName > 3) {
    return names[0].substring(0, availableForName - 3) + '...' + suffix
  }

  return names[0].substring(0, maxLength)
}
