/**
 * Type definitions for the rule-based mapping engine.
 *
 * A mapping file is a JSON document that declares how a form submission is
 * transformed into an output payload. The engine in this directory
 * interprets these documents at runtime; nothing about a specific form is
 * hardcoded.
 */

/**
 * A reference to a question (component) in the form definition.
 * @typedef {object} QuestionRef
 * @property {string} id - The component name in the form definition (e.g. "rTreXu")
 * @property {string} [text] - Human-readable question text. This is a documentation
 *   placeholder to keep mapping files readable; the engine ignores it, but the
 *   gap-detection tool checks it against the form definition for drift.
 */

/**
 * A reference to a repeater (a RepeatPageController page) in the form definition.
 * Use the id "*" to refer to entries of all repeaters combined.
 * @typedef {object} RepeaterRef
 * @property {string} id - The repeater name in the form definition (e.g. "QxIzSB"), or "*" for all repeaters
 * @property {string} [text] - Human-readable repeater title (documentation placeholder)
 */

/**
 * Operators usable in a {@link QuestionCondition}.
 * @typedef {'equals' | 'notEquals' | 'in' | 'startsWith' | 'isAnswered' | 'isNotAnswered' | 'isTruthy' | 'isFalsy'} QuestionOperator
 */

/**
 * Operators usable in a {@link RepeaterCondition}.
 * @typedef {'hasEntries' | 'isEmpty' | 'hasAnswer'} RepeaterOperator
 */

/**
 * A condition on a single question answer.
 * @typedef {object} QuestionCondition
 * @property {QuestionRef} question - The question whose answer is tested
 * @property {QuestionOperator} operator - The comparison operator
 * @property {unknown} [value] - Comparison value (for equals/notEquals/startsWith)
 * @property {unknown[]} [values] - Comparison values (for the "in" operator)
 */

/**
 * A condition on a repeater's entries.
 * @typedef {object} RepeaterCondition
 * @property {RepeaterRef} repeater - The repeater whose entries are tested
 * @property {RepeaterOperator} operator - The test to perform
 * @property {string} [questionId] - For "hasAnswer": at least one entry must have a
 *   non-empty answer for this question id
 * @property {string} [questionText] - Documentation placeholder for questionId
 */

/**
 * Combines conditions with boolean logic, or references a named condition
 * declared in the mapping file's "conditions" section.
 * @typedef {object} ConditionGroup
 * @property {Condition[]} [all] - True when every nested condition is true
 * @property {Condition[]} [any] - True when at least one nested condition is true
 * @property {Condition} [not] - True when the nested condition is false
 * @property {string} [ref] - Name of a condition declared in the mapping file's "conditions" map
 */

/**
 * Any condition node.
 * @typedef {QuestionCondition | RepeaterCondition | ConditionGroup} Condition
 */

/**
 * A transform applied to a resolved value. Scalar transforms are applied
 * element-wise when the value is an array.
 * @typedef {string | { name: string, [option: string]: unknown }} Transform
 */

/**
 * Common properties shared by every value expression.
 * @typedef {object} ValueExpressionBase
 * @property {string} type - Discriminator for the expression kind
 * @property {Transform[]} [transforms] - Transform pipeline applied to the resolved value
 * @property {unknown} [default] - Value used when the expression resolves to empty
 *   (undefined, null, empty string or empty array). Defaults are used as-is and are
 *   not passed through the transform pipeline.
 */

/**
 * A value expression. The "type" property selects the resolver:
 * - "literal": a constant value ("value")
 * - "meta": a value from the submission metadata ("path", e.g. "referenceNumber")
 * - "answer": a question answer ("question", optional "scope": "main" | "item")
 * - "output": a previously computed output target value ("target"); only valid
 *   during rule evaluation, not inside "expand.targets"
 * - "ref": a named value declared in the mapping file's "definitions" map ("name")
 * - "lookup": maps an input value through a table ("input", "table",
 *   optional "match": "exact" | "startsWith", "passthrough", "required")
 * - "firstAnswered": the first non-empty value of "values"
 * - "concat": joins "parts" with "separator"; array parts are flattened;
 *   optional "skipEmpty"
 * - "conditional": "cases" of { when, value } evaluated in order, optional "else"
 *   expression when no case matches
 * - "collect": gathers one answer across repeater entries ("repeater", "question",
 *   optional "unique", "join")
 * - "object": an object built from "properties" (a map of target -> expression)
 * - "array": a fixed-length array built from "items" (a list of expressions)
 * - "arrayFromRepeater": one output item per repeater entry (or per group when
 *   "groupBy" is set), built from "item" property expressions; entries missing an
 *   answer for "filterAnswered" are skipped
 * - "joinSegments": joins resolved "segments" with "separator", optionally
 *   constrained to "maxLength" with overflow handling, with "fallback" when all
 *   segments are empty
 * @typedef {ValueExpressionBase & Record<string, unknown>} ValueExpression
 */

/**
 * A segment of a "joinSegments" expression.
 * @typedef {object} Segment
 * @property {ValueExpression} value - The segment value (string or array of names)
 * @property {'fitNames'} [overflow] - When set to "fitNames" and the expression
 *   resolves to an array, the names are fitted into the remaining space using the
 *   "(+N more)" convention
 */

/**
 * A property expression inside an "arrayFromRepeater" item. In grouped mode the
 * optional "aggregate" controls how values from multiple entries in the same
 * group combine ("first" or { "join": separator }).
 * @typedef {ValueExpression & { aggregate?: 'first' | { join: string } }} ItemValueExpression
 */

/**
 * A single mapping rule. Rules are evaluated in file order. For each output
 * target the first rule whose "when" condition passes (or that has no
 * condition) and whose value resolves to a defined value wins; later rules for
 * the same target are ignored.
 * @typedef {object} MappingRule
 * @property {string} id - Unique rule identifier within the mapping file
 * @property {string} [description] - Human-readable explanation of the rule
 * @property {string} target - The output property the rule produces
 * @property {Condition} [when] - Optional condition guarding the rule
 * @property {ValueExpression} value - The value produced when the rule applies
 */

/**
 * Where the mapped payload is sent.
 * @typedef {object} Destination
 * @property {'rest'} type - The destination kind (only "rest" is currently supported)
 * @property {string} name - Selects the destination's settings - address,
 *   credential, handler and retry policy - from the service config's
 *   "destinations" block (e.g. "universityApi")
 */

/**
 * A complete mapping file.
 * @typedef {object} MappingDefinition
 * @property {string} id - Unique mapping identifier
 * @property {string} name - Human-readable mapping name
 * @property {number} version - Mapping file format version
 * @property {string[]} formIds - The form ids this mapping applies to
 * @property {string} outputSchema - Relative path (from the mapping file) to the
 *   output schema document describing the required/optional output structure
 * @property {Destination} destination - Where the mapped payload is sent
 * @property {Record<string, Condition>} [conditions] - Named conditions referencable
 *   with { "ref": name } inside rule conditions
 * @property {Record<string, ValueExpression>} [definitions] - Named value expressions
 *   referencable with { "type": "ref", "name": name } inside rule values
 * @property {MappingRule[]} rules - The mapping rules, evaluated in order
 * @property {Expansion} [expand] - Fans the mapped payload out into one submission
 *   per repeater entry. At most one per mapping
 */

/**
 * How many of an expanded submission's payloads must reach the destination for
 * the source message to count as handled (and so be deleted from the queue).
 *
 * "all": every payload must succeed. A failure leaves the message on the queue,
 * so redelivery re-sends the whole set - payloads that already landed are
 * duplicated in the destination system.
 *
 * "any": one payload succeeding is enough. Nothing is duplicated, but the
 * payloads that failed are lost - the message is deleted and nothing retries
 * them.
 * @typedef {'all' | 'any'} DeliverySuccessMode
 */

/**
 * The delivery success modes, keyed by name.
 * @type {Readonly<Record<'ALL' | 'ANY', DeliverySuccessMode>>}
 */
export const DELIVERY_SUCCESS_MODE = Object.freeze({
  ALL: 'all',
  ANY: 'any'
})

/**
 * The mode applied to an expansion that does not name one.
 * @type {DeliverySuccessMode}
 */
export const DEFAULT_DELIVERY_SUCCESS_MODE = DELIVERY_SUCCESS_MODE.ALL

/**
 * Fans a single mapped payload out into one submission per repeater entry.
 *
 * The base payload is produced by the rules as normal; each repeater entry then
 * contributes an overlay of `targets` that is merged over it. The target value
 * expressions are evaluated once per entry, with that entry in scope as the
 * current item, so "answer" expressions read the entry's answers first.
 *
 * When the repeater has no entries the base payload is sent unchanged, which is
 * what the targets' ordinary fallback rules exist for.
 * @typedef {object} Expansion
 * @property {string} id - Identifier for the expansion, used in error messages
 * @property {string} [description] - Human-readable description
 * @property {RepeaterRef} repeater - The repeater to expand over
 * @property {QuestionRef} [filterAnswered] - Question that must be answered for an
 *   entry to produce a payload; blank entries are skipped
 * @property {DeliverySuccessMode} [deliverySuccessMode] - Defaults to "all"
 * @property {Record<string, ValueExpression>} targets - Output targets to overlay
 *   on the base payload, evaluated once per entry
 */

/**
 * A property in an output schema document.
 * @typedef {object} OutputSchemaProperty
 * @property {string} type - "string" | "number" | "array" | "object"
 * @property {boolean} required - Whether the output payload must contain this property
 * @property {string} [description] - Human-readable description
 * @property {unknown} [const] - Fixed expected value, when the property is constant
 * @property {OutputSchema} [items] - For arrays: the schema of each item
 * @property {Record<string, OutputSchemaProperty>} [properties] - For objects: nested properties
 */

/**
 * An output schema document: declares the structure the mapping must produce.
 * @typedef {object} OutputSchema
 * @property {string} [id] - Schema identifier
 * @property {string} [description] - Human-readable description
 * @property {Record<string, OutputSchemaProperty>} properties - The output properties
 */

/**
 * The context threaded through condition evaluation and value resolution.
 * @typedef {object} MappingContext
 * @property {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessage} message - The submission message
 * @property {Record<string, unknown>} main - The main answers (questionId -> answer)
 * @property {Record<string, Array<Record<string, unknown>>>} repeaters - Repeater answers (repeaterId -> entries)
 * @property {MappingDefinition} mapping - The mapping definition being executed
 * @property {Record<string, unknown>} output - Output values computed so far (for "output" expressions)
 * @property {Record<string, unknown>} [item] - The current repeater entry (inside "arrayFromRepeater")
 * @property {number} [itemIndex] - 1-based position of the current entry (inside an expansion)
 * @property {number} [itemCount] - Total entries being expanded (inside an expansion)
 */
