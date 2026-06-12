/**
 * Transform pipeline for the rule-based mapping engine.
 *
 * Transforms are referenced by name from mapping files, either as a plain
 * string ("parseName") or as an object with options
 * ({ "name": "truncate", "maxLength": 255 }).
 *
 * The value-parsing primitives are shared with the legacy mappers
 * (src/service/mappers/helpers.js); they are pure functions and will be
 * retained when the legacy mappers are eventually removed.
 */

import {
  fitNames,
  formatCoordinates,
  parseEuroSiteId,
  parseName,
  parseSssiId
} from '../mappers/helpers.js'

/**
 * @typedef {import('./types.js').Transform} Transform
 */

/**
 * Scalar transforms. When the input value is an array these are applied
 * element-wise.
 * @type {Record<string, (value: unknown, options: Record<string, unknown>) => unknown>}
 */
const scalarTransforms = {
  parseName: (value) => parseName(value),
  parseSssiId: (value) => parseSssiId(value),
  parseEuroSiteId: (value) => parseEuroSiteId(value),
  formatCoordinates: (value) =>
    formatCoordinates(
      /** @type {{ easting: number, northing: number }} */ (value)
    ),
  toNumber: (value) => Number(value),
  trim: (value) => String(value).trim(),
  truncate: (value, options) => {
    const maxLength = /** @type {number} */ (options.maxLength)
    const ellipsis = options.ellipsis !== false
    const stringValue = String(value)
    if (stringValue.length <= maxLength) {
      return stringValue
    }
    return ellipsis
      ? stringValue.substring(0, maxLength - 3) + '...'
      : stringValue.substring(0, maxLength)
  }
}

/**
 * Whole-value transforms. These receive the value as-is (typically an array)
 * rather than being applied element-wise.
 * @type {Record<string, (value: unknown, options: Record<string, unknown>) => unknown>}
 */
const arrayTransforms = {
  join: (value, options) => {
    const separator = /** @type {string} */ (options.separator ?? ', ')
    return Array.isArray(value) ? value.join(separator) : String(value)
  },
  fitNames: (value, options) => {
    const maxLength = /** @type {number} */ (options.maxLength)
    const names = Array.isArray(value) ? value.map(String) : [String(value)]
    return fitNames(names, maxLength)
  },
  first: (value) =>
    Array.isArray(value) ? /** @type {unknown[]} */ (value)[0] : value
}

/**
 * Normalises a transform reference into { name, options }.
 * @param {Transform} transform
 * @returns {{ name: string, options: Record<string, unknown> }}
 */
function normaliseTransform(transform) {
  if (typeof transform === 'string') {
    return { name: transform, options: {} }
  }
  const { name, ...options } =
    /** @type {{ name: string } & Record<string, unknown>} */ (transform)
  return { name, options }
}

/**
 * Applies a single transform to a value.
 * @param {unknown} value
 * @param {Transform} transform
 * @returns {unknown}
 */
function applyTransform(value, transform) {
  const { name, options } = normaliseTransform(transform)

  const arrayTransform = arrayTransforms[name]
  if (arrayTransform) {
    return arrayTransform(value, options)
  }

  const scalarTransform = scalarTransforms[name]
  if (!scalarTransform) {
    throw new Error(`Unknown transform "${name}"`)
  }

  if (Array.isArray(value)) {
    return value.map((entry) => scalarTransform(entry, options))
  }
  return scalarTransform(value, options)
}

/**
 * Applies a transform pipeline to a value, in order.
 * @param {unknown} value - The resolved value
 * @param {Transform[] | undefined} transforms - The pipeline from the mapping file
 * @returns {unknown}
 */
export function applyTransforms(value, transforms) {
  if (!transforms || transforms.length === 0) {
    return value
  }
  let result = value
  for (const transform of transforms) {
    result = applyTransform(result, transform)
  }
  return result
}

/**
 * Returns the names of all known transforms (used by mapping validation).
 * @returns {string[]}
 */
export function knownTransformNames() {
  return [...Object.keys(scalarTransforms), ...Object.keys(arrayTransforms)]
}
