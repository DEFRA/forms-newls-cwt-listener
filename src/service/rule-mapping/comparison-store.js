/**
 * Comparison store for dual-run mode.
 *
 * When the mapping engine mode is "both", the submission is mapped by the
 * legacy mapper (whose payload is transmitted) AND by the rules engine. Both
 * payloads are persisted here so they can be compared later to prove the
 * rule-based mapping is sound before the legacy code is removed.
 *
 * Backends (selected with the COMPARISON_STORE config):
 * - "file": one JSON document per submission under the configured directory
 * - "log": a single `info` line per submission (no payloads — see below)
 * - "none": comparisons are not persisted (mismatches are still logged)
 *
 * Submitted form data must never leave production: when NODE_ENV is "production"
 * / "prod" — or is not set at all (treated as production for safety) — the raw
 * payloads are stripped before anything is persisted to the file backend. The
 * "log" backend never emits payloads in any environment; it only reports the
 * reference number and, for mismatches, a data-free description of which
 * properties differ.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { config } from '../../config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { describeDifferences } from './diff-summary.js'

const logger = createLogger()

/** Prefix on every comparison-store log line so they are easy to grep. */
const LOG_PREFIX = '[cstore]'

/**
 * @typedef {object} ComparisonRecord
 * @property {string} mappingId - The mapping definition id (or "unknown" when no mapping was found)
 * @property {string} formId - The submitted form's id
 * @property {string} referenceNumber - The submission reference number
 * @property {string} timestamp - ISO timestamp of when the comparison was made
 * @property {boolean} matches - Whether the two payloads are deeply equal (after JSON normalisation)
 * @property {unknown} legacyPayload - The payload produced by the legacy mapper (this is what was transmitted)
 * @property {unknown} rulesPayload - The payload produced by the rules engine (null when mapping failed)
 * @property {string} [rulesError] - The rules engine error message, when mapping failed
 */

/**
 * A comparison record as persisted to the file backend. It is either the full
 * record or, when the environment forbids persisting submitted data, the
 * record with its payloads stripped and a `payloadsOmitted` marker added.
 * @typedef {ComparisonRecord | (Omit<ComparisonRecord, 'legacyPayload' | 'rulesPayload'> & { payloadsOmitted: true })} PersistableRecord
 */

/**
 * @param {PersistableRecord} record
 */
function storeToFile(record) {
  const { comparisonStoreDir } = /** @type {{ comparisonStoreDir: string }} */ (
    config.get('mappingEngine')
  )

  const directory = join(resolve(comparisonStoreDir), record.formId)
  mkdirSync(directory, { recursive: true })

  const safeReference = record.referenceNumber.replaceAll(/[^\w-]/g, '_')
  const filePath = join(directory, `${safeReference}-${Date.now()}.json`)
  writeFileSync(filePath, JSON.stringify(record, null, 2))
}

/**
 * Whether the raw submitted payloads may be persisted. We only allow it when
 * NODE_ENV is explicitly set to a non-production value. An unset NODE_ENV is
 * treated as production so that a misconfigured environment fails safe and
 * never writes submitted data to a store or the logs.
 * @returns {boolean}
 */
function payloadsMayBePersisted() {
  const env = process.env.NODE_ENV?.toLowerCase()
  if (!env) {
    return false
  }
  return env !== 'production' && env !== 'prod'
}

/**
 * Returns the record with its raw payloads removed when the environment does
 * not permit persisting submitted data. The structural comparison result
 * (`matches`, `rulesError`, etc.) is always retained.
 * @param {ComparisonRecord} record
 * @returns {PersistableRecord}
 */
function redactPayloadsIfRequired(record) {
  if (payloadsMayBePersisted()) {
    return record
  }
  const { legacyPayload, rulesPayload, ...rest } = record
  return { ...rest, payloadsOmitted: true }
}

/**
 * Logs the comparison result as a single `info` line, prefixed with
 * {@link LOG_PREFIX}. Never emits payload data: matches log only the reference
 * number, mismatches log a data-free description of which properties differ.
 * @param {ComparisonRecord} record
 */
function storeToLog(record) {
  const base = {
    referenceNumber: record.referenceNumber,
    mappingId: record.mappingId
  }

  if (record.matches) {
    logger.info(
      base,
      `${LOG_PREFIX} Comparison succeeded for submission ${record.referenceNumber}: legacy and rules payloads match`
    )
    return
  }

  if (record.rulesError) {
    logger.info(
      { ...base, rulesError: record.rulesError },
      `${LOG_PREFIX} Comparison could not be made for submission ${record.referenceNumber}: rules engine failed (${record.rulesError})`
    )
    return
  }

  const differences = describeDifferences(
    record.legacyPayload,
    record.rulesPayload
  )
  const summary = differences
    .map((difference) => `${difference.path}: ${difference.description}`)
    .join('; ')
  logger.info(
    { ...base, differenceCount: differences.length, differences },
    `${LOG_PREFIX} Comparison found ${differences.length} difference(s) for submission ${record.referenceNumber}: ${summary}`
  )
}

/**
 * Persists a dual-run comparison record using the configured backend.
 * Failures are logged but never thrown: by the time a comparison is stored
 * the legacy payload has already been transmitted, so a storage failure must
 * not cause the SQS message to be retried (and re-sent).
 * @param {ComparisonRecord} record
 * @returns {void}
 */
export function storeComparison(record) {
  const { comparisonStore } = /** @type {{ comparisonStore: string }} */ (
    config.get('mappingEngine')
  )

  try {
    if (comparisonStore === 'log') {
      storeToLog(record)
    } else if (comparisonStore === 'file') {
      storeToFile(redactPayloadsIfRequired(record))
    }
  } catch (error) {
    logger.error(
      { err: error, referenceNumber: record.referenceNumber },
      `Failed to store mapping comparison for submission ${record.referenceNumber}`
    )
    return
  }

  // The "log" backend already reports mismatches at info level (and is the
  // single source of truth for its own output); the generic warn would only
  // duplicate it, so it is emitted for the other backends only.
  if (!record.matches && comparisonStore !== 'log') {
    logger.warn(
      { referenceNumber: record.referenceNumber, mappingId: record.mappingId },
      `Mapping comparison MISMATCH for submission ${record.referenceNumber}`
    )
  }
}
