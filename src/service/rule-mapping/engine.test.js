import { buildFormAdapterSubmissionMessage } from '../__stubs__/event-builders.js'
import { mapWithRules } from './engine.js'
import { applyTransforms, knownTransformNames } from './transforms.js'
import { isEmpty } from './is-empty.js'

/**
 * @param {Record<string, unknown>} main
 * @param {Record<string, Array<Record<string, unknown>>>} [repeaters]
 */
function buildMessage(main, repeaters = {}) {
  return buildFormAdapterSubmissionMessage({
    data: { main, repeaters, files: {} }
  })
}

/**
 * Builds a minimal mapping definition around the given rules.
 * @param {import('./types.js').MappingRule[]} rules
 * @param {Partial<import('./types.js').MappingDefinition>} [overrides]
 * @returns {import('./types.js').MappingDefinition}
 */
function buildMapping(rules, overrides = {}) {
  return {
    id: 'test-mapping',
    name: 'Test mapping',
    version: 1,
    formIds: ['form-1'],
    outputSchema: './schema.json',
    destination: { type: 'rest', name: 'universityApi' },
    rules,
    ...overrides
  }
}

describe('mapWithRules', () => {
  it('throws when messageId is missing', () => {
    const message = buildFormAdapterSubmissionMessage({
      // @ts-expect-error - testing missing messageId
      messageId: undefined
    })
    expect(() => mapWithRules(buildMapping([]), message)).toThrow(
      'Unexpected missing message.messageId'
    )
  })

  it('applies the first matching rule per target and skips later ones', () => {
    const mapping = buildMapping([
      {
        id: 'a',
        target: 'field',
        when: { question: { id: 'q1' }, operator: 'equals', value: 'A' },
        value: { type: 'literal', value: 'first' }
      },
      {
        id: 'b',
        target: 'field',
        value: { type: 'literal', value: 'second' }
      }
    ])
    expect(mapWithRules(mapping, buildMessage({ q1: 'A' }))).toEqual({
      field: 'first'
    })
    expect(mapWithRules(mapping, buildMessage({ q1: 'B' }))).toEqual({
      field: 'second'
    })
  })

  it('falls through to the next rule when a value resolves to undefined', () => {
    const mapping = buildMapping([
      {
        id: 'a',
        target: 'field',
        value: { type: 'answer', question: { id: 'missing' } }
      },
      {
        id: 'b',
        target: 'field',
        value: { type: 'literal', value: 'fallback' }
      }
    ])
    expect(mapWithRules(mapping, buildMessage({}))).toEqual({
      field: 'fallback'
    })
  })

  it('omits targets whose rules all fall through', () => {
    const mapping = buildMapping([
      {
        id: 'a',
        target: 'field',
        value: { type: 'answer', question: { id: 'missing' } }
      }
    ])
    expect(mapWithRules(mapping, buildMessage({}))).toEqual({})
  })

  it('wraps rule failures with the mapping and rule id', () => {
    const mapping = buildMapping([
      {
        id: 'bad-rule',
        target: 'field',
        value: {
          type: 'answer',
          question: { id: 'q1' },
          transforms: ['parseSssiId']
        }
      }
    ])
    expect(() =>
      mapWithRules(mapping, buildMessage({ q1: 'not-a-number' }))
    ).toThrow('Mapping "test-mapping" rule "bad-rule" failed')
  })

  describe('conditions', () => {
    /**
     * @param {import('./types.js').Condition} when
     * @param {Record<string, unknown>} main
     * @param {Record<string, Array<Record<string, unknown>>>} [repeaters]
     */
    function evaluate(when, main, repeaters = {}) {
      const mapping = buildMapping([
        {
          id: 'probe',
          target: 'matched',
          when,
          value: { type: 'literal', value: true }
        }
      ])
      const output = mapWithRules(mapping, buildMessage(main, repeaters))
      return output.matched === true
    }

    it('supports equals and notEquals', () => {
      const question = { id: 'q1' }
      expect(
        evaluate({ question, operator: 'equals', value: 'A' }, { q1: 'A' })
      ).toBe(true)
      expect(
        evaluate({ question, operator: 'notEquals', value: 'A' }, { q1: 'B' })
      ).toBe(true)
    })

    it('supports in and startsWith', () => {
      const question = { id: 'q1' }
      expect(
        evaluate({ question, operator: 'in', values: ['A', 'B'] }, { q1: 'B' })
      ).toBe(true)
      expect(
        evaluate(
          { question, operator: 'startsWith', value: 'A Country' },
          { q1: 'A Countryside Stewardship agreement' }
        )
      ).toBe(true)
      expect(
        evaluate({ question, operator: 'startsWith', value: 'A' }, { q1: 7 })
      ).toBe(false)
    })

    it('supports isAnswered, isNotAnswered, isTruthy and isFalsy', () => {
      const question = { id: 'q1' }
      expect(evaluate({ question, operator: 'isAnswered' }, { q1: '' })).toBe(
        false
      )
      expect(evaluate({ question, operator: 'isNotAnswered' }, {})).toBe(true)
      expect(evaluate({ question, operator: 'isTruthy' }, { q1: true })).toBe(
        true
      )
      expect(evaluate({ question, operator: 'isFalsy' }, { q1: false })).toBe(
        true
      )
      expect(evaluate({ question, operator: 'isFalsy' }, {})).toBe(true)
    })

    it('supports repeater hasEntries, isEmpty and hasAnswer', () => {
      const repeater = { id: 'r1' }
      expect(
        evaluate({ repeater, operator: 'hasEntries' }, {}, { r1: [{ a: 1 }] })
      ).toBe(true)
      expect(evaluate({ repeater, operator: 'isEmpty' }, {}, {})).toBe(true)
      expect(
        evaluate(
          { repeater, operator: 'hasAnswer', questionId: 'a' },
          {},
          { r1: [{ a: '' }, { a: 'yes' }] }
        )
      ).toBe(true)
      expect(
        evaluate(
          { repeater: { id: '*' }, operator: 'hasAnswer', questionId: 'a' },
          {},
          { other: [{ a: 'yes' }] }
        )
      ).toBe(true)
    })

    it('supports all, any, not and named condition refs', () => {
      const question = { id: 'q1' }
      const mapping = buildMapping(
        [
          {
            id: 'probe',
            target: 'matched',
            when: {
              all: [
                { ref: 'isA' },
                { not: { question, operator: 'equals', value: 'B' } }
              ]
            },
            value: { type: 'literal', value: true }
          }
        ],
        {
          conditions: {
            isA: {
              any: [{ question, operator: 'equals', value: 'A' }]
            }
          }
        }
      )
      expect(mapWithRules(mapping, buildMessage({ q1: 'A' }))).toEqual({
        matched: true
      })
      expect(mapWithRules(mapping, buildMessage({ q1: 'B' }))).toEqual({})
    })

    it('throws for an unknown named condition', () => {
      const mapping = buildMapping([
        {
          id: 'probe',
          target: 'matched',
          when: { ref: 'nope' },
          value: { type: 'literal', value: true }
        }
      ])
      expect(() => mapWithRules(mapping, buildMessage({}))).toThrow(
        'Unknown named condition "nope"'
      )
    })
  })

  describe('value expressions', () => {
    /**
     * @param {import('./types.js').ValueExpression} value
     * @param {Record<string, unknown>} main
     * @param {Record<string, Array<Record<string, unknown>>>} [repeaters]
     * @param {Partial<import('./types.js').MappingDefinition>} [overrides]
     */
    function resolve(value, main, repeaters = {}, overrides = {}) {
      const mapping = buildMapping(
        [{ id: 'probe', target: 'result', value }],
        overrides
      )
      return mapWithRules(mapping, buildMessage(main, repeaters)).result
    }

    it('resolves meta paths', () => {
      expect(resolve({ type: 'meta', path: 'referenceNumber' }, {})).toBe(
        '576-225-943'
      )
      expect(resolve({ type: 'meta', path: 'nope.deeper' }, {})).toBeUndefined()
    })

    it('uses the default when an answer is empty', () => {
      expect(
        resolve({ type: 'answer', question: { id: 'q1' }, default: 'dflt' }, {})
      ).toBe('dflt')
    })

    it('resolves lookup with exact match, startsWith match, passthrough and required', () => {
      const input = /** @type {const} */ ({
        type: 'answer',
        question: { id: 'q1' }
      })
      expect(
        resolve({ type: 'lookup', input, table: { A: 'mapped' } }, { q1: 'A' })
      ).toBe('mapped')
      expect(
        resolve(
          {
            type: 'lookup',
            input,
            match: 'startsWith',
            table: { 'A long': 'mapped' }
          },
          { q1: 'A long option text' }
        )
      ).toBe('mapped')
      expect(
        resolve(
          { type: 'lookup', input, table: {}, passthrough: true },
          { q1: 'B' }
        )
      ).toBe('B')
      expect(() =>
        resolve(
          { type: 'lookup', input, table: {}, required: true },
          { q1: 'B' }
        )
      ).toThrow('no mapping for value "B"')
    })

    it('resolves firstAnswered, concat and conditional', () => {
      expect(
        resolve(
          {
            type: 'firstAnswered',
            values: [
              { type: 'answer', question: { id: 'q1' } },
              { type: 'answer', question: { id: 'q2' } }
            ]
          },
          { q1: '', q2: 'second' }
        )
      ).toBe('second')
      expect(
        resolve(
          {
            type: 'concat',
            separator: ' ',
            parts: [
              { type: 'answer', question: { id: 'q1' } },
              { type: 'literal', value: ['x', 'y'] }
            ]
          },
          { q1: 'a' }
        )
      ).toBe('a x y')
      expect(
        resolve(
          {
            type: 'conditional',
            cases: [
              {
                when: {
                  question: { id: 'q1' },
                  operator: 'equals',
                  value: 'A'
                },
                value: { type: 'literal', value: 'case' }
              }
            ],
            else: { type: 'literal', value: 'else' }
          },
          { q1: 'Z' }
        )
      ).toBe('else')
    })

    it('resolves collect with unique and transforms', () => {
      expect(
        resolve(
          {
            type: 'collect',
            repeater: { id: 'r1' },
            question: { id: 'a' },
            unique: true,
            transforms: ['parseName']
          },
          {},
          { r1: [{ a: '1---One' }, { a: '1---One' }, { a: '2---Two' }, {}] }
        )
      ).toEqual(['One', 'Two'])
    })

    it('resolves output references and rejects forward references', () => {
      const mapping = buildMapping([
        { id: 'a', target: 'first', value: { type: 'literal', value: 'A' } },
        {
          id: 'b',
          target: 'second',
          value: { type: 'output', target: 'first' }
        }
      ])
      expect(mapWithRules(mapping, buildMessage({}))).toEqual({
        first: 'A',
        second: 'A'
      })

      const forward = buildMapping([
        {
          id: 'b',
          target: 'second',
          value: { type: 'output', target: 'first' }
        }
      ])
      expect(() => mapWithRules(forward, buildMessage({}))).toThrow(
        'has not been computed yet'
      )
    })

    it('resolves named definitions and rejects unknown ones', () => {
      expect(
        resolve(
          { type: 'ref', name: 'greeting' },
          {},
          {},
          { definitions: { greeting: { type: 'literal', value: 'hello' } } }
        )
      ).toBe('hello')
      expect(() => resolve({ type: 'ref', name: 'nope' }, {})).toThrow(
        'Unknown value definition "nope"'
      )
    })

    it('resolves arrayFromRepeater without grouping', () => {
      expect(
        resolve(
          {
            type: 'arrayFromRepeater',
            repeater: { id: 'r1' },
            filterAnswered: 'a',
            item: {
              id: { type: 'answer', question: { id: 'a' } },
              note: { type: 'answer', question: { id: 'b' }, default: '' }
            }
          },
          {},
          { r1: [{ a: 'x', b: 'note' }, { a: 'y' }, { b: 'skipped' }] }
        )
      ).toEqual([
        { id: 'x', note: 'note' },
        { id: 'y', note: '' }
      ])
    })

    it('resolves arrayFromRepeater with grouping and join aggregation', () => {
      expect(
        resolve(
          {
            type: 'arrayFromRepeater',
            repeater: { id: 'r1' },
            groupBy: { id: 'a' },
            item: {
              id: { type: 'answer', question: { id: 'a' } },
              notes: {
                type: 'answer',
                question: { id: 'b' },
                aggregate: { join: ', ' },
                default: ''
              }
            }
          },
          {},
          {
            r1: [{ a: 'x', b: 'one' }, { a: 'x', b: 'two' }, { a: 'y' }]
          }
        )
      ).toEqual([
        { id: 'x', notes: 'one, two' },
        { id: 'y', notes: '' }
      ])
    })

    it('resolves joinSegments with fallback, maxLength and fitNames overflow', () => {
      expect(
        resolve(
          {
            type: 'joinSegments',
            separator: ' - ',
            fallback: 'nothing',
            segments: [{ value: { type: 'answer', question: { id: 'q1' } } }]
          },
          {}
        )
      ).toBe('nothing')

      expect(
        resolve(
          {
            type: 'joinSegments',
            separator: ' - ',
            maxLength: 30,
            segments: [
              { value: { type: 'literal', value: 'Header' } },
              {
                value: {
                  type: 'literal',
                  value: ['Site One', 'Site Two', 'Site Three']
                },
                overflow: 'fitNames'
              }
            ]
          },
          {}
        )
      ).toBe('Header - Site One (+2 more)')

      expect(
        resolve(
          {
            type: 'joinSegments',
            separator: ' - ',
            maxLength: 10,
            segments: [
              { value: { type: 'literal', value: 'A very long header' } }
            ]
          },
          {}
        )
      ).toBe('A very ...')
    })

    it('throws for an unknown expression type', () => {
      expect(() => resolve({ type: 'nope' }, {})).toThrow(
        'Unknown value expression type "nope"'
      )
    })
  })
})

describe('applyTransforms', () => {
  it('applies scalar transforms element-wise to arrays', () => {
    expect(applyTransforms(['1---A', '2---B'], ['parseName'])).toEqual([
      'A',
      'B'
    ])
  })

  it('supports truncate with and without ellipsis', () => {
    expect(
      applyTransforms('abcdefghij', [{ name: 'truncate', maxLength: 5 }])
    ).toBe('ab...')
    expect(
      applyTransforms('abcdefghij', [
        { name: 'truncate', maxLength: 5, ellipsis: false }
      ])
    ).toBe('abcde')
  })

  it('supports join, first and fitNames', () => {
    expect(
      applyTransforms(['a', 'b'], [{ name: 'join', separator: ';' }])
    ).toBe('a;b')
    expect(applyTransforms(['a', 'b'], [{ name: 'first' }])).toBe('a')
    expect(
      applyTransforms(
        ['Alpha', 'Beta', 'Gamma'],
        [{ name: 'fitNames', maxLength: 16 }]
      )
    ).toBe('Alpha (+2 more)')
  })

  it('throws for an unknown transform', () => {
    expect(() => applyTransforms('x', ['nope'])).toThrow(
      'Unknown transform "nope"'
    )
  })

  it('lists the known transform names', () => {
    expect(knownTransformNames()).toEqual(
      expect.arrayContaining(['parseName', 'join', 'fitNames'])
    )
  })
})

describe('isEmpty', () => {
  it('treats undefined, null, empty string and empty array as empty', () => {
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty('')).toBe(true)
    expect(isEmpty([])).toBe(true)
  })

  it('treats 0, false and objects as not empty', () => {
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty(false)).toBe(false)
    expect(isEmpty({})).toBe(false)
  })
})
