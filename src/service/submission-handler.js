import { createLogger } from '../common/helpers/logging/logger.js'
import { mapFormSubmission as adviceFormSubmissionMapper } from './mappers/advice-form-mapper.js'
import { mapFormSubmission as assentFormSubmissionMapper } from './mappers/assent-form-mapper.js'
import { mapFormSubmission as consentFormSubmissionMapper } from './mappers/consent-form-mapper.js'
import { send } from './transmitters/submission-transmitter.js'
import { config } from '../config.js'

const logger = createLogger()

/**
 * Decides what to do with the forms submission
 * @param {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage} formSubmissionMessage
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

  if (formSubmissionMessage.meta.formId === adviceFormId) {
    logger.info('Handling advice form submission')
    const transformedFormData = adviceFormSubmissionMapper(
      formSubmissionMessage
    )
    await send(transformedFormData)
    logger.info('Handled advice form submission')
  } else if (formSubmissionMessage.meta.formId === assentFormId) {
    logger.info('Handling assent form submission')
    const transformedFormData = assentFormSubmissionMapper(
      formSubmissionMessage
    )
    await send(transformedFormData)
    logger.info('Handled assent form submission')
  } else if (formSubmissionMessage.meta.formId === consentFormId) {
    logger.info('Handling consent form submission')
    const transformedFormData = consentFormSubmissionMapper(
      formSubmissionMessage
    )
    await send(transformedFormData)
    logger.info('Handled consent form submission')
  } else {
    logger.info(
      `Form ID ${formSubmissionMessage.meta.formId} requires no action.`
    )
  }
}
