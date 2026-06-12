/**
 * Shared emptiness check for the rule-based mapping engine.
 *
 * An answer or resolved value is "empty" (treated as not answered) when it is
 * undefined, null, an empty string, or an empty array. The numbers 0 and
 * boolean false are NOT empty.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isEmpty(value) {
  if (value === undefined || value === null || value === '') {
    return true
  }
  return Array.isArray(value) && value.length === 0
}
