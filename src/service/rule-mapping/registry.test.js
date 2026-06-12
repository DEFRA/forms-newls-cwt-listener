import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('../../common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

const {
  loadRegistry,
  findMappingForForm,
  loadMappingFile,
  clearRegistryCache
} = await import('./registry.js')

/** @type {string} */
let testDir

/**
 * @param {string} fileName
 * @param {unknown} content
 */
function writeMapping(fileName, content) {
  writeFileSync(join(testDir, fileName), JSON.stringify(content))
}

/**
 * @param {Partial<Record<string, unknown>>} overrides
 */
function buildMappingContent(overrides = {}) {
  return {
    id: 'test-mapping',
    name: 'Test mapping',
    version: 1,
    formIds: ['form-1'],
    outputSchema: './schema.json',
    destination: { type: 'rest', name: 'universityApi' },
    rules: [
      {
        id: 'rule-1',
        target: 'field',
        value: { type: 'literal', value: 'x' }
      }
    ],
    ...overrides
  }
}

describe('mapping registry', () => {
  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'mappings-test-'))
    clearRegistryCache()
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
    clearRegistryCache()
  })

  it('loads and indexes the real mapping files', () => {
    const registry = loadRegistry('mappings')
    expect(registry.mappings.length).toBe(3)
    expect(findMappingForForm('mappings', '69a07d92093ab56d4fa9f325')?.id).toBe(
      'advice-to-cwt'
    )
    expect(findMappingForForm('mappings', 'nope')).toBeUndefined()
  })

  it('caches the registry per directory', () => {
    writeMapping('a.mapping.json', buildMappingContent())
    const first = loadRegistry(testDir)
    const second = loadRegistry(testDir)
    expect(second).toBe(first)
  })

  it('ignores files that are not mapping files', () => {
    writeMapping('a.mapping.json', buildMappingContent())
    writeFileSync(join(testDir, 'notes.json'), '{}')
    expect(loadRegistry(testDir).mappings.length).toBe(1)
  })

  it('throws when two mappings claim the same form id', () => {
    writeMapping('a.mapping.json', buildMappingContent({ id: 'mapping-a' }))
    writeMapping('b.mapping.json', buildMappingContent({ id: 'mapping-b' }))
    expect(() => loadRegistry(testDir)).toThrow(
      'Form id "form-1" is claimed by both mapping "mapping-a" and mapping "mapping-b"'
    )
  })

  it('throws a descriptive error for invalid JSON', () => {
    writeFileSync(join(testDir, 'bad.mapping.json'), '{ not json')
    expect(() => loadRegistry(testDir)).toThrow('is not valid JSON')
  })

  it('throws a descriptive error for structurally invalid mappings', () => {
    writeMapping('bad.mapping.json', { id: 'missing-everything' })
    expect(() => loadRegistry(testDir)).toThrow('is invalid')
  })

  it('rejects rules with unknown value expression types', () => {
    writeMapping(
      'bad.mapping.json',
      buildMappingContent({
        rules: [{ id: 'rule-1', target: 'field', value: { type: 'magic' } }]
      })
    )
    expect(() => loadRegistry(testDir)).toThrow('is invalid')
  })

  it('validates a single mapping file via loadMappingFile', () => {
    writeMapping('a.mapping.json', buildMappingContent())
    const mapping = loadMappingFile(join(testDir, 'a.mapping.json'))
    expect(mapping.id).toBe('test-mapping')
  })
})
