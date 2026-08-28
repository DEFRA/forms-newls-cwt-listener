const { mockActualTestErrorFn, mockActualTestWarnFn, mockActualTestInfoFn } =
  vi.hoisted(() => ({
    mockActualTestErrorFn: vi.fn(),
    mockActualTestWarnFn: vi.fn(),
    mockActualTestInfoFn: vi.fn()
  }))

vi.mock('../../common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    error: mockActualTestErrorFn,
    warn: mockActualTestWarnFn,
    info: mockActualTestInfoFn
  })
}))

vi.mock('../../config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'oidcJwksUri') return 'mock-jwks-uri'
      if (key === 'oidcVerifyAud') return 'mock-aud'
      if (key === 'oidcVerifyIss') return 'mock-iss'
      return 'mock-value'
    })
  }
}))

vi.mock('../../service/entitlements/service.js', () => ({
  getUserScopes: vi.fn(() =>
    Promise.resolve(['form-delete', 'form-edit', 'form-read'])
  )
}))

vi.mock('@hapi/jwt')

describe('auth plugin', () => {
  /** @type {AuthModule} */
  let authModule
  /** @type {Auth} */
  let auth
  /** @type {ValidateFn} */
  let validateFn
  /** @type {Jwt} */
  let Jwt

  const server = {
    register: vi.fn().mockResolvedValue(undefined),
    auth: {
      strategy: vi.fn(),
      default: vi.fn()
    }
  }

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    const jwtModule = await import('@hapi/jwt')
    Jwt = /** @type {Jwt} */ (jwtModule.default)

    authModule = await import('./index.js')

    auth = authModule.auth
  })

  test('should register the JWT plugin', async () => {
    await auth.plugin.register(/** @type {any} */ (server))
    expect(server.register).toHaveBeenCalledWith(Jwt)
  })

  test('should set up the auth strategy', async () => {
    await auth.plugin.register(/** @type {any} */ (server))
    expect(server.auth.strategy).toHaveBeenCalledWith(
      'azure-oidc-token',
      'jwt',
      expect.objectContaining({
        keys: expect.any(Object),
        verify: expect.any(Object),
        validate: expect.any(Function)
      })
    )
  })

  test('should set the default auth strategy', async () => {
    await auth.plugin.register(/** @type {any} */ (server))
    expect(server.auth.default).toHaveBeenCalledWith('azure-oidc-token')
  })

  describe('validate function', () => {
    beforeEach(async () => {
      await auth.plugin.register(/** @type {any} */ (server))
      if (server.auth.strategy.mock.calls.length > 0) {
        const strategyOptions = /** @type {{ validate: ValidateFn }} */ (
          server.auth.strategy.mock.calls[
            server.auth.strategy.mock.calls.length - 1
          ][2]
        )
        validateFn = strategyOptions.validate
      } else {
        validateFn = () => Promise.resolve({ isValid: false })
      }
    })

    test('should return isValid: false when user is missing from payload', async () => {
      const artifacts = /** @type {any} */ ({
        decoded: {
          payload: null
        }
      })
      const result = await validateFn(artifacts)
      expect(result).toEqual({ isValid: false })
      expect(mockActualTestInfoFn).toHaveBeenCalledWith(
        '[authMissingUser] Auth: Missing user from token payload.'
      )
    })

    test('should return isValid: false when oid is missing', async () => {
      const artifacts = /** @type {any} */ ({
        decoded: {
          payload: {
            groups: ['some-group']
          }
        }
      })
      const result = await validateFn(artifacts)
      expect(result).toEqual({ isValid: false })
      expect(mockActualTestInfoFn).toHaveBeenCalledWith(
        '[authMissingOID] Auth: User OID is missing in token payload.'
      )
    })

    test('should handle string groups claim that is valid JSON array', async () => {
      const artifacts = /** @type {any} */ ({
        decoded: {
          payload: {
            oid: 'test-oid'
          }
        }
      })
      const result = await validateFn(artifacts)
      expect(result).toEqual({
        isValid: true,
        credentials: {
          user: {
            oid: 'test-oid'
          },
          scope: ['form-delete', 'form-edit', 'form-read']
        }
      })
    })
  })

  describe('validate function with entitlements API enabled', () => {
    /** @type {ValidateFn} */
    let validateFn
    /** @type {import('vitest').MockedFunction<(oid: string, authToken?: string) => Promise<string[]>>} */
    let getUserScopes

    beforeEach(async () => {
      vi.resetModules()
      vi.clearAllMocks()

      vi.doMock('../../config.js', () => ({
        config: {
          get: vi.fn((key) => {
            if (key === 'oidcJwksUri') return 'mock-jwks-uri'
            if (key === 'oidcVerifyAud') return 'mock-aud'
            if (key === 'oidcVerifyIss') return 'mock-iss'
            return 'mock-value'
          })
        }
      }))

      const entitlementsModule =
        await import('../../service/entitlements/service.js')
      getUserScopes =
        /** @type {import('vitest').MockedFunction<(oid: string, authToken?: string) => Promise<string[]>>} */ (
          entitlementsModule.getUserScopes
        )

      const authModule = await import('./index.js')
      const auth = authModule.auth

      await auth.plugin.register(/** @type {any} */ (server))

      if (server.auth.strategy.mock.calls.length > 0) {
        const strategyOptions = /** @type {{ validate: ValidateFn }} */ (
          server.auth.strategy.mock.calls[
            server.auth.strategy.mock.calls.length - 1
          ][2]
        )
        validateFn = strategyOptions.validate
      } else {
        validateFn = () => Promise.resolve({ isValid: false })
      }
    })

    test('should use getUserScopes', async () => {
      const artifacts = /** @type {any} */ ({
        decoded: {
          payload: {
            oid: 'test-oid',
            groups: ['editor-group-id']
          }
        },
        token: 'test-jwt-token'
      })

      const result = await validateFn(artifacts)

      expect(getUserScopes).toHaveBeenCalledWith('test-oid', 'test-jwt-token')
      expect(result).toEqual({
        isValid: true,
        credentials: {
          user: {
            oid: 'test-oid',
            groups: ['editor-group-id']
          },
          scope: ['form-delete', 'form-edit', 'form-read']
        }
      })
    })

    test('should pass undefined token when artifacts.token is missing', async () => {
      const artifacts = /** @type {any} */ ({
        decoded: {
          payload: {
            oid: 'test-oid',
            groups: ['editor-group-id']
          }
        }
        // No token property
      })

      const result = await validateFn(artifacts)

      expect(getUserScopes).toHaveBeenCalledWith('test-oid', undefined)
      expect(result).toEqual({
        isValid: true,
        credentials: {
          user: {
            oid: 'test-oid',
            groups: ['editor-group-id']
          },
          scope: ['form-delete', 'form-edit', 'form-read']
        }
      })
    })

    test('should handle empty scopes from getUserScopes', async () => {
      getUserScopes.mockResolvedValueOnce([])

      const artifacts = /** @type {any} */ ({
        decoded: {
          payload: {
            oid: 'test-oid',
            groups: ['editor-group-id']
          }
        },
        token: 'test-jwt-token'
      })

      const result = await validateFn(artifacts)

      expect(getUserScopes).toHaveBeenCalledWith('test-oid', 'test-jwt-token')
      expect(result).toEqual({
        isValid: true,
        credentials: {
          user: {
            oid: 'test-oid',
            groups: ['editor-group-id']
          },
          scope: []
        }
      })
    })

    test('should handle getUserScopes rejection', async () => {
      getUserScopes.mockRejectedValueOnce(new Error('API Error'))

      const artifacts = /** @type {any} */ ({
        decoded: {
          payload: {
            oid: 'test-oid',
            groups: ['editor-group-id']
          }
        },
        token: 'test-jwt-token'
      })

      await expect(validateFn(artifacts)).rejects.toThrow('API Error')
      expect(getUserScopes).toHaveBeenCalledWith('test-oid', 'test-jwt-token')
    })
  })
})

/**
 * @typedef {typeof AuthModuleDefinitionStar} AuthModule
 */
/**
 * @typedef {AuthTypeDefinition} Auth
 */
/**
 * @typedef {(artifacts: Artifacts<UserCredentials>) => Promise<{ isValid: boolean, credentials?: any }>} ValidateFn
 */
/**
 * @typedef {import('vitest').Mocked<JwtTypeDefinition>} Jwt
 */

/**
 * @import { UserCredentials } from '@hapi/hapi'
 * @import { Artifacts } from './types.js'
 * @import * as AuthModuleDefinitionStar from './index.js'
 * @import { auth as AuthTypeDefinition } from './index.js'
 * @import { default as JwtTypeDefinition } from '@hapi/jwt'
 */
