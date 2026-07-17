import { createLogger } from '../common/helpers/logging/logger.js'
import { getErrorMessage } from '../common/helpers/error-message.js'
import { resolveDestination } from './rule-mapping/destinations.js'
import { mapWithRules, resolveExpansion } from './rule-mapping/engine.js'
import { findMappingForForm } from './rule-mapping/registry.js'
import {
  DEFAULT_DELIVERY_SUCCESS_MODE,
  DELIVERY_SUCCESS_MODE
} from './rule-mapping/types.js'
import { config } from '../config.js'

const logger = createLogger()

/**
 * The most payloads that may be in flight to the destination at any one time.
 * Caps the fan-out in {@link sendRequiringAny} so a heavily expanded submission
 * cannot open an unbounded number of concurrent requests.
 */
const MAX_SIMULTANEOUS_REQUESTS = 5

/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('./rule-mapping/types.js').MappingDefinition} MappingDefinition
 * @typedef {import('./rule-mapping/types.js').DeliverySuccessMode} DeliverySuccessMode
 * @typedef {(payload: Record<string, unknown>) => Promise<void>} DestinationSender
 */

/**
 * Reads the mapping engine settings, defaulting the mappings directory.
 * @returns {{ mappingsDir: string }}
 */
function getMappingEngineSettings() {
  const settings = /** @type {{ mappingsDir?: string } | undefined} */ (
    config.get('mappingEngine')
  )
  return {
    mappingsDir: settings?.mappingsDir ?? 'mappings'
  }
}

/**
 * Builds the payloads to send for a submission.
 *
 * A mapping with no expansion, or one whose repeater held no usable entries,
 * produces the single base payload it always has. Otherwise each repeater entry
 * contributes an overlay merged over that base, giving one payload per entry.
 * @param {MappingDefinition} mapping
 * @param {FormAdapterSubmissionMessage} message
 * @returns {Array<Record<string, unknown>>}
 */
function buildPayloads(mapping, message) {
  const base = mapWithRules(mapping, message)
  const overlays = resolveExpansion(mapping, message)

  if (!overlays.length) {
    return [base]
  }

  return overlays.map((overlay) => ({ ...base, ...overlay }))
}

/**
 * Sends every payload, requiring all of them to succeed.
 *
 * Stops at the first failure: the message stays on the queue and redelivery
 * re-sends the whole set, so continuing would only add payloads for that
 * redelivery to duplicate.
 * @param {Array<Record<string, unknown>>} payloads
 * @param {DestinationSender} send
 * @returns {Promise<void>}
 */
async function sendRequiringAll(payloads, send) {
  for (const payload of payloads) {
    await send(payload)
  }
}

/**
 * Runs `task` over every item like `Promise.allSettled`, but with no more than
 * `limit` tasks in flight at once. Results are returned in the same order as
 * `items`, regardless of the order in which the tasks settle.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => Promise<void>} task
 * @param {number} limit
 * @returns {Promise<PromiseSettledResult<void>[]>}
 */
async function settleWithLimit(items, task, limit) {
  /** @type {PromiseSettledResult<void>[]} */
  const results = new Array(items.length)
  let next = 0

  async function worker() {
    while (next < items.length) {
      const index = next++
      try {
        results[index] = {
          status: 'fulfilled',
          value: await task(items[index])
        }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    worker()
  )
  await Promise.all(workers)

  return results
}

/**
 * Sends every payload, requiring only one to succeed.
 *
 * Every payload is attempted regardless of earlier failures, since each one
 * that lands is one that will not be retried by anything else. Failures are
 * logged as errors rather than warnings: the message is deleted from the queue
 * once any payload succeeds, so these log lines are the only record that those
 * submissions never reached the destination.
 * @param {Array<Record<string, unknown>>} payloads
 * @param {DestinationSender} send
 * @param {string} referenceNumber
 * @returns {Promise<void>}
 */
async function sendRequiringAny(payloads, send, referenceNumber) {
  const results = await settleWithLimit(
    payloads,
    (payload) => send(payload),
    MAX_SIMULTANEOUS_REQUESTS
  )

  /** @type {PromiseRejectedResult[]} */
  const failed = results.filter((result) => result.status === 'rejected')

  if (!failed.length) {
    return
  }

  if (failed.length === payloads.length) {
    throw new Error(
      `All ${payloads.length} submissions failed for ${referenceNumber}: ${failed
        .map((result) => getErrorMessage(result.reason))
        .join(', ')}`
    )
  }

  const reasons = failed
    .map((result) => getErrorMessage(result.reason))
    .join(', ')

  logger.error(
    `${failed.length} of ${payloads.length} submissions failed for ${referenceNumber} and will not be retried. ` +
      `Reasons: ${reasons}`
  )
}

/**
 * Maps the submission with the rule-based engine and transmits the result to
 * the destination named in the matching mapping file.
 *
 * The mapping file whose `formIds` contains the submission's form id is
 * selected; submissions with no matching mapping require no action. A mapping
 * that declares an `expand` block may send several payloads for one submission;
 * its `deliverySuccessMode` decides how many of them must succeed for the
 * submission to count as handled.
 * @param {FormAdapterSubmissionMessage} formSubmissionMessage
 */
export async function handleFormSubmission(formSubmissionMessage) {
  if (!formSubmissionMessage) {
    logger.warn('Form submission message is required')
    return
  }

  const { mappingsDir } = getMappingEngineSettings()
  const formId = formSubmissionMessage.meta.formId
  const mapping = findMappingForForm(mappingsDir, formId)
  if (!mapping) {
    logger.info(`Form ID ${formId} requires no action.`)
    return
  }

  logger.info(`Handling form submission with mapping "${mapping.id}"`)

  const payloads = buildPayloads(mapping, formSubmissionMessage)
  const sendToDestination = resolveDestination(mapping.destination)
  /** @type {DeliverySuccessMode} */
  const mode =
    mapping.expand?.deliverySuccessMode ?? DEFAULT_DELIVERY_SUCCESS_MODE

  if (payloads.length > 1) {
    logger.info(
      `Mapping "${mapping.id}" expanded submission ${formSubmissionMessage.meta.referenceNumber} ` +
        `into ${payloads.length} payloads (deliverySuccessMode "${mode}")`
    )
  }

  if (mode === DELIVERY_SUCCESS_MODE.ANY) {
    await sendRequiringAny(
      payloads,
      sendToDestination,
      formSubmissionMessage.meta.referenceNumber
    )
  } else {
    await sendRequiringAll(payloads, sendToDestination)
  }

  logger.info(`Handled form submission with mapping "${mapping.id}"`)
}
