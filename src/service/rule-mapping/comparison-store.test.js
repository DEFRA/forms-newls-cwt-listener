import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

/** @type {{ comparisonStore: string, comparisonStoreDir: string }} */
const mappingEngineSettings = {
  comparisonStore: 'file',
  comparisonStoreDir: ''
}

const loggerInfo = vi.fn()
const loggerWarn = vi.fn()
const loggerError = vi.fn()

vi.mock('../../config.js', () => ({
  config: {
    get: vi.fn(() => mappingEngineSettings)
  }
}))

vi.mock('../../common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: loggerInfo,
    warn: loggerWarn,
    error: loggerError
  })
}))

const { storeComparison } = await import('./comparison-store.js')

/**
 * @param {Partial<import('./comparison-store.js').ComparisonRecord>} overrides
 * @returns {import('./comparison-store.js').ComparisonRecord}
 */
function buildRecord(overrides = {}) {
  return {
    mappingId: 'advice-to-cwt',
    formId: 'form-1',
    referenceNumber: '111-222-333',
    timestamp: '2026-06-10T10:00:00.000Z',
    matches: true,
    legacyPayload: { a: 1 },
    rulesPayload: { a: 1 },
    ...overrides
  }
}

describe('storeComparison', () => {
  /** @type {string} */
  let testDir

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'comparison-store-test-'))
    mappingEngineSettings.comparisonStore = 'file'
    mappingEngineSettings.comparisonStoreDir = testDir
    vi.clearAllMocks()
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  it('writes one JSON document per comparison to the file backend', () => {
    storeComparison(buildRecord())

    const formDir = join(testDir, 'form-1')
    const files = readdirSync(formDir)
    expect(files.length).toBe(1)
    expect(files[0]).toMatch(/^111-222-333-\d+\.json$/)

    const stored = JSON.parse(readFileSync(join(formDir, files[0]), 'utf8'))
    expect(stored).toMatchObject({
      mappingId: 'advice-to-cwt',
      matches: true,
      legacyPayload: { a: 1 },
      rulesPayload: { a: 1 }
    })
  })

  it('warns when the payloads do not match', () => {
    storeComparison(buildRecord({ matches: false, rulesPayload: { a: 2 } }))
    expect(loggerWarn).toHaveBeenCalledWith(expect.stringContaining('MISMATCH'))
    expect(loggerWarn).toHaveBeenCalledWith(
      expect.stringContaining('111-222-333')
    )
  })

  it('does nothing for the none backend', () => {
    mappingEngineSettings.comparisonStore = 'none'
    storeComparison(buildRecord())
    expect(readdirSync(testDir)).toEqual([])
  })

  it('logs but does not throw when the backend fails', () => {
    // Point the file backend at a path whose parent is a regular file so the
    // directory creation fails, exercising the swallow-and-log behaviour.
    const blockingFile = join(testDir, 'not-a-dir')
    writeFileSync(blockingFile, 'x')
    mappingEngineSettings.comparisonStoreDir = join(blockingFile, 'nested')

    expect(storeComparison(buildRecord())).toBeUndefined()
    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to store mapping comparison')
    )
    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('111-222-333')
    )
  })
})

describe('storeComparison with the "log" backend', () => {
  beforeEach(() => {
    mappingEngineSettings.comparisonStore = 'log'
    vi.clearAllMocks()
  })

  it('logs a data-free success line at info level on a match', () => {
    storeComparison(buildRecord({ matches: true }))

    expect(loggerInfo).toHaveBeenCalledTimes(1)
    const [message] = loggerInfo.mock.calls[0]
    expect(message).toContain('[cstore]')
    expect(message).toContain('succeeded')
    expect(message).toContain('111-222-333')
  })

  it('logs the differing properties at info level on a mismatch', () => {
    storeComparison(
      buildRecord({
        matches: false,
        legacyPayload: { name: 'Alice', extra: 1 },
        rulesPayload: { name: 'Bob' }
      })
    )

    expect(loggerInfo).toHaveBeenCalledTimes(1)
    const [message] = loggerInfo.mock.calls[0]
    expect(message).toContain('[cstore]')
    expect(message).toContain('difference')
    expect(message).toContain('extra: present in legacy but missing in rules')
    expect(message).toContain('name: string length differs (legacy=5, rules=3)')
  })

  it('does not leak the underlying data when logging differences', () => {
    storeComparison(
      buildRecord({
        matches: false,
        legacyPayload: { name: 'Alice' },
        rulesPayload: { name: 'Bob' }
      })
    )

    const serialised = JSON.stringify(loggerInfo.mock.calls[0])
    expect(serialised).not.toContain('Alice')
    expect(serialised).not.toContain('Bob')
  })

  it('reports a rules-engine failure at info level', () => {
    storeComparison(
      buildRecord({
        matches: false,
        rulesPayload: null,
        rulesError: 'boom'
      })
    )

    expect(loggerInfo).toHaveBeenCalledTimes(1)
    const [message] = loggerInfo.mock.calls[0]
    expect(message).toContain('[cstore]')
    expect(message).toContain('rules engine failed')
  })

  it('does not emit the generic mismatch warning for the log backend', () => {
    storeComparison(buildRecord({ matches: false, rulesPayload: { a: 2 } }))
    expect(loggerWarn).not.toHaveBeenCalled()
  })
})

describe('storeComparison payload redaction by environment', () => {
  /** @type {string} */
  let testDir
  /** @type {string | undefined} */
  let originalNodeEnv

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'comparison-store-env-test-'))
    mappingEngineSettings.comparisonStore = 'file'
    mappingEngineSettings.comparisonStoreDir = testDir
    originalNodeEnv = process.env.NODE_ENV
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }
    rmSync(testDir, { recursive: true, force: true })
  })

  /**
   * @param {string} formId
   * @returns {Record<string, unknown>}
   */
  function readOnlyStoredRecord(formId) {
    const formDir = join(testDir, formId)
    const files = readdirSync(formDir)
    expect(files.length).toBe(1)
    return JSON.parse(readFileSync(join(formDir, files[0]), 'utf8'))
  }

  it('persists payloads for an explicitly non-production environment', () => {
    process.env.NODE_ENV = 'development'
    storeComparison(buildRecord())

    const stored = readOnlyStoredRecord('form-1')
    expect(stored).toMatchObject({ legacyPayload: { a: 1 } })
    expect(stored.payloadsOmitted).toBeUndefined()
  })

  it.each(['production', 'prod'])(
    'strips payloads when NODE_ENV is "%s"',
    (env) => {
      process.env.NODE_ENV = env
      storeComparison(buildRecord())

      const stored = readOnlyStoredRecord('form-1')
      expect(stored.legacyPayload).toBeUndefined()
      expect(stored.rulesPayload).toBeUndefined()
      expect(stored.payloadsOmitted).toBe(true)
      expect(stored.matches).toBe(true)
    }
  )

  it('strips payloads when NODE_ENV is unset (treated as production)', () => {
    delete process.env.NODE_ENV
    storeComparison(buildRecord())

    const stored = readOnlyStoredRecord('form-1')
    expect(stored.legacyPayload).toBeUndefined()
    expect(stored.payloadsOmitted).toBe(true)
  })
})
