import { formAdapterSubmissionMessagePayloadSchema } from '@defra/forms-engine-plugin/engine/types/schema.js'
import Joi from 'joi'

import { getErrorMessage } from '../common/helpers/error-message.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { deleteEventMessage } from '../messaging/event.js'

const logger = createLogger()

/**
 * @typedef {import('@aws-sdk/client-sqs').Message} Message
 * @typedef {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessagePayload} FormAdapterSubmissionMessagePayload
 * @typedef {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionService} FormAdapterSubmissionService
 */

/**
 * @param {Message} message
 * @returns {FormAdapterSubmissionMessage}
 */
export function mapFormAdapterSubmissionEvent(message) {
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

/**
 * Handle the form submission event and delete it once it's successfully handled
 * @template T
 * @param {Message[]} messages
 * @param {T & FormAdapterSubmissionService} formSubmissionService
 * @returns {Promise<{ saved: FormAdapterSubmissionMessage[]; failed: unknown[] }>}
 */
export async function handleFormSubmissionEvents(
  messages,
  formSubmissionService
) {
  logger.info('Handling form submission events')
  /**
   * @param {Message} message
   * @returns {Promise<FormAdapterSubmissionMessage>}
   */
  async function handleSingleSubmissionEvent(message) {
    try {
      const submissionBody = mapFormAdapterSubmissionEvent(message)

      await formSubmissionService.handleFormSubmission(submissionBody)

      logger.info(`Deleting ${message.MessageId}`)

      await deleteEventMessage(message)

      logger.info(`Deleted ${message.MessageId}`)

      return submissionBody
    } catch (err) {
      logger.error(
        err,
        `[handleFormSubmissionEvents] Failed to handle message - ${getErrorMessage(err)}`
      )
      throw err
    }
  }

  const results = await Promise.allSettled(
    messages.map(handleSingleSubmissionEvent)
  )

  const saved = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)
  const savedMessage = saved.map((item) => item.meta.referenceNumber).join(',')

  logger.info(`Handled form submission event: ${savedMessage}`)

  /** @type {unknown[]} */
  const failed = results
    .filter((result) => result.status === 'rejected')
    .map(
      (result) =>
        /** @type {unknown} */ (
          /** @type {PromiseRejectedResult} */ (result).reason
        )
    )

  if (failed.length) {
    const failedMessage = failed.map((item) => getErrorMessage(item)).join(',')

    logger.info(`Failed to handle form submission event: ${failedMessage}`)
  }

  return { saved, failed }
}
