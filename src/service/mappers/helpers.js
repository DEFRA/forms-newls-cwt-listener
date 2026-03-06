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
