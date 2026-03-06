import { FormAdapterSubmissionSchemaVersion } from '@defra/forms-engine-plugin/engine/types/enums.js'

import {
  buildFormAdapterSubmissionMessageData,
  buildFormAdapterSubmissionMessageMetaSerialised,
  buildFormAdapterSubmissionMessagePayloadStub,
  buildFormAdapterSubmissionMessageResult,
  buildMessageStub
} from '../__stubs__/event-builders.js'
import { mapSubmissionEvent } from './submission.js'

/**
 * @typedef {import('@aws-sdk/client-sqs').Message} Message
 * @typedef {import('@defra/forms-engine-plugin/engine/types.js').FormAdapterSubmissionMessagePayload} FormAdapterSubmissionMessagePayload
 */

describe('events', () => {
  const formSubmissionMetaBase = {
    referenceNumber: '576-225-943',
    formName: 'Order a pizza',
    formId: '68a8b0449ab460290c28940a',
    formSlug: 'order-a-pizza',
    status: 'live',
    isPreview: false,
    notificationEmail: 'info@example.com'
  }
  const formAdapterSubmission = {
    meta: buildFormAdapterSubmissionMessageMetaSerialised({
      ...formSubmissionMetaBase,
      schemaVersion: 1,
      timestamp: '2025-08-22T18:15:10.785Z'
    }),
    data: buildFormAdapterSubmissionMessageData({
      main: {
        QMwMir: 'Roman Pizza',
        duOEvZ: 'Small',
        DzEODf: ['Mozzarella'],
        juiCfC: ['Pepperoni', 'Sausage', 'Onions', 'Basil'],
        YEpypP: 'None',
        JumNVc: 'Joe Bloggs',
        ALNehP: '+441234567890',
        vAqTmg: {
          addressLine1: '1 Anywhere Street',
          town: 'Anywhereville',
          postcode: 'AN1 2WH'
        },
        IbXVGY: {
          day: 22,
          month: 8,
          year: 2025
        },
        HGBWLt: ['Garlic sauce']
      },
      repeaters: {},
      files: {}
    }),
    result: buildFormAdapterSubmissionMessageResult()
  }

  describe('mapSubmissionEvents', () => {
    /**
     * @type {Message}
     */
    const auditEventMessage = buildMessageStub(formAdapterSubmission)

    it('should map the message', () => {
      const expectedEvent = buildFormAdapterSubmissionMessagePayloadStub({
        data: formAdapterSubmission.data,
        meta: {
          ...formSubmissionMetaBase,
          schemaVersion: FormAdapterSubmissionSchemaVersion.V1,
          timestamp: new Date('2025-08-22T18:15:10.785Z')
        }
      })
      expect(mapSubmissionEvent(auditEventMessage)).toEqual({
        ...expectedEvent,
        recordCreatedAt: expect.any(Date),
        messageId: 'fbafb17e-86f0-4ac6-b864-3f32cd60b228'
      })
    })

    it('should allow unknown fields the message', () => {
      const event = mapSubmissionEvent({
        ...auditEventMessage,
        // @ts-expect-error - unknown field
        unknownField: 'visible'
      })
      // @ts-expect-error - unknown field
      expect(event.unknownField).toBeUndefined()
    })

    it('should fail if there is no MessageId', () => {
      const { MessageId, ...auditEventMessageWithoutMessageId } =
        auditEventMessage

      expect(() =>
        mapSubmissionEvent(auditEventMessageWithoutMessageId)
      ).toThrow(new Error('Unexpected missing Message.MessageId'))
    })

    it('should fail if there is no Body', () => {
      const { Body, ...auditEventMessageWithoutBody } = auditEventMessage

      expect(() => mapSubmissionEvent(auditEventMessageWithoutBody)).toThrow(
        new Error('Unexpected empty Message.Body')
      )
    })

    it('should fail if the message is invalid', () => {
      const auditEventMessage = buildMessageStub({
        meta: buildFormAdapterSubmissionMessageMetaSerialised({
          formId: undefined
        }),
        data: buildFormAdapterSubmissionMessageData(),
        result: buildFormAdapterSubmissionMessageResult()
      })

      expect(() => mapSubmissionEvent(auditEventMessage)).toThrow(
        '"meta.formId" is required'
      )
    })
  })
})
