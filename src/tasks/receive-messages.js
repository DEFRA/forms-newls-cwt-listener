import { getErrorMessage } from '../common/helpers/error-message.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import {
  receiveEventMessages,
  receiveMessageTimeout
} from '../messaging/event.js'
import { handleEvent } from '../service/index.js'

const logger = createLogger()

/**
 * @returns {Promise<void>}
 */
export async function runTaskOnce() {
  logger.info('Receiving queue messages')

  try {
    const result = await receiveEventMessages()
    const messages = result.Messages
    const messageCount = messages ? messages.length : 0

    logger.info(`Received ${messageCount} queue messages`)

    if (messages && messageCount) {
      logger.info('Handling form submission events')

      await handleEvent(messages)

      logger.info(`Handled form submission event`)
    }

    // If using max number of messages call again
    if (messageCount > 9) {
      await runTaskOnce()
    }
  } catch (err) {
    logger.error(
      err,
      `[runTaskOnce] Receive messages task failed - ${getErrorMessage(err)}`
    )
  }
}

/**
 * Task to poll for messages and store the result in the DB
 * @returns {Promise<void>}
 */
export async function runTask() {
  await runTaskOnce()

  logger.info(`Adding task to stack in ${receiveMessageTimeout} milliseconds`)

  setTimeout(runTask, receiveMessageTimeout)

  logger.info(`Added task to stack`)
}
