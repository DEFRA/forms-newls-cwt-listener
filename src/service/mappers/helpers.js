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
 * Expects format "Euro_site_id---Euro Site Name" (e.g. "UK11004---Arun Valley Ramsar").
 * @param {unknown} value - The raw value from the form submission
 * @returns {string} The European Site ID (e.g. "UK11004")
 * @throws {Error} If the value is empty or does not contain the expected separator
 */
export function parseEuroSiteId(value) {
  const stringValue = String(value)
  const separatorIndex = stringValue.indexOf('---')
  if (separatorIndex === -1) {
    throw new Error(
      `european_site_id value "${stringValue}" does not contain the expected "---" separator`
    )
  }
  return stringValue.substring(0, separatorIndex)
}
