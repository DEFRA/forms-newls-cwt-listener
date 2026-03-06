import {
  receiveEventMessages,
  receiveMessageTimeout
} from '../messaging/event.js'
import { buildFormAdapterSubmissionMessage } from '../service/__stubs__/event-builders.js'
import { handleEvent } from '../service/index.js'
import { runTask, runTaskOnce } from './receive-messages.js'
vi.mock('../messaging/event.js')
vi.mock('../service/index.js')

describe('receive-messages', () => {
  const message = /** @type {Message} */ ({
    MessageId: 'ea9c724f-2292-4ccd-93b2-86653dca9de2',
    ReceiptHandle: 'ReceiptHandleXFES',
    MD5OfBody: 'adflkjasdJLIm',
    Body: 'hello world',
    MessageAttributes: {}
  })

  /**
   * @returns {void}
   */
  function voidFn() {}

  describe('runTaskOnce', () => {
    it('should save and delete new messages', async () => {
      const receivedMessageResult = /** @type {ReceiveMessageResult} */ ({
        Messages: [message]
      })
      const submissionEventResult = {
        failed: [],
        saved: [buildFormAdapterSubmissionMessage()]
      }
      vi.mocked(receiveEventMessages).mockResolvedValueOnce(
        receivedMessageResult
      )
      vi.mocked(handleEvent).mockResolvedValueOnce(submissionEventResult)
      await runTaskOnce()
      expect(handleEvent).toHaveBeenCalledWith([message])
    })

    it('should handle undefined messages', async () => {
      vi.mocked(receiveEventMessages).mockResolvedValueOnce({})
      await runTaskOnce()
      expect(handleEvent).not.toHaveBeenCalled()
    })
  })

  describe('runTask', () => {
    it('should keep running', async () => {
      const setTimeoutSpy = vi
        .spyOn(global, 'setTimeout')
        // @ts-expect-error - mocking timeout with void
        .mockImplementation(voidFn)

      vi.mocked(receiveEventMessages).mockResolvedValueOnce({
        Messages: []
      })
      vi.mocked(handleEvent).mockResolvedValueOnce({
        failed: [],
        saved: []
      })
      await runTask()
      expect(setTimeoutSpy).toHaveBeenCalledWith(runTask, receiveMessageTimeout)
    })

    it('should fail gracefully if runTaskOnce errors', async () => {
      const setTimeoutSpy = vi
        .spyOn(global, 'setTimeout')
        // @ts-expect-error - mocking timeout with void
        .mockImplementation(voidFn)
      vi.mocked(receiveEventMessages).mockRejectedValue(new Error('any error'))
      await runTask()
      expect(setTimeoutSpy).toHaveBeenCalledWith(runTask, receiveMessageTimeout)
    })
  })
})

/**
 * @import { ReceiveMessageResult, Message } from '@aws-sdk/client-sqs'
 */
