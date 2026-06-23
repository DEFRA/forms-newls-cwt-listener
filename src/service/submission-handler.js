import { isDeepStrictEqual } from 'node:util'

import { createLogger } from '../common/helpers/logging/logger.js'
import { mapFormSubmission as adviceFormSubmissionMapper } from './mappers/advice-form-mapper.js'
import { mapFormSubmission as assentFormSubmissionMapper } from './mappers/assent-form-mapper.js'
import { mapFormSubmission as consentFormSubmissionMapper } from './mappers/consent-form-mapper.js'
import { send } from './transmitters/submission-transmitter.js'
import { storeComparison } from './rule-mapping/comparison-store.js'
import { resolveDestination } from './rule-mapping/destinations.js'
import { mapWithRules } from './rule-mapping/engine.js'
import { findMappingForForm } from './rule-mapping/registry.js'
import { config } from '../config.js'

const logger = createLogger()

/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 */

/**
 * Finds the legacy hardcoded mapper for a form id, if one exists.
 * @param {string} formId
 * @returns {{ formName: string, map: (message: FormAdapterSubmissionMessage) => import('./mappers/types.js').TransmittableFormOutput } | undefined}
 */
function getLegacyMapper(formId) {
  const { adviceFormId, assentFormId, consentFormId } =
    /** @type {{ adviceFormId: string, assentFormId: string, consentFormId: string }} */ (
      config.get()
    )

  if (formId === adviceFormId) {
    return { formName: 'advice', map: adviceFormSubmissionMapper }
  }
  if (formId === assentFormId) {
    return { formName: 'assent', map: assentFormSubmissionMapper }
  }
  if (formId === consentFormId) {
    return { formName: 'consent', map: consentFormSubmissionMapper }
  }
  return undefined
}

/**
 * Reads the mapping engine settings, defaulting to legacy-only behaviour.
 * @returns {{ mode: 'legacy' | 'rules' | 'both', mappingsDir: string }}
 */
function getMappingEngineSettings() {
  const settings =
    /** @type {{ mode?: 'legacy' | 'rules' | 'both', mappingsDir?: string } | undefined} */ (
      config.get('mappingEngine')
    )
  return {
    mode: settings?.mode ?? 'legacy',
    mappingsDir: settings?.mappingsDir ?? 'mappings'
  }
}

/**
 * Original behaviour: map with the legacy hardcoded mapper and transmit.
 * @param {FormAdapterSubmissionMessage} message
 * @returns {Promise<void>}
 */
async function handleWithLegacy(message) {
  const legacyMapper = getLegacyMapper(message.meta.formId)
  if (!legacyMapper) {
    logger.info(`Form ID ${message.meta.formId} requires no action.`)
    return
  }

  logger.info(`Handling ${legacyMapper.formName} form submission`)
  const transformedFormData = legacyMapper.map(message)
  await send(transformedFormData)
  logger.info(`Handled ${legacyMapper.formName} form submission`)
}

/**
 * Rules-only behaviour: map with the rule-based engine and transmit to the
 * destination named in the mapping file.
 * @param {FormAdapterSubmissionMessage} message
 * @param {string} mappingsDir
 * @returns {Promise<void>}
 */
async function handleWithRules(message, mappingsDir) {
  const mapping = findMappingForForm(mappingsDir, message.meta.formId)
  if (!mapping) {
    logger.info(`Form ID ${message.meta.formId} requires no action.`)
    return
  }

  logger.info(`Handling form submission with mapping "${mapping.id}"`)
  const payload = mapWithRules(mapping, message)
  const sendToDestination = resolveDestination(mapping.destination)
  await sendToDestination(payload)
  logger.info(`Handled form submission with mapping "${mapping.id}"`)
}

/**
 * Dual-run behaviour: the legacy payload is authoritative and is transmitted,
 * while both payloads are persisted for later comparison. A rules-engine
 * failure is recorded but never blocks the legacy transmission.
 * @param {FormAdapterSubmissionMessage} message
 * @param {string} mappingsDir
 * @returns {Promise<void>}
 */
async function handleWithBoth(message, mappingsDir) {
  const formId = message.meta.formId
  const legacyMapper = getLegacyMapper(formId)
  if (!legacyMapper) {
    logger.info(`Form ID ${formId} requires no action.`)
    return
  }

  logger.info(`Handling ${legacyMapper.formName} form submission (dual-run)`)
  const legacyPayload = legacyMapper.map(message)

  /** @type {Record<string, unknown> | null} */
  let rulesPayload = null
  /** @type {string | undefined} */
  let rulesError
  /** @type {import('./rule-mapping/types.js').MappingDefinition | undefined} */
  let mapping
  try {
    mapping = findMappingForForm(mappingsDir, formId)
    if (!mapping) {
      throw new Error(`No mapping definition found for form id ${formId}`)
    }
    rulesPayload = mapWithRules(mapping, message)
  } catch (error) {
    rulesError = error instanceof Error ? error.message : String(error)
    logger.error(
      { err: error, referenceNumber: message.meta.referenceNumber },
      `Rules engine failed for submission ${message.meta.referenceNumber}; legacy payload is unaffected`
    )
  }

  await send(legacyPayload)

  // JSON round-trip normalises both payloads (drops undefined-valued keys)
  // so the comparison reflects what would actually be transmitted.
  const matches =
    rulesPayload !== null &&
    isDeepStrictEqual(
      JSON.parse(JSON.stringify(legacyPayload)),
      JSON.parse(JSON.stringify(rulesPayload))
    )

  storeComparison({
    mappingId: mapping?.id ?? 'unknown',
    formId,
    referenceNumber: message.meta.referenceNumber,
    timestamp: new Date().toISOString(),
    matches,
    legacyPayload,
    rulesPayload,
    rulesError
  })

  logger.info(`Handled ${legacyMapper.formName} form submission (dual-run)`)
}

/**
 * Decides what to do with the forms submission.
 *
 * The MAPPING_ENGINE_MODE config selects the implementation:
 * - "legacy" (default): the original hardcoded mappers
 * - "rules": the rule-based mapping engine driven by the JSON mapping files
 * - "both": legacy payload is transmitted, both payloads are stored for comparison
 * @param {FormAdapterSubmissionMessage} formSubmissionMessage
 */
export async function handleFormSubmission(formSubmissionMessage) {
  const { adviceFormId, assentFormId, consentFormId } =
    /** @type {{ adviceFormId: string, assentFormId: string, consentFormId: string }} */ (
      config.get()
    )

  if (!adviceFormId || !assentFormId || !consentFormId) {
    throw new Error('Form IDs are required')
  }
  if (!formSubmissionMessage) {
    logger.warn('Form submission message is required')
    return
  }

  const { mode, mappingsDir } = getMappingEngineSettings()

  if (mode === 'rules') {
    await handleWithRules(formSubmissionMessage, mappingsDir)
    return
  }
  if (mode === 'both') {
    await handleWithBoth(formSubmissionMessage, mappingsDir)
    return
  }
  await handleWithLegacy(formSubmissionMessage)
}
