import { createLogger } from '../common/helpers/logging/logger.js'
import { getFormDefinition } from '../lib/manager.js'
import { formatter } from './mappers/formatters/example/example-formatter.js'

const logger = createLogger()

/**
 *
 * @param {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage} formSubmissionMessage
 */
export async function handleFormSubmission(formSubmissionMessage) {
  /**
   * We need to get the form definition from the FormsManager in order to build the Form model
   * @type {import('@defra/forms-model').FormDefinition}
   */
  const formDefinition = await getFormDefinition(
    formSubmissionMessage.meta.formId,
    formSubmissionMessage.meta.status,
    formSubmissionMessage.meta.versionMetadata?.versionNumber
  )
  const output = formatter(formSubmissionMessage, formDefinition)

  logger.info(output)
}
