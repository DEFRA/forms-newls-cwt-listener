import { formAdapterSubmissionMessagePayloadSchema } from '@defra/forms-engine-plugin/engine/types/schema.js'
import Joi from 'joi'

/**
 * @typedef {import('@aws-sdk/client-sqs').Message} Message
 * @typedef {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessagePayload} FormAdapterSubmissionMessagePayload
 * @typedef {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 */

/**
 * This method maps, validates and de-serialises the SQS message for handling
 * @param {Message} message
 * @returns {FormAdapterSubmissionMessage}
 */
export function mapSubmissionEvent(message) {
  if (!message.MessageId) {
    throw new Error('Unexpected missing Message.MessageId')
  }

  if (!message.Body) {
    throw new Error('Unexpected empty Message.Body')
  }

  /** @type {unknown} */
  const parsed = JSON.parse(message.Body)
  const messageBody = /** @type {FormAdapterSubmissionMessagePayload} */ (
    parsed
  )

  /** @type {unknown} */
  const validated = Joi.attempt(
    messageBody,
    formAdapterSubmissionMessagePayloadSchema,
    {
      abortEarly: false,
      stripUnknown: true
    }
  )
  const value = /** @type {FormAdapterSubmissionMessagePayload} */ (validated)

  return {
    messageId: message.MessageId,
    ...value,
    recordCreatedAt: new Date()
  }
}
