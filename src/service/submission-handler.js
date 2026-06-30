import { createLogger } from '../common/helpers/logging/logger.js'
import { resolveDestination } from './rule-mapping/destinations.js'
import { mapWithRules } from './rule-mapping/engine.js'
import { findMappingForForm } from './rule-mapping/registry.js'
import { config } from '../config.js'

const logger = createLogger()

/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
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
 * Maps the submission with the rule-based engine and transmits the result to
 * the destination named in the matching mapping file.
 *
 * The mapping file whose `formIds` contains the submission's form id is
 * selected; submissions with no matching mapping require no action.
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
  const payload = mapWithRules(mapping, formSubmissionMessage)
  const sendToDestination = resolveDestination(mapping.destination)
  await sendToDestination(payload)
  logger.info(`Handled form submission with mapping "${mapping.id}"`)
}
