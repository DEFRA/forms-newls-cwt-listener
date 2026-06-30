/**
 * Value-expression resolution for the rule-based mapping engine.
 *
 * Every rule (and every nested part of a rule) resolves a value expression.
 * See types.js for the full expression shape reference.
 *
 * Resolution semantics:
 * - An expression first resolves its raw value.
 * - If the raw value is empty (undefined, null, "" or []) and the expression
 *   declares a "default", the default is returned as-is (untransformed).
 * - Otherwise the "transforms" pipeline is applied to the raw value.
 * - A rule whose value resolves to undefined does not apply, allowing later
 *   rules for the same target to be tried.
 */

import { evaluateCondition } from './conditions.js'
import { isEmpty } from './is-empty.js'
import { applyTransforms } from './transforms.js'
import { fitNames } from './helpers.js'

/**
 * @typedef {import('./types.js').ValueExpression} ValueExpression
 * @typedef {import('./types.js').ItemValueExpression} ItemValueExpression
 * @typedef {import('./types.js').Segment} Segment
 * @typedef {import('./types.js').QuestionRef} QuestionRef
 * @typedef {import('./types.js').RepeaterRef} RepeaterRef
 * @typedef {import('./types.js').Condition} Condition
 * @typedef {import('./types.js').MappingContext} MappingContext
 */

/**
 * Reads a question answer, looking at the current repeater entry first (when
 * inside an "arrayFromRepeater" item) and falling back to the main answers.
 * An explicit scope of "main" or "item" restricts the read to one source.
 * @param {QuestionRef} question
 * @param {MappingContext} context
 * @param {'main' | 'item' | undefined} scope
 * @returns {unknown}
 */
function readAnswer(question, context, scope) {
  if (scope === 'main') {
    return context.main[question.id]
  }
  if (scope === 'item') {
    return context.item?.[question.id]
  }
  if (context.item && question.id in context.item) {
    return context.item[question.id]
  }
  return context.main[question.id]
}

/**
 * Reads the entries of a repeater. The id "*" means the combined entries of
 * every repeater in the submission.
 * @param {RepeaterRef} repeater
 * @param {MappingContext} context
 * @returns {Array<Record<string, unknown>>}
 */
function readEntries(repeater, context) {
  if (repeater.id === '*') {
    return Object.values(context.repeaters).flat()
  }
  return context.repeaters[repeater.id] ?? []
}

/**
 * Converts a resolved segment value to a display string. Arrays are joined
 * with ", ".
 * @param {unknown} value
 * @returns {string}
 */
function stringifySegment(value) {
  return Array.isArray(value) ? value.join(', ') : String(value)
}

/**
 * Resolves a "meta" expression: a dot-path read relative to message.meta.
 * @param {ValueExpression} expression
 * @param {MappingContext} context
 * @returns {unknown}
 */
function resolveMeta(expression, context) {
  const path = /** @type {string} */ (expression.path)
  /** @type {unknown} */
  let value = context.message.meta
  for (const key of path.split('.')) {
    if (value === undefined || value === null) {
      return undefined
    }
    value = /** @type {Record<string, unknown>} */ (value)[key]
  }
  return value
}

/**
 * Resolves a "lookup" expression: maps an input value through a table.
 * @param {ValueExpression} expression
 * @param {MappingContext} context
 * @returns {unknown}
 */
function resolveLookup(expression, context) {
  const input = resolveValue(
    /** @type {ValueExpression} */ (expression.input),
    context
  )
  if (isEmpty(input)) {
    return undefined
  }

  const table = /** @type {Record<string, unknown>} */ (expression.table)
  const inputString = String(input)

  if (expression.match === 'startsWith') {
    for (const [key, mapped] of Object.entries(table)) {
      if (inputString.startsWith(key)) {
        return mapped
      }
    }
  } else if (inputString in table) {
    return table[inputString]
  }

  if (expression.passthrough) {
    return input
  }
  if (expression.required) {
    throw new Error(
      `Lookup has no mapping for value "${inputString}" and is marked as required`
    )
  }
  return undefined
}

/**
 * Resolves a "firstAnswered" expression: the first non-empty nested value.
 * @param {ValueExpression} expression
 * @param {MappingContext} context
 * @returns {unknown}
 */
function resolveFirstAnswered(expression, context) {
  const values = /** @type {ValueExpression[]} */ (expression.values)
  for (const nested of values) {
    const resolved = resolveValue(nested, context)
    if (!isEmpty(resolved)) {
      return resolved
    }
  }
  return undefined
}

/**
 * Resolves a "concat" expression: joins parts with a separator. Parts that
 * resolve to arrays are flattened into the part list.
 * @param {ValueExpression} expression
 * @param {MappingContext} context
 * @returns {string}
 */
function resolveConcat(expression, context) {
  const parts = /** @type {ValueExpression[]} */ (expression.parts)
  const separator = /** @type {string} */ (expression.separator ?? '')
  const skipEmpty = expression.skipEmpty !== false

  /** @type {unknown[]} */
  const resolvedParts = []
  for (const part of parts) {
    const resolved = resolveValue(part, context)
    if (Array.isArray(resolved)) {
      const resolvedArray = /** @type {unknown[]} */ (resolved)
      resolvedParts.push(...resolvedArray)
    } else {
      resolvedParts.push(resolved)
    }
  }

  const kept = skipEmpty
    ? resolvedParts.filter((part) => !isEmpty(part))
    : resolvedParts
  return kept.map((part) => String(part ?? '')).join(separator)
}

/**
 * Resolves a "conditional" expression: the first case whose "when" condition
 * passes, otherwise the optional "else" expression.
 * @param {ValueExpression} expression
 * @param {MappingContext} context
 * @returns {unknown}
 */
function resolveConditional(expression, context) {
  const cases =
    /** @type {Array<{ when: Condition, value: ValueExpression }>} */ (
      expression.cases
    )
  for (const conditionalCase of cases) {
    if (evaluateCondition(conditionalCase.when, context)) {
      return resolveValue(conditionalCase.value, context)
    }
  }
  if (expression.else) {
    return resolveValue(
      /** @type {ValueExpression} */ (expression.else),
      context
    )
  }
  return undefined
}

/**
 * Resolves a "collect" expression: gathers one question's answers across
 * repeater entries, skipping empty answers, optionally de-duplicating.
 * @param {ValueExpression} expression
 * @param {MappingContext} context
 * @returns {unknown[]}
 */
function resolveCollect(expression, context) {
  const repeater = /** @type {RepeaterRef} */ (expression.repeater)
  const question = /** @type {QuestionRef} */ (expression.question)
  const entries = readEntries(repeater, context)

  let answers = entries
    .map((entry) => entry[question.id])
    .filter((answer) => !isEmpty(answer))

  if (expression.unique) {
    answers = [...new Set(answers)]
  }
  return answers
}

/**
 * Resolves an "object" expression: builds an object from property
 * expressions. Properties that resolve to undefined are omitted.
 * @param {ValueExpression} expression
 * @param {MappingContext} context
 * @returns {Record<string, unknown>}
 */
function resolveObject(expression, context) {
  const properties = /** @type {Record<string, ValueExpression>} */ (
    expression.properties
  )
  /** @type {Record<string, unknown>} */
  const result = {}
  for (const [name, propertyExpression] of Object.entries(properties)) {
    const resolved = resolveValue(propertyExpression, context)
    if (resolved !== undefined) {
      result[name] = resolved
    }
  }
  return result
}

/**
 * Resolves an item property across a group of repeater entries, combining the
 * per-entry values according to the property's "aggregate" setting.
 * @param {ItemValueExpression} propertyExpression
 * @param {Array<Record<string, unknown>>} groupEntries
 * @param {MappingContext} context
 * @returns {unknown}
 */
function resolveAggregatedProperty(propertyExpression, groupEntries, context) {
  const aggregate = propertyExpression.aggregate ?? 'first'

  if (aggregate === 'first') {
    return resolveValue(propertyExpression, {
      ...context,
      item: groupEntries[0]
    })
  }

  const separator = aggregate.join
  const values = groupEntries
    .map((entry) =>
      resolveValue(propertyExpression, { ...context, item: entry })
    )
    .filter((value) => !isEmpty(value))
  const joined = values.map(String).join(separator)

  if (joined === '' && propertyExpression.default !== undefined) {
    return propertyExpression.default
  }
  return joined
}

/**
 * Resolves an "arrayFromRepeater" expression: builds one output item per
 * repeater entry, or per group of entries when "groupBy" is set.
 * @param {ValueExpression} expression
 * @param {MappingContext} context
 * @returns {Array<Record<string, unknown>>}
 */
function resolveArrayFromRepeater(expression, context) {
  const repeater = /** @type {RepeaterRef} */ (expression.repeater)
  const itemProperties = /** @type {Record<string, ItemValueExpression>} */ (
    expression.item
  )
  const filterAnswered = /** @type {string | undefined} */ (
    expression.filterAnswered
  )
  const groupBy = /** @type {QuestionRef | undefined} */ (expression.groupBy)

  let entries = readEntries(repeater, context)
  if (filterAnswered) {
    entries = entries.filter((entry) => !isEmpty(entry[filterAnswered]))
  }

  /** @type {Array<Record<string, unknown>>} */
  const items = []

  if (groupBy) {
    /** @type {Map<unknown, Array<Record<string, unknown>>>} */
    const groups = new Map()
    for (const entry of entries) {
      const key = entry[groupBy.id]
      const group = groups.get(key)
      if (group) {
        group.push(entry)
      } else {
        groups.set(key, [entry])
      }
    }

    for (const groupEntries of groups.values()) {
      /** @type {Record<string, unknown>} */
      const item = {}
      for (const [name, propertyExpression] of Object.entries(itemProperties)) {
        const resolved = resolveAggregatedProperty(
          propertyExpression,
          groupEntries,
          context
        )
        if (resolved !== undefined) {
          item[name] = resolved
        }
      }
      items.push(item)
    }
    return items
  }

  for (const entry of entries) {
    /** @type {Record<string, unknown>} */
    const item = {}
    for (const [name, propertyExpression] of Object.entries(itemProperties)) {
      const resolved = resolveValue(propertyExpression, {
        ...context,
        item: entry
      })
      if (resolved !== undefined) {
        item[name] = resolved
      }
    }
    items.push(item)
  }
  return items
}

/**
 * Resolves a "joinSegments" expression: joins non-empty segments with a
 * separator. With "maxLength" set, segments marked overflow "fitNames" are
 * fitted into the remaining space using the "(+N more)" convention, and the
 * final result is truncated with "..." if it still exceeds the limit.
 * @param {ValueExpression} expression
 * @param {MappingContext} context
 * @returns {string}
 */
function resolveJoinSegments(expression, context) {
  const separator = /** @type {string} */ (expression.separator ?? ' - ')
  const maxLength = /** @type {number | undefined} */ (expression.maxLength)
  const segments = /** @type {Segment[]} */ (expression.segments)

  const resolvedSegments = segments
    .map((segment) => ({
      value: resolveValue(segment.value, context),
      overflow: segment.overflow
    }))
    .filter((segment) => !isEmpty(segment.value))

  if (resolvedSegments.length === 0) {
    const fallback = expression.fallback
    if (fallback === undefined) {
      return ''
    }
    if (typeof fallback === 'object' && fallback !== null) {
      return String(
        resolveValue(/** @type {ValueExpression} */ (fallback), context) ?? ''
      )
    }
    return String(fallback)
  }

  if (maxLength === undefined) {
    return resolvedSegments
      .map((segment) => stringifySegment(segment.value))
      .join(separator)
  }

  /** @type {string[]} */
  const parts = []
  for (const segment of resolvedSegments) {
    if (segment.overflow === 'fitNames') {
      const names = Array.isArray(segment.value)
        ? segment.value.map(String)
        : [String(segment.value)]
      const used =
        parts.join(separator).length + (parts.length > 0 ? separator.length : 0)
      const fitted = fitNames(names, maxLength - used)
      if (fitted) {
        parts.push(fitted)
      }
    } else {
      parts.push(stringifySegment(segment.value))
    }
  }

  const joined = parts.join(separator)
  if (joined.length <= maxLength) {
    return joined
  }
  return joined.substring(0, maxLength - 3) + '...'
}

/**
 * Resolves any value expression against the mapping context.
 * @param {ValueExpression} expression
 * @param {MappingContext} context
 * @returns {unknown}
 */
export function resolveValue(expression, context) {
  /** @type {unknown} */
  let raw

  switch (expression.type) {
    case 'literal':
      raw = expression.value
      break
    case 'meta':
      raw = resolveMeta(expression, context)
      break
    case 'answer':
      raw = readAnswer(
        /** @type {QuestionRef} */ (expression.question),
        context,
        /** @type {'main' | 'item' | undefined} */ (expression.scope)
      )
      break
    case 'output': {
      const target = /** @type {string} */ (expression.target)
      if (!Object.hasOwn(context.output, target)) {
        throw new Error(
          `Output target "${target}" has not been computed yet - ` +
            'rules referencing other outputs must come after the rules that produce them'
        )
      }
      raw = context.output[target]
      break
    }
    case 'ref': {
      const name = /** @type {string} */ (expression.name)
      const definition = context.mapping.definitions?.[name]
      if (!definition) {
        throw new Error(`Unknown value definition "${name}"`)
      }
      raw = resolveValue(definition, context)
      break
    }
    case 'lookup':
      raw = resolveLookup(expression, context)
      break
    case 'firstAnswered':
      raw = resolveFirstAnswered(expression, context)
      break
    case 'concat':
      raw = resolveConcat(expression, context)
      break
    case 'conditional':
      raw = resolveConditional(expression, context)
      break
    case 'collect':
      raw = resolveCollect(expression, context)
      break
    case 'object':
      raw = resolveObject(expression, context)
      break
    case 'array':
      raw = /** @type {ValueExpression[]} */ (expression.items).map((item) =>
        resolveValue(item, context)
      )
      break
    case 'arrayFromRepeater':
      raw = resolveArrayFromRepeater(expression, context)
      break
    case 'joinSegments':
      raw = resolveJoinSegments(expression, context)
      break
    default:
      throw new Error(`Unknown value expression type "${expression.type}"`)
  }

  if (isEmpty(raw)) {
    return expression.default !== undefined ? expression.default : raw
  }
  return applyTransforms(raw, expression.transforms)
}
