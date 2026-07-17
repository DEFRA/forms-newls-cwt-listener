import { validateMappingDefinition } from './mapping-schema.js'

/**
 * @param {Record<string, unknown>} [overrides]
 */
function buildMapping(overrides = {}) {
  return {
    id: 'test-mapping',
    name: 'Test mapping',
    version: 1,
    formIds: ['form-1'],
    outputSchema: './schema.json',
    destination: { type: 'rest', name: 'universityApi' },
    rules: [
      { id: 'a', target: 'field', value: { type: 'literal', value: 'x' } }
    ],
    ...overrides
  }
}

/**
 * @param {Record<string, unknown>} [overrides]
 */
function buildExpansion(overrides = {}) {
  return {
    id: 'bodies',
    repeater: { id: 'people', text: 'People' },
    targets: {
      body_name: { type: 'answer', question: { id: 'name' } }
    },
    ...overrides
  }
}

describe('validateMappingDefinition', () => {
  it('accepts a mapping with no expansion', () => {
    expect(
      validateMappingDefinition(buildMapping(), 'test.json')
    ).toMatchObject({ id: 'test-mapping' })
  })

  describe('expand', () => {
    it('accepts a well-formed expansion', () => {
      const result = validateMappingDefinition(
        buildMapping({ expand: buildExpansion() }),
        'test.json'
      )
      expect(result.expand).toMatchObject({ id: 'bodies' })
    })

    it('defaults deliverySuccessMode to "all", matching the pre-expansion behaviour', () => {
      const result = validateMappingDefinition(
        buildMapping({ expand: buildExpansion() }),
        'test.json'
      )
      expect(result.expand?.deliverySuccessMode).toBe('all')
    })

    it.each(['all', 'any'])('accepts deliverySuccessMode "%s"', (mode) => {
      const result = validateMappingDefinition(
        buildMapping({ expand: buildExpansion({ deliverySuccessMode: mode }) }),
        'test.json'
      )
      expect(result.expand?.deliverySuccessMode).toBe(mode)
    })

    it('rejects an unknown deliverySuccessMode', () => {
      expect(() =>
        validateMappingDefinition(
          buildMapping({
            expand: buildExpansion({ deliverySuccessMode: 'most' })
          }),
          'test.json'
        )
      ).toThrow('is invalid')
    })

    it('requires an id, a repeater and at least one target', () => {
      for (const missing of ['id', 'repeater', 'targets']) {
        const expansion = buildExpansion()
        // @ts-expect-error - deleting a required key under test
        delete expansion[missing]
        expect(() =>
          validateMappingDefinition(
            buildMapping({ expand: expansion }),
            'test.json'
          )
        ).toThrow('is invalid')
      }
    })

    it('rejects an empty targets object', () => {
      expect(() =>
        validateMappingDefinition(
          buildMapping({ expand: buildExpansion({ targets: {} }) }),
          'test.json'
        )
      ).toThrow('is invalid')
    })

    it('rejects an unknown value expression type in a target', () => {
      expect(() =>
        validateMappingDefinition(
          buildMapping({
            expand: buildExpansion({ targets: { body: { type: 'nonsense' } } })
          }),
          'test.json'
        )
      ).toThrow('is invalid')
    })

    it('accepts the expansion-only value expression types', () => {
      const result = validateMappingDefinition(
        buildMapping({
          expand: buildExpansion({
            targets: {
              submission_index: { type: 'expansionIndex' },
              submission_count: { type: 'expansionCount' }
            }
          })
        }),
        'test.json'
      )
      expect(result.expand?.targets.submission_index).toEqual({
        type: 'expansionIndex'
      })
    })

    it('cannot express a second expansion, since expand is an object', () => {
      expect(() =>
        validateMappingDefinition(
          buildMapping({ expand: [buildExpansion(), buildExpansion()] }),
          'test.json'
        )
      ).toThrow('is invalid')
    })
  })

  it('names the source in the error message', () => {
    expect(() =>
      validateMappingDefinition({ id: 'broken' }, 'broken.mapping.json')
    ).toThrow('Mapping file "broken.mapping.json" is invalid')
  })
})
