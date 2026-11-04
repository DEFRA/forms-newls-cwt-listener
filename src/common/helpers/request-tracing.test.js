import {
  REFERENCE_NUMBER_HEADER,
  SESSION_ID_HEADER,
  createLogContext,
  getCorrelationId,
  getReferenceNumber,
  getSessionId,
  getUserId,
  runWithLogContext
} from '@defra/forms-common'
import { getTraceId } from '@defra/hapi-tracing'
import hapi from '@hapi/hapi'

import {
  applyLogContextHeaders,
  applyTraceHeaders,
  getRequestUserId,
  requestTracing
} from './request-tracing.js'

describe('request-tracing', () => {
  const tracingHeader = 'x-cdp-request-id'
  const correlationId = '1066e8cc-8e1e-4671-8ad7-b4cd9c95bb94'
  const userId = '86758ba9-92e7-4287-9751-7705e449f0a5'
  const sessionId = 'c3a2e5f4-2b8e-4e1f-9a8d-3f6b7c1d2e9a'
  const referenceNumber = 'ABC-123-DEF'

  describe('plugin', () => {
    /** @type {Server} */
    let server

    /** @type {{ correlationId?: string, userId?: string }} */
    let responseContext

    beforeEach(async () => {
      server = hapi.server()
      responseContext = {}

      server.auth.scheme('test', () => ({
        authenticate(request, h) {
          return h.authenticated({
            credentials: /** @type {AuthCredentials} */ (
              /** @type {unknown} */ ({ user: { oid: userId } })
            )
          })
        }
      }))
      server.auth.strategy('test', 'test')

      await server.register(requestTracing)

      const handler = () => ({
        correlationId: getCorrelationId(),
        traceId: getTraceId(),
        userId: getUserId(),
        sessionId: getSessionId(),
        referenceNumber: getReferenceNumber()
      })

      server.route([
        { method: 'GET', path: '/open', handler },
        {
          method: 'GET',
          path: '/secure',
          handler,
          options: { auth: 'test' }
        }
      ])

      // The response log is written when this event is emitted
      server.events.on('response', () => {
        responseContext = {
          correlationId: getCorrelationId(),
          userId: getUserId()
        }
      })
    })

    afterEach(async () => {
      await server.stop()
    })

    it('should use the correlation ID from the tracing header', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/open',
        headers: { [tracingHeader]: correlationId }
      })

      expect(result).toEqual({
        correlationId,
        traceId: correlationId,
        userId: undefined,
        sessionId: undefined,
        referenceNumber: undefined
      })
      expect(responseContext).toEqual({ correlationId, userId: undefined })
    })

    it('should add the ID of the authenticated user', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/secure',
        headers: { [tracingHeader]: correlationId }
      })

      expect(result).toEqual({
        correlationId,
        traceId: correlationId,
        userId,
        sessionId: undefined,
        referenceNumber: undefined
      })
      expect(responseContext).toEqual({ correlationId, userId })
    })

    it('should read the session ID and reference number headers', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/open',
        headers: {
          [tracingHeader]: correlationId,
          [SESSION_ID_HEADER]: sessionId,
          [REFERENCE_NUMBER_HEADER]: referenceNumber
        }
      })

      expect(result).toEqual({
        correlationId,
        traceId: correlationId,
        userId: undefined,
        sessionId,
        referenceNumber
      })
    })
  })

  describe('getRequestUserId', () => {
    /**
     * @param {object} auth
     */
    function buildRequest(auth) {
      return /** @type {Request} */ (/** @type {unknown} */ ({ auth }))
    }

    it('should return the oid of the user', () => {
      const request = buildRequest({
        isAuthenticated: true,
        credentials: { user: { oid: userId } }
      })

      expect(getRequestUserId(request)).toBe(userId)
    })

    it('should return undefined when the user has no oid', () => {
      const request = buildRequest({
        isAuthenticated: true,
        credentials: { user: {} }
      })

      expect(getRequestUserId(request)).toBeUndefined()
    })

    it('should return undefined when the request is not authenticated', () => {
      const request = buildRequest({
        isAuthenticated: false,
        credentials: { user: { oid: userId } }
      })

      expect(getRequestUserId(request)).toBeUndefined()
    })
  })

  describe('applyTraceHeaders', () => {
    it('should return the headers unchanged outside of a log context', () => {
      const headers = { accept: 'application/json' }

      expect(applyTraceHeaders(headers)).toBe(headers)
      expect(applyTraceHeaders(undefined)).toBeUndefined()
    })

    it('should add the tracing header', () => {
      runWithLogContext(createLogContext({ correlationId }), () => {
        expect(applyTraceHeaders({ accept: 'application/json' })).toEqual({
          accept: 'application/json',
          [tracingHeader]: correlationId
        })
        expect(applyTraceHeaders(undefined)).toEqual({
          [tracingHeader]: correlationId
        })
      })
    })
  })

  describe('applyLogContextHeaders', () => {
    const headers = { accept: 'application/json' }
    const context = createLogContext({
      correlationId,
      sessionId,
      referenceNumber
    })

    it.each([
      'http://localhost:3001/forms/123',
      'https://entitlement-dummy.local/users/123'
    ])('should add the log context headers for forms service %s', (url) => {
      runWithLogContext(context, () => {
        expect(applyLogContextHeaders(new URL(url), headers)).toEqual({
          accept: 'application/json',
          [SESSION_ID_HEADER]: sessionId,
          [REFERENCE_NUMBER_HEADER]: referenceNumber
        })
      })
    })

    it('should return the headers unchanged for a service outside forms', () => {
      runWithLogContext(context, () => {
        expect(
          applyLogContextHeaders(
            new URL('https://cwt.example.com/api'),
            headers
          )
        ).toBe(headers)
      })
    })
  })
})

/**
 * @import { AuthCredentials, Request, Server } from '@hapi/hapi'
 */
