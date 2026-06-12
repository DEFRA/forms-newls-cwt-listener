/**
 * Mapping gap analysis.
 *
 * Cross-checks a mapping file against the form definition it maps and the
 * output schema it must produce, reporting:
 * - question/repeater ids referenced by the mapping that do not exist in the form
 * - question text placeholders that have drifted from the form definition
 * - condition and lookup values that can never match the form's answer options
 * - form answer options that no lookup table entry covers
 * - required output properties that may not be produced (no rules, no
 *   unconditional fallback, or rules that can fall through), including
 *   required properties of array items
 *
 * Used by scripts/detect-mapping-gaps.js.
 */

/**
 * @typedef {import('./types.js').MappingDefinition} MappingDefinition
 * @typedef {import('./types.js').OutputSchema} OutputSchema
 * @typedef {import('./types.js').ValueExpression} ValueExpression
 * @typedef {import('./types.js').Condition} Condition
 */

/**
 * The subset of a form definition document the analysis reads.
 * @typedef {object} FormDefinitionLike
 * @property {string} [name]
 * @property {FormPageLike[]} [pages]
 * @property {FormListLike[]} [lists]
 */

/**
 * @typedef {object} FormPageLike
 * @property {string} [title]
 * @property {string} [path]
 * @property {string} [controller]
 * @property {{ options?: { name?: string, title?: string } }} [repeat]
 * @property {FormComponentLike[]} [components]
 */

/**
 * @typedef {object} FormComponentLike
 * @property {string} [name]
 * @property {string} [title]
 * @property {string} [type]
 * @property {string} [list]
 * @property {{ required?: boolean }} [options]
 */

/**
 * @typedef {object} FormListLike
 * @property {string} [id]
 * @property {string} [name]
 * @property {Array<{ value?: unknown }>} [items]
 */

/**
 * A single finding produced by the analysis.
 * @typedef {object} Finding
 * @property {'error' | 'warning'} severity - Errors indicate the required output cannot be guaranteed; warnings indicate drift or potential gaps
 * @property {string} code - Stable machine-readable finding code
 * @property {string} message - Human-readable explanation
 */

/**
 * Index of a form definition, keyed for fast lookups.
 * @typedef {object} FormIndex
 * @property {Map<string, { title: string, type: string, pagePath: string, repeaterName: string | undefined, required: boolean, listId: string | undefined }>} components
 * @property {Map<string, { title: string, pagePath: string }>} repeaters
 * @property {Map<string, string[]>} listValues - List id/name -> option values
 */

/**
 * Builds an index of components, repeaters and lists from a form definition.
 * @param {FormDefinitionLike} formDefinition - Parsed form definition JSON
 * @returns {FormIndex}
 */
export function buildFormIndex(formDefinition) {
  /** @type {FormIndex} */
  const index = {
    components: new Map(),
    repeaters: new Map(),
    listValues: new Map()
  }

  for (const page of formDefinition.pages ?? []) {
    /** @type {string | undefined} */
    let repeaterName
    if (page.controller === 'RepeatPageController') {
      repeaterName = page.repeat?.options?.name
      if (repeaterName) {
        index.repeaters.set(repeaterName, {
          title: page.repeat?.options?.title ?? page.title ?? '',
          pagePath: page.path ?? ''
        })
      }
    }

    for (const component of page.components ?? []) {
      if (!component.name) {
        continue
      }
      index.components.set(component.name, {
        title: component.title ?? '',
        type: component.type ?? '',
        pagePath: page.path ?? '',
        repeaterName,
        required: component.options?.required !== false,
        listId: component.list
      })
    }
  }

  for (const list of formDefinition.lists ?? []) {
    const values = (list.items ?? []).map((item) => String(item.value))
    if (list.id) {
      index.listValues.set(String(list.id), values)
    }
    if (list.name) {
      index.listValues.set(String(list.name), values)
    }
  }

  return index
}

/**
 * Normalises question text for drift comparison.
 * @param {string} text
 * @returns {string}
 */
function normaliseText(text) {
  return text.replaceAll(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * A reference to a question or repeater collected from the mapping file.
 * @typedef {object} CollectedRef
 * @property {'question' | 'repeater'} kind
 * @property {string} id
 * @property {string | undefined} text
 * @property {string} location - Where in the mapping file the reference appears
 */

/**
 * A lookup usage collected from the mapping file.
 * @typedef {object} CollectedLookup
 * @property {string | undefined} questionId - The question id when the lookup input is a direct answer
 * @property {string[]} keys - The lookup table keys
 * @property {boolean} startsWith - Whether keys are matched as prefixes
 * @property {boolean} passthrough - Whether unmapped values pass through
 * @property {string} location
 */

/**
 * A literal comparison against a question answer collected from conditions.
 * @typedef {object} CollectedComparison
 * @property {string} questionId
 * @property {string[]} values
 * @property {boolean} startsWith
 * @property {string} location
 */

/**
 * Reads a { id, text } reference from a mapping node property.
 * @param {Record<string, unknown>} record
 * @param {string} key
 * @returns {{ id?: string, text?: string } | undefined}
 */
function readRef(record, key) {
  const value = record[key]
  if (value && typeof value === 'object') {
    return /** @type {{ id?: string, text?: string }} */ (value)
  }
  return undefined
}

/**
 * Walks every condition and value expression in a mapping file and collects
 * question/repeater references, lookup usages and condition comparisons.
 * @param {MappingDefinition} mapping
 * @returns {{ refs: CollectedRef[], lookups: CollectedLookup[], comparisons: CollectedComparison[] }}
 */
export function collectMappingReferences(mapping) {
  /** @type {CollectedRef[]} */
  const refs = []
  /** @type {CollectedLookup[]} */
  const lookups = []
  /** @type {CollectedComparison[]} */
  const comparisons = []

  /**
   * @param {unknown} node
   * @param {string} location
   */
  function walk(node, location) {
    if (Array.isArray(node)) {
      node.forEach((entry, index) => walk(entry, `${location}[${index}]`))
      return
    }
    if (node === null || typeof node !== 'object') {
      return
    }

    const record = /** @type {Record<string, unknown>} */ (node)
    const question = readRef(record, 'question')
    const repeater = readRef(record, 'repeater')
    const groupBy = readRef(record, 'groupBy')

    if (question?.id) {
      refs.push({
        kind: 'question',
        id: question.id,
        text: question.text,
        location
      })
    }
    if (repeater?.id) {
      refs.push({
        kind: 'repeater',
        id: repeater.id,
        text: repeater.text,
        location
      })
      if (typeof record.filterAnswered === 'string') {
        refs.push({
          kind: 'question',
          id: record.filterAnswered,
          text: undefined,
          location: `${location}.filterAnswered`
        })
      }
      if (groupBy?.id) {
        refs.push({
          kind: 'question',
          id: groupBy.id,
          text: groupBy.text,
          location: `${location}.groupBy`
        })
      }
      if (typeof record.questionId === 'string') {
        refs.push({
          kind: 'question',
          id: record.questionId,
          text:
            typeof record.questionText === 'string'
              ? record.questionText
              : undefined,
          location: `${location}.questionId`
        })
      }
    }

    if (record.type === 'lookup' && record.table) {
      const input = /** @type {Record<string, unknown> | undefined} */ (
        record.input
      )
      const inputQuestion = input ? readRef(input, 'question') : undefined
      lookups.push({
        questionId: input?.type === 'answer' ? inputQuestion?.id : undefined,
        keys: Object.keys(/** @type {object} */ (record.table)),
        startsWith: record.match === 'startsWith',
        passthrough: record.passthrough === true,
        location
      })
    }

    if (
      question?.id &&
      typeof record.operator === 'string' &&
      ['equals', 'notEquals', 'in', 'startsWith'].includes(record.operator)
    ) {
      const values =
        record.operator === 'in'
          ? /** @type {unknown[]} */ (record.values ?? []).map(String)
          : [String(record.value)]
      comparisons.push({
        questionId: question.id,
        values,
        startsWith: record.operator === 'startsWith',
        location
      })
    }

    for (const [key, value] of Object.entries(record)) {
      if (key === 'table') {
        continue
      }
      walk(value, `${location}.${key}`)
    }
  }

  walk(mapping.conditions ?? {}, 'conditions')
  walk(mapping.definitions ?? {}, 'definitions')
  mapping.rules.forEach((rule) => walk(rule, `rule "${rule.id}"`))

  return { refs, lookups, comparisons }
}

/**
 * Determines whether a value expression is "total": guaranteed to resolve to
 * a defined value regardless of which answers were given. Rules with a total
 * value and no condition always produce their target.
 * @param {ValueExpression} expression
 * @param {MappingDefinition} mapping
 * @returns {boolean}
 */
export function isTotalExpression(expression, mapping) {
  if (expression.default !== undefined) {
    return true
  }

  switch (expression.type) {
    case 'literal':
      return expression.value !== undefined
    case 'concat':
    case 'object':
    case 'array':
    case 'arrayFromRepeater':
    case 'collect':
      return true
    case 'joinSegments':
      return true
    case 'output':
      // Totality depends on the referenced target's own rules; resolved by
      // the caller via target coverage, so treat as total here.
      return true
    case 'ref': {
      const definition = mapping.definitions?.[String(expression.name)]
      return definition ? isTotalExpression(definition, mapping) : false
    }
    case 'conditional': {
      const elseExpression = /** @type {ValueExpression | undefined} */ (
        expression.else
      )
      return elseExpression ? isTotalExpression(elseExpression, mapping) : false
    }
    case 'firstAnswered':
      return false
    case 'meta':
      return true
    default:
      return false
  }
}

/**
 * Checks coverage of one output schema property by the mapping rules.
 * @param {string} propertyName
 * @param {import('./types.js').OutputSchemaProperty} property
 * @param {MappingDefinition} mapping
 * @param {Finding[]} findings
 */
function checkPropertyCoverage(propertyName, property, mapping, findings) {
  const rules = mapping.rules.filter((rule) => rule.target === propertyName)

  if (rules.length === 0) {
    if (property.required) {
      findings.push({
        severity: 'error',
        code: 'missing-target',
        message: `Required output property "${propertyName}" has no mapping rules`
      })
    }
    return
  }

  const hasGuaranteedRule = rules.some(
    (rule) => !rule.when && isTotalExpression(rule.value, mapping)
  )

  if (property.required && !hasGuaranteedRule) {
    const hasUnconditionalRule = rules.some((rule) => !rule.when)
    findings.push({
      severity: 'warning',
      code: 'no-guaranteed-rule',
      message: hasUnconditionalRule
        ? `Required output property "${propertyName}" has an unconditional rule but its value can resolve to nothing (e.g. an unanswered question without a default); the property may be omitted`
        : `Required output property "${propertyName}" only has conditional rules; the property will be omitted when no condition matches`
    })
  }

  // Check required item properties for array targets
  if (property.type === 'array' && property.items?.properties) {
    const requiredItemProperties = Object.entries(property.items.properties)
      .filter(([, itemProperty]) => itemProperty.required)
      .map(([name]) => name)

    for (const rule of rules) {
      const itemPropertyNames = getProducedItemProperties(rule.value, mapping)
      if (!itemPropertyNames) {
        continue
      }
      for (const requiredName of requiredItemProperties) {
        if (!itemPropertyNames.includes(requiredName)) {
          findings.push({
            severity: 'error',
            code: 'missing-item-property',
            message: `Rule "${rule.id}" produces items for "${propertyName}" without the required item property "${requiredName}"`
          })
        }
      }
    }
  }

  // Check declared constant values
  if (property.const !== undefined) {
    for (const rule of rules) {
      if (
        !rule.when &&
        rule.value.type === 'literal' &&
        rule.value.value !== property.const
      ) {
        findings.push({
          severity: 'error',
          code: 'const-mismatch',
          message: `Rule "${rule.id}" sets "${propertyName}" to ${JSON.stringify(rule.value.value)} but the output schema requires the constant ${JSON.stringify(property.const)}`
        })
      }
    }
  }
}

/**
 * Returns the item property names an array-producing expression generates,
 * or undefined when the expression does not build structured items (e.g. a
 * literal empty array fallback).
 * @param {ValueExpression} expression
 * @param {MappingDefinition} mapping
 * @returns {string[] | undefined}
 */
function getProducedItemProperties(expression, mapping) {
  if (expression.type === 'ref') {
    const definition = mapping.definitions?.[String(expression.name)]
    return definition
      ? getProducedItemProperties(definition, mapping)
      : undefined
  }
  if (expression.type === 'arrayFromRepeater' && expression.item) {
    return Object.keys(/** @type {object} */ (expression.item))
  }
  if (expression.type === 'array' && Array.isArray(expression.items)) {
    /** @type {string[]} */
    const names = []
    for (const item of /** @type {ValueExpression[]} */ (expression.items)) {
      if (item.type === 'object' && item.properties) {
        names.push(...Object.keys(/** @type {object} */ (item.properties)))
      }
    }
    return names.length > 0 ? [...new Set(names)] : undefined
  }
  return undefined
}

/**
 * Runs the full gap analysis.
 * @param {object} input
 * @param {MappingDefinition} input.mapping - The mapping definition
 * @param {FormDefinitionLike} input.formDefinition - The parsed form definition JSON
 * @param {OutputSchema} input.outputSchema - The output schema the mapping must satisfy
 * @returns {Finding[]}
 */
export function analyseMappingGaps({ mapping, formDefinition, outputSchema }) {
  /** @type {Finding[]} */
  const findings = []
  const formIndex = buildFormIndex(formDefinition)
  const { refs, lookups, comparisons } = collectMappingReferences(mapping)

  // 1. Question and repeater ids must exist in the form definition
  const reportedMissing = new Set()
  for (const ref of refs) {
    const key = `${ref.kind}:${ref.id}`
    if (ref.kind === 'question') {
      if (!formIndex.components.has(ref.id) && !reportedMissing.has(key)) {
        reportedMissing.add(key)
        findings.push({
          severity: 'error',
          code: 'unknown-question',
          message: `Question "${ref.id}" (${ref.text ?? 'no text'}) referenced at ${ref.location} does not exist in the form definition`
        })
      }
    } else if (ref.id !== '*') {
      if (!formIndex.repeaters.has(ref.id) && !reportedMissing.has(key)) {
        reportedMissing.add(key)
        findings.push({
          severity: 'error',
          code: 'unknown-repeater',
          message: `Repeater "${ref.id}" (${ref.text ?? 'no text'}) referenced at ${ref.location} does not exist in the form definition`
        })
      }
    }
  }

  // 2. Question text placeholders should match the form definition
  const reportedDrift = new Set()
  for (const ref of refs) {
    if (ref.kind !== 'question' || !ref.text || reportedDrift.has(ref.id)) {
      continue
    }
    const component = formIndex.components.get(ref.id)
    if (
      component?.title &&
      normaliseText(component.title) !== normaliseText(ref.text)
    ) {
      reportedDrift.add(ref.id)
      findings.push({
        severity: 'warning',
        code: 'question-text-drift',
        message: `Question "${ref.id}" text in the mapping ("${ref.text}") differs from the form definition ("${component.title}")`
      })
    }
  }

  // 3. Condition values must be selectable answers for list-based questions
  for (const comparison of comparisons) {
    const component = formIndex.components.get(comparison.questionId)
    const listValues = component?.listId
      ? formIndex.listValues.get(String(component.listId))
      : undefined
    if (!listValues || listValues.length === 0) {
      continue
    }
    for (const value of comparison.values) {
      const matchable = comparison.startsWith
        ? listValues.some((option) => option.startsWith(value))
        : listValues.includes(value)
      if (!matchable) {
        findings.push({
          severity: 'warning',
          code: 'unmatchable-condition-value',
          message: `Condition at ${comparison.location} compares question "${comparison.questionId}" with "${value}", which is not a selectable answer in the form`
        })
      }
    }
  }

  // 4. Lookup tables: keys must be matchable and all options should be covered
  for (const lookup of lookups) {
    if (!lookup.questionId) {
      continue
    }
    const component = formIndex.components.get(lookup.questionId)
    const listValues = component?.listId
      ? formIndex.listValues.get(String(component.listId))
      : undefined
    if (!listValues || listValues.length === 0) {
      continue
    }

    for (const key of lookup.keys) {
      const matchable = lookup.startsWith
        ? listValues.some((option) => option.startsWith(key))
        : listValues.includes(key)
      if (!matchable) {
        findings.push({
          severity: 'warning',
          code: 'stale-lookup-key',
          message: `Lookup at ${lookup.location} has key "${key}" that matches no answer option of question "${lookup.questionId}"`
        })
      }
    }

    if (!lookup.passthrough) {
      for (const option of listValues) {
        const covered = lookup.startsWith
          ? lookup.keys.some((key) => option.startsWith(key))
          : lookup.keys.includes(option)
        if (!covered) {
          findings.push({
            severity: 'warning',
            code: 'unmapped-answer-option',
            message: `Answer option "${option}" of question "${lookup.questionId}" is not covered by the lookup at ${lookup.location}; submissions choosing it will fall through to later rules`
          })
        }
      }
    }
  }

  // 5. Required output properties must be produced
  for (const [propertyName, property] of Object.entries(
    outputSchema.properties
  )) {
    checkPropertyCoverage(propertyName, property, mapping, findings)
  }

  return findings
}
