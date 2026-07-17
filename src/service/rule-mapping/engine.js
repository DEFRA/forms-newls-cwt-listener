/**
 * The rule-based mapping engine.
 *
 * Takes a mapping definition (parsed from a JSON mapping file) and a form
 * submission message, and produces the output payload by evaluating the
 * mapping rules in order.
 */

import { evaluateCondition } from './conditions.js'
import { isEmpty } from './is-empty.js'
import { readEntries, resolveValue } from './values.js'

/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('./types.js').MappingDefinition} MappingDefinition
 * @typedef {import('./types.js').MappingContext} MappingContext
 */

/**
 * Builds the context threaded through condition evaluation and value
 * resolution.
 * @param {MappingDefinition} mapping - The mapping definition
 * @param {FormAdapterSubmissionMessage} message - The form submission message
 * @returns {MappingContext}
 */
function buildContext(mapping, message) {
  if (!message.messageId) {
    throw new Error('Unexpected missing message.messageId')
  }

  return {
    message,
    main: /** @type {Record<string, unknown>} */ (message.data.main ?? {}),
    repeaters: /** @type {Record<string, Array<Record<string, unknown>>>} */ (
      message.data.repeaters ?? {}
    ),
    mapping,
    output: {}
  }
}

/**
 * Maps a form submission to an output payload using a mapping definition.
 *
 * Rules are evaluated in file order. For each output target the first rule
 * whose "when" condition passes (or that has no condition) and whose value
 * resolves to a defined value wins; later rules for the same target are
 * skipped. Targets whose rules all fall through are omitted from the payload.
 *
 * This is always a single payload. Mappings that fan out into several
 * submissions layer "resolveExpansion" on top of this base payload.
 * @param {MappingDefinition} mapping - The mapping definition
 * @param {FormAdapterSubmissionMessage} message - The form submission message
 * @returns {Record<string, unknown>} The mapped output payload
 */
export function mapWithRules(mapping, message) {
  const context = buildContext(mapping, message)

  for (const rule of mapping.rules) {
    if (Object.hasOwn(context.output, rule.target)) {
      continue
    }

    try {
      if (rule.when && !evaluateCondition(rule.when, context)) {
        continue
      }
      const value = resolveValue(rule.value, context)
      if (value !== undefined) {
        context.output[rule.target] = value
      }
    } catch (error) {
      throw new Error(
        `Mapping "${mapping.id}" rule "${rule.id}" failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error }
      )
    }
  }

  return context.output
}

/**
 * Resolves a mapping's "expand" block into one overlay per repeater entry.
 *
 * Each overlay is merged over the base payload to produce one submission. An
 * empty array means no fan-out: either the mapping declares no expansion, or
 * the repeater held no usable entries, in which case the base payload stands on
 * its own.
 * @param {MappingDefinition} mapping - The mapping definition
 * @param {FormAdapterSubmissionMessage} message - The form submission message
 * @returns {Array<Record<string, unknown>>} One overlay per expanded submission
 */
export function resolveExpansion(mapping, message) {
  const expansion = mapping.expand
  if (!expansion) {
    return []
  }

  const context = buildContext(mapping, message)
  const { filterAnswered } = expansion

  let entries = readEntries(expansion.repeater, context)
  if (filterAnswered) {
    entries = entries.filter((entry) => !isEmpty(entry[filterAnswered]))
  }

  return entries.map((entry, index) => {
    /** @type {MappingContext} */
    const entryContext = {
      ...context,
      item: entry,
      itemIndex: index + 1,
      itemCount: entries.length
    }

    /** @type {Record<string, unknown>} */
    const overlay = {}

    for (const [target, expression] of Object.entries(expansion.targets)) {
      try {
        const value = resolveValue(expression, entryContext)
        if (value !== undefined) {
          overlay[target] = value
        }
      } catch (error) {
        throw new Error(
          `Mapping "${mapping.id}" expansion "${expansion.id}" target "${target}" failed for entry ${index + 1}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { cause: error }
        )
      }
    }

    return overlay
  })
}
