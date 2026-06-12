/**
 * The rule-based mapping engine.
 *
 * Takes a mapping definition (parsed from a JSON mapping file) and a form
 * submission message, and produces the output payload by evaluating the
 * mapping rules in order.
 */

import { evaluateCondition } from './conditions.js'
import { resolveValue } from './values.js'

/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('./types.js').MappingDefinition} MappingDefinition
 * @typedef {import('./types.js').MappingContext} MappingContext
 */

/**
 * Maps a form submission to an output payload using a mapping definition.
 *
 * Rules are evaluated in file order. For each output target the first rule
 * whose "when" condition passes (or that has no condition) and whose value
 * resolves to a defined value wins; later rules for the same target are
 * skipped. Targets whose rules all fall through are omitted from the payload.
 * @param {MappingDefinition} mapping - The mapping definition
 * @param {FormAdapterSubmissionMessage} message - The form submission message
 * @returns {Record<string, unknown>} The mapped output payload
 */
export function mapWithRules(mapping, message) {
  if (!message.messageId) {
    throw new Error('Unexpected missing message.messageId')
  }

  /** @type {MappingContext} */
  const context = {
    message,
    main: /** @type {Record<string, unknown>} */ (message.data.main ?? {}),
    repeaters: /** @type {Record<string, Array<Record<string, unknown>>>} */ (
      message.data.repeaters ?? {}
    ),
    mapping,
    output: {}
  }

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
