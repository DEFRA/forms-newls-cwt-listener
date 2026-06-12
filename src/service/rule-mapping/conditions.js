/**
 * Condition evaluation for the rule-based mapping engine.
 *
 * Conditions guard mapping rules ("when") and "conditional" value expressions.
 * See types.js for the full condition shape reference.
 */

import { isEmpty } from './is-empty.js'

/**
 * @typedef {import('./types.js').Condition} Condition
 * @typedef {import('./types.js').QuestionCondition} QuestionCondition
 * @typedef {import('./types.js').RepeaterCondition} RepeaterCondition
 * @typedef {import('./types.js').ConditionGroup} ConditionGroup
 * @typedef {import('./types.js').MappingContext} MappingContext
 */

/**
 * Reads the answer a question condition refers to. Inside an
 * "arrayFromRepeater" item the current entry is checked first, falling back
 * to the main answers.
 * @param {QuestionCondition} condition
 * @param {MappingContext} context
 * @returns {unknown}
 */
function readAnswer(condition, context) {
  const questionId = condition.question.id
  if (context.item && questionId in context.item) {
    return context.item[questionId]
  }
  return context.main[questionId]
}

/**
 * Evaluates a question condition.
 * @param {QuestionCondition} condition
 * @param {MappingContext} context
 * @returns {boolean}
 */
function evaluateQuestionCondition(condition, context) {
  const answer = readAnswer(condition, context)

  switch (condition.operator) {
    case 'equals':
      return answer === condition.value
    case 'notEquals':
      return answer !== condition.value
    case 'in':
      return (condition.values ?? []).includes(answer)
    case 'startsWith':
      return (
        typeof answer === 'string' && answer.startsWith(String(condition.value))
      )
    case 'isAnswered':
      return !isEmpty(answer)
    case 'isNotAnswered':
      return isEmpty(answer)
    case 'isTruthy':
      return Boolean(answer)
    case 'isFalsy':
      return !answer
    default:
      throw new Error(
        `Unknown question condition operator "${String(condition.operator)}"`
      )
  }
}

/**
 * Collects the repeater entries a repeater condition refers to. The id "*"
 * means the combined entries of every repeater.
 * @param {RepeaterCondition} condition
 * @param {MappingContext} context
 * @returns {Array<Record<string, unknown>>}
 */
function readEntries(condition, context) {
  if (condition.repeater.id === '*') {
    return Object.values(context.repeaters).flat()
  }
  return context.repeaters[condition.repeater.id] ?? []
}

/**
 * Evaluates a repeater condition.
 * @param {RepeaterCondition} condition
 * @param {MappingContext} context
 * @returns {boolean}
 */
function evaluateRepeaterCondition(condition, context) {
  const entries = readEntries(condition, context)

  switch (condition.operator) {
    case 'hasEntries':
      return entries.length > 0
    case 'isEmpty':
      return entries.length === 0
    case 'hasAnswer': {
      const questionId = condition.questionId
      if (!questionId) {
        throw new Error(
          'Repeater condition operator "hasAnswer" requires a questionId'
        )
      }
      return entries.some((entry) => !isEmpty(entry[questionId]))
    }
    default:
      throw new Error(
        `Unknown repeater condition operator "${String(condition.operator)}"`
      )
  }
}

/**
 * Evaluates any condition node against the mapping context.
 * @param {Condition} condition
 * @param {MappingContext} context
 * @returns {boolean}
 */
export function evaluateCondition(condition, context) {
  const group = /** @type {ConditionGroup} */ (condition)

  if (group.ref) {
    const named = context.mapping.conditions?.[group.ref]
    if (!named) {
      throw new Error(`Unknown named condition "${group.ref}"`)
    }
    return evaluateCondition(named, context)
  }
  if (group.all) {
    return group.all.every((nested) => evaluateCondition(nested, context))
  }
  if (group.any) {
    return group.any.some((nested) => evaluateCondition(nested, context))
  }
  if (group.not) {
    return !evaluateCondition(group.not, context)
  }

  if ('question' in condition) {
    return evaluateQuestionCondition(
      /** @type {QuestionCondition} */ (condition),
      context
    )
  }
  if ('repeater' in condition) {
    return evaluateRepeaterCondition(
      /** @type {RepeaterCondition} */ (condition),
      context
    )
  }

  throw new Error(`Unrecognised condition: ${JSON.stringify(condition)}`)
}
