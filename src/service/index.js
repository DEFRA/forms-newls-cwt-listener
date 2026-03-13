import { handleFormSubmissionEvents } from './events.js'
import * as submissionHandlerService from './submission-handler.js'

/**
 * @param {Message[]} messages
 * @returns {Promise<{saved: FormAdapterSubmissionMessage[]; failed: any[]}>}
 */
export async function handleEvent(messages) {
  return handleFormSubmissionEvents(messages, submissionHandlerService)
}

/**
 * @import { Message } from '@aws-sdk/client-sqs'
 * @import { FormAdapterSubmissionMessage } from '@defra/forms-engine-plugin/engine/types.js'
 */
