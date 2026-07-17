/**
 * Joi validation schema for mapping files.
 *
 * This guards against structural mistakes when mapping files are edited by
 * hand. Deeper semantic checks (do the question ids exist in the form
 * definition, are all required outputs covered, etc.) are performed by the
 * gap-detection tool (scripts/detect-mapping-gaps.js).
 */

import Joi from 'joi'

import { knownTransformNames } from './transforms.js'
import {
  DEFAULT_DELIVERY_SUCCESS_MODE,
  DELIVERY_SUCCESS_MODE
} from './types.js'

const VALUE_EXPRESSION_TYPES = [
  'literal',
  'meta',
  'answer',
  'output',
  'ref',
  'lookup',
  'firstAnswered',
  'concat',
  'conditional',
  'collect',
  'object',
  'array',
  'arrayFromRepeater',
  'joinSegments',
  'expansionIndex',
  'expansionCount'
]

const questionRefSchema = Joi.object({
  id: Joi.string().required(),
  text: Joi.string()
})

const transformSchema = Joi.alternatives().try(
  Joi.string().valid(...knownTransformNames()),
  Joi.object({
    name: Joi.string()
      .valid(...knownTransformNames())
      .required()
  }).unknown(true)
)

const conditionSchema = Joi.alternatives()
  .try(
    Joi.object({
      ref: Joi.string().required()
    }),
    Joi.object({
      all: Joi.array().items(Joi.link('#condition')).min(1).required()
    }),
    Joi.object({
      any: Joi.array().items(Joi.link('#condition')).min(1).required()
    }),
    Joi.object({
      not: Joi.link('#condition').required()
    }),
    Joi.object({
      question: questionRefSchema.required(),
      operator: Joi.string()
        .valid(
          'equals',
          'notEquals',
          'in',
          'startsWith',
          'isAnswered',
          'isNotAnswered',
          'isTruthy',
          'isFalsy'
        )
        .required(),
      value: Joi.any(),
      values: Joi.array().items(Joi.any())
    }),
    Joi.object({
      repeater: questionRefSchema.required(),
      operator: Joi.string()
        .valid('hasEntries', 'isEmpty', 'hasAnswer')
        .required(),
      questionId: Joi.string(),
      questionText: Joi.string()
    })
  )
  .id('condition')

/**
 * Value expressions are recursive and intentionally validated loosely here:
 * the type must be known and common fields well-formed, while type-specific
 * fields are allowed through. The engine throws precise errors at resolution
 * time and the gap-detection tool performs the deep semantic checks.
 */
const valueExpressionSchema = Joi.object({
  type: Joi.string()
    .valid(...VALUE_EXPRESSION_TYPES)
    .required(),
  transforms: Joi.array().items(transformSchema),
  default: Joi.any()
})
  .unknown(true)
  .id('valueExpression')

const ruleSchema = Joi.object({
  id: Joi.string().required(),
  description: Joi.string(),
  target: Joi.string().required(),
  when: conditionSchema,
  value: valueExpressionSchema.required()
})

/**
 * The expansion is an object rather than a list of rules: a mapping may fan out
 * on at most one repeater, and an object makes a second expansion
 * unrepresentable instead of a runtime check.
 */
const expansionSchema = Joi.object({
  id: Joi.string().required(),
  description: Joi.string(),
  repeater: questionRefSchema.required(),
  filterAnswered: Joi.string(),
  deliverySuccessMode: Joi.string()
    .valid(...Object.values(DELIVERY_SUCCESS_MODE))
    .default(DEFAULT_DELIVERY_SUCCESS_MODE),
  targets: Joi.object()
    .pattern(Joi.string(), valueExpressionSchema)
    .min(1)
    .required()
})

export const mappingDefinitionSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  version: Joi.number().integer().min(1).required(),
  formIds: Joi.array().items(Joi.string()).min(1).required(),
  outputSchema: Joi.string().required(),
  destination: Joi.object({
    type: Joi.string().valid('rest').required(),
    name: Joi.string().required()
  }).required(),
  conditions: Joi.object().pattern(Joi.string(), conditionSchema),
  definitions: Joi.object().pattern(Joi.string(), valueExpressionSchema),
  rules: Joi.array().items(ruleSchema).min(1).required(),
  expand: expansionSchema
}).shared(conditionSchema)

/**
 * Validates a parsed mapping file, throwing a descriptive error on failure.
 * @param {unknown} mapping - The parsed mapping file content
 * @param {string} sourceName - Identifier (e.g. file name) used in error messages
 * @returns {import('./types.js').MappingDefinition}
 */
export function validateMappingDefinition(mapping, sourceName) {
  const validationResult =
    /** @type {{ error?: Error, value: import('./types.js').MappingDefinition }} */ (
      mappingDefinitionSchema.validate(mapping, { abortEarly: false })
    )
  if (validationResult.error) {
    throw new Error(
      `Mapping file "${sourceName}" is invalid: ${validationResult.error.message}`,
      { cause: validationResult.error }
    )
  }
  return validationResult.value
}
