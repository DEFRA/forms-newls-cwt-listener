import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  analyseMappingGaps,
  buildFormIndex,
  isTotalExpression
} from './gap-analysis.js'

const repoRoot = join(import.meta.dirname, '../../..')

/**
 * A small synthetic form definition exercising the index builder.
 */
const formDefinition = {
  name: 'Test form',
  pages: [
    {
      title: 'Colour',
      path: '/colour',
      components: [
        {
          type: 'RadiosField',
          name: 'colour',
          title: 'What is your favourite colour?',
          list: 'colour-list',
          options: { required: true }
        },
        {
          type: 'TextField',
          name: 'freeText',
          title: 'Tell us more',
          options: { required: false }
        }
      ]
    },
    {
      title: 'Pets',
      path: '/pets',
      controller: 'RepeatPageController',
      repeat: { options: { name: 'petsRepeater', title: 'Pet' } },
      components: [
        { type: 'TextField', name: 'petName', title: 'What is the pet called?' }
      ]
    }
  ],
  lists: [
    {
      id: 'colour-list',
      name: 'colourListName',
      items: [
        { text: 'Red', value: 'Red' },
        { text: 'Blue', value: 'Blue' }
      ]
    }
  ]
}

/**
 * @param {Partial<import('./types.js').MappingDefinition>} overrides
 * @returns {import('./types.js').MappingDefinition}
 */
function buildMapping(overrides = {}) {
  return {
    id: 'test-mapping',
    name: 'Test mapping',
    version: 1,
    formIds: ['form-1'],
    outputSchema: './schema.json',
    destination: { type: 'rest', name: 'universityApi' },
    rules: [],
    ...overrides
  }
}

describe('buildFormIndex', () => {
  it('indexes components, repeaters and lists', () => {
    const index = buildFormIndex(formDefinition)
    expect(index.components.get('colour')).toMatchObject({
      title: 'What is your favourite colour?',
      required: true,
      listId: 'colour-list'
    })
    expect(index.components.get('petName')?.repeaterName).toBe('petsRepeater')
    expect(index.repeaters.get('petsRepeater')?.title).toBe('Pet')
    expect(index.listValues.get('colour-list')).toEqual(['Red', 'Blue'])
    expect(index.listValues.get('colourListName')).toEqual(['Red', 'Blue'])
  })
})

describe('isTotalExpression', () => {
  const mapping = buildMapping({
    definitions: { always: { type: 'literal', value: 'x' } }
  })

  it('treats literals, concat and expressions with defaults as total', () => {
    expect(isTotalExpression({ type: 'literal', value: 'x' }, mapping)).toBe(
      true
    )
    expect(isTotalExpression({ type: 'concat', parts: [] }, mapping)).toBe(true)
    expect(
      isTotalExpression(
        { type: 'answer', question: { id: 'q' }, default: '' },
        mapping
      )
    ).toBe(true)
    expect(isTotalExpression({ type: 'ref', name: 'always' }, mapping)).toBe(
      true
    )
  })

  it('treats answers without defaults and conditionals without else as not total', () => {
    expect(
      isTotalExpression({ type: 'answer', question: { id: 'q' } }, mapping)
    ).toBe(false)
    expect(isTotalExpression({ type: 'conditional', cases: [] }, mapping)).toBe(
      false
    )
  })
})

describe('analyseMappingGaps', () => {
  /** @type {import('./types.js').OutputSchema} */
  const outputSchema = {
    properties: {
      colour_output: { type: 'string', required: true },
      optional_output: { type: 'string', required: false }
    }
  }

  it('reports unknown questions and repeaters as errors', () => {
    const mapping = buildMapping({
      rules: [
        {
          id: 'r1',
          target: 'colour_output',
          value: { type: 'answer', question: { id: 'nope' }, default: '' }
        },
        {
          id: 'r2',
          target: 'optional_output',
          value: {
            type: 'collect',
            repeater: { id: 'noRepeater' },
            question: { id: 'petName' }
          }
        }
      ]
    })
    const findings = analyseMappingGaps({
      mapping,
      formDefinition,
      outputSchema
    })
    expect(findings).toContainEqual(
      expect.objectContaining({ code: 'unknown-question', severity: 'error' })
    )
    expect(findings).toContainEqual(
      expect.objectContaining({ code: 'unknown-repeater', severity: 'error' })
    )
  })

  it('reports question text drift as a warning', () => {
    const mapping = buildMapping({
      rules: [
        {
          id: 'r1',
          target: 'colour_output',
          value: {
            type: 'answer',
            question: { id: 'colour', text: 'A stale question text' },
            default: ''
          }
        }
      ]
    })
    const findings = analyseMappingGaps({
      mapping,
      formDefinition,
      outputSchema
    })
    expect(findings).toContainEqual(
      expect.objectContaining({ code: 'question-text-drift' })
    )
  })

  it('reports condition values that can never match', () => {
    const mapping = buildMapping({
      rules: [
        {
          id: 'r1',
          target: 'colour_output',
          when: {
            question: { id: 'colour' },
            operator: 'equals',
            value: 'Green'
          },
          value: { type: 'literal', value: 'green' }
        },
        {
          id: 'r2',
          target: 'colour_output',
          value: { type: 'literal', value: 'other' }
        }
      ]
    })
    const findings = analyseMappingGaps({
      mapping,
      formDefinition,
      outputSchema
    })
    expect(findings).toContainEqual(
      expect.objectContaining({ code: 'unmatchable-condition-value' })
    )
  })

  it('reports stale lookup keys and unmapped answer options', () => {
    const mapping = buildMapping({
      rules: [
        {
          id: 'r1',
          target: 'colour_output',
          value: {
            type: 'lookup',
            input: { type: 'answer', question: { id: 'colour' } },
            table: { Red: 'mapped-red', Green: 'mapped-green' }
          }
        },
        {
          id: 'r2',
          target: 'colour_output',
          value: { type: 'literal', value: 'fallback' }
        }
      ]
    })
    const findings = analyseMappingGaps({
      mapping,
      formDefinition,
      outputSchema
    })
    expect(findings).toContainEqual(
      expect.objectContaining({
        code: 'stale-lookup-key',
        message: expect.stringContaining('"Green"')
      })
    )
    expect(findings).toContainEqual(
      expect.objectContaining({
        code: 'unmapped-answer-option',
        message: expect.stringContaining('"Blue"')
      })
    )
  })

  it('reports required outputs with no rules as errors', () => {
    const findings = analyseMappingGaps({
      mapping: buildMapping(),
      formDefinition,
      outputSchema
    })
    expect(findings).toContainEqual(
      expect.objectContaining({
        code: 'missing-target',
        severity: 'error',
        message: expect.stringContaining('colour_output')
      })
    )
    expect(findings).not.toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('optional_output')
      })
    )
  })

  it('warns when a required output has no guaranteed rule', () => {
    const conditionalOnly = buildMapping({
      rules: [
        {
          id: 'r1',
          target: 'colour_output',
          when: { question: { id: 'colour' }, operator: 'isAnswered' },
          value: { type: 'literal', value: 'x' }
        }
      ]
    })
    expect(
      analyseMappingGaps({
        mapping: conditionalOnly,
        formDefinition,
        outputSchema
      })
    ).toContainEqual(expect.objectContaining({ code: 'no-guaranteed-rule' }))

    const fallible = buildMapping({
      rules: [
        {
          id: 'r1',
          target: 'colour_output',
          value: { type: 'answer', question: { id: 'freeText' } }
        }
      ]
    })
    expect(
      analyseMappingGaps({ mapping: fallible, formDefinition, outputSchema })
    ).toContainEqual(expect.objectContaining({ code: 'no-guaranteed-rule' }))
  })

  it('reports array rules missing required item properties', () => {
    /** @type {import('./types.js').OutputSchema} */
    const arraySchema = {
      properties: {
        pets: {
          type: 'array',
          required: true,
          items: {
            properties: {
              name: { type: 'string', required: true },
              age: { type: 'number', required: true }
            }
          }
        }
      }
    }
    const mapping = buildMapping({
      rules: [
        {
          id: 'pets-rule',
          target: 'pets',
          value: {
            type: 'arrayFromRepeater',
            repeater: { id: 'petsRepeater' },
            item: {
              name: { type: 'answer', question: { id: 'petName' } }
            }
          }
        }
      ]
    })
    const findings = analyseMappingGaps({
      mapping,
      formDefinition,
      outputSchema: arraySchema
    })
    expect(findings).toContainEqual(
      expect.objectContaining({
        code: 'missing-item-property',
        severity: 'error',
        message: expect.stringContaining('"age"')
      })
    )
  })

  it('reports const mismatches as errors', () => {
    /** @type {import('./types.js').OutputSchema} */
    const constSchema = {
      properties: {
        form_type: { type: 'string', required: true, const: 'consent' }
      }
    }
    const mapping = buildMapping({
      rules: [
        {
          id: 'form-type',
          target: 'form_type',
          value: { type: 'literal', value: 'advice' }
        }
      ]
    })
    expect(
      analyseMappingGaps({ mapping, formDefinition, outputSchema: constSchema })
    ).toContainEqual(expect.objectContaining({ code: 'const-mismatch' }))
  })

  it('finds no errors in the real mapping files', () => {
    const pairs = [
      ['advice-cwt.mapping.json', 'advice.json'],
      ['assent-cwt.mapping.json', 'assent.json'],
      ['consent-cwt.mapping.json', 'consent.json']
    ]
    for (const [mappingFile, formFile] of pairs) {
      const mapping = JSON.parse(
        readFileSync(join(repoRoot, 'mappings', mappingFile), 'utf8')
      )
      const realFormDefinition = JSON.parse(
        readFileSync(join(repoRoot, 'form-definitions', formFile), 'utf8')
      )
      const realOutputSchema = JSON.parse(
        readFileSync(join(repoRoot, 'mappings', mapping.outputSchema), 'utf8')
      )
      const findings = analyseMappingGaps({
        mapping,
        formDefinition: realFormDefinition,
        outputSchema: realOutputSchema
      })
      const errors = findings.filter((finding) => finding.severity === 'error')
      expect(errors).toEqual([])
    }
  })
})
