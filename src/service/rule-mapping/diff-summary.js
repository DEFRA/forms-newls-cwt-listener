/**
 * Data-free difference summaries for the comparison store.
 *
 * When the legacy and rules payloads disagree we want to know *where* and
 * *how* they differ so a mapping can be fixed, but we must never emit the
 * submitted data itself (it may contain personal data). These helpers walk
 * both payloads and describe each difference structurally — which property,
 * and the shape of the difference (missing key, differing length, type
 * change, value change) — without ever including a value.
 */

/**
 * @typedef {object} Difference
 * @property {string} path - Dotted/indexed path to the differing property (e.g. "applicant.name", "items[2]")
 * @property {string} description - A data-free description of the difference
 */

/**
 * Normalises a payload the same way the transmitted JSON would be: a JSON
 * round-trip drops `undefined`-valued keys so they compare equal to omitted
 * keys. `undefined` (e.g. a failed rules payload) normalises to `null`.
 * @param {unknown} value
 * @returns {unknown}
 */
function normalise(value) {
  if (value === undefined) {
    return null
  }
  return JSON.parse(JSON.stringify(value))
}

/**
 * The JSON-level type of a value, distinguishing arrays and null from objects.
 * @param {unknown} value
 * @returns {'null' | 'array' | 'object' | 'string' | 'number' | 'boolean' | 'undefined'}
 */
function jsonType(value) {
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return 'array'
  }
  return /** @type {'object' | 'string' | 'number' | 'boolean'} */ (
    typeof value
  )
}

/**
 * Recursively compares two values *at a given path* and appends any
 * differences to `out`. This is the core tree-walker: `describeDifferences`
 * seeds it once with the whole payloads, then `diffArray`/`diffObject` call
 * back into it for every element/property, descending the tree. So `legacy`
 * and `rules` are not the whole payloads except on the first call — they are
 * the legacy-side and rules-side values found at `path`, which is why either
 * can be an array, object, string, number, boolean or null.
 *
 * It compares their JSON types first (a type mismatch is reported and ends
 * the descent), then recurses into arrays/objects or compares primitives.
 *
 * @param {string} path - Location of these values in the payload, e.g.
 *   "applicant.items[2]"; "" at the root (reported as "(root)").
 * @param {unknown} legacy - The legacy-side value at `path`.
 * @param {unknown} rules - The rules-side value at `path`.
 * @param {Difference[]} out - Accumulator the walk pushes differences onto.
 */
function diff(path, legacy, rules, out) {
  const label = path || '(root)'
  const legacyType = jsonType(legacy)
  const rulesType = jsonType(rules)

  if (legacyType !== rulesType) {
    out.push({
      path: label,
      description: `type differs (legacy=${legacyType}, rules=${rulesType})`
    })
    return
  }

  if (legacyType === 'array') {
    diffArray(
      path,
      /** @type {unknown[]} */ (legacy),
      /** @type {unknown[]} */ (rules),
      out
    )
    return
  }

  if (legacyType === 'object') {
    diffObject(
      path,
      /** @type {Record<string, unknown>} */ (legacy),
      /** @type {Record<string, unknown>} */ (rules),
      out
    )
    return
  }

  if (legacyType === 'string') {
    const legacyStr = /** @type {string} */ (legacy)
    const rulesStr = /** @type {string} */ (rules)
    if (legacyStr !== rulesStr) {
      out.push({
        path: label,
        description:
          legacyStr.length === rulesStr.length
            ? 'string values differ (same length)'
            : `string length differs (legacy=${legacyStr.length}, rules=${rulesStr.length})`
      })
    }
    return
  }

  // number, boolean or null (nulls are already equal at this point)
  if (legacy !== rules) {
    out.push({ path: label, description: 'values differ' })
  }
}

/**
 * @param {string} path
 * @param {unknown[]} legacy
 * @param {unknown[]} rules
 * @param {Difference[]} out
 */
function diffArray(path, legacy, rules, out) {
  if (legacy.length !== rules.length) {
    out.push({
      path: path || '(root)',
      description: `array length differs (legacy=${legacy.length}, rules=${rules.length})`
    })
  }

  const longest = Math.max(legacy.length, rules.length)
  for (let index = 0; index < longest; index++) {
    const childPath = `${path}[${index}]`
    if (index >= legacy.length) {
      out.push({
        path: childPath,
        description: 'item present in rules but missing in legacy'
      })
    } else if (index >= rules.length) {
      out.push({
        path: childPath,
        description: 'item present in legacy but missing in rules'
      })
    } else {
      diff(childPath, legacy[index], rules[index], out)
    }
  }
}

/**
 * @param {string} path
 * @param {Record<string, unknown>} legacy
 * @param {Record<string, unknown>} rules
 * @param {Difference[]} out
 */
function diffObject(path, legacy, rules, out) {
  const keys = [
    ...new Set([...Object.keys(legacy), ...Object.keys(rules)])
  ].sort()

  for (const key of keys) {
    const childPath = path ? `${path}.${key}` : key
    const inLegacy = Object.hasOwn(legacy, key)
    const inRules = Object.hasOwn(rules, key)

    if (inLegacy && !inRules) {
      out.push({
        path: childPath,
        description: 'present in legacy but missing in rules'
      })
    } else if (!inLegacy && inRules) {
      out.push({
        path: childPath,
        description: 'present in rules but missing in legacy'
      })
    } else {
      diff(childPath, legacy[key], rules[key], out)
    }
  }
}

/**
 * Describes how the legacy and rules payloads differ, without ever revealing
 * the underlying data. Returns an empty array when the payloads are equal
 * (after JSON normalisation).
 * @param {unknown} legacyPayload
 * @param {unknown} rulesPayload
 * @returns {Difference[]}
 */
export function describeDifferences(legacyPayload, rulesPayload) {
  /** @type {Difference[]} */
  const out = []
  diff('', normalise(legacyPayload), normalise(rulesPayload), out)
  return out
}
