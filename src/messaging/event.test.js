import { vi, describe, it, expect } from 'vitest'
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient
} from '@aws-sdk/client-sqs'
import { mockClient } from 'aws-sdk-client-mock'
import { toHaveReceivedCommandWith } from 'aws-sdk-client-mock-vitest'

import { deleteEventMessage, receiveEventMessages } from './event.js'

expect.extend({ toHaveReceivedCommandWith })
vi.mock('../common/helpers/logging/logger.js')

describe('event', () => {
  const snsMock = mockClient(SQSClient)
  const messageId = '31cb6fff-8317-412e-8488-308d099034c4'
  const receiptHandle = 'YzAwNzQ3MGMtZGY5Mi0'
  const messageStub = {
    Body: 'hello world',
    MD5OfBody: '9e5729d418a527676ab6807b35c6ffb1',
    MessageId: messageId,
    ReceiptHandle: receiptHandle
  }
  afterEach(() => {
    snsMock.reset()
  })
  describe('receiveEventMessages', () => {
    it('should send messages', async () => {
      const receivedMessage = {
        Messages: [messageStub]
      }
      snsMock.on(ReceiveMessageCommand).resolves(receivedMessage)
      await expect(receiveEventMessages()).resolves.toEqual(receivedMessage)
    })
  })

  describe('deleteEventMessage', () => {
    it('should delete event message', async () => {
      /**
       * @type {DeleteMessageCommandOutput}
       */
      const deleteResult = {
        $metadata: {}
      }

      snsMock.on(DeleteMessageCommand).resolves(deleteResult)
      await deleteEventMessage(messageStub)
      expect(snsMock).toHaveReceivedCommandWith(DeleteMessageCommand, {
        QueueUrl: expect.any(String),
        ReceiptHandle: receiptHandle
      })
    })
  })
})

/**
 * @import { DeleteMessageCommandOutput } from '@aws-sdk/client-sqs'
 */
