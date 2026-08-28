import { UserProfile } from '../../plugins/auth/types.js'

declare module '@hapi/hapi' {
  interface AuthCredentials {
    provider: 'azure-oidc'
    query: Record<string, string | string[]>
    token: string
    idToken: string
    refreshToken: string
    expiresIn: number
    flowId: string
    scope?: string[]
  }

  interface UserCredentials {
    /**
     * User ID
     */
    id: UserProfile['sub']

    /**
     * User email address
     */
    email: UserProfile['email']

    /**
     * User display name
     */
    displayName: string

    /**
     * User roles from entitlement API
     */
    roles?: string[]

    /**
     * User scopes from entitlement API
     */
    scopes?: string[]

    /**
     * Session issued time (ISO 8601)
     */
    issuedAt?: string

    /**
     * Session expiry time (ISO 8601)
     */
    expiresAt?: string

    /**
     * Object ID of the user
     */
    oid?: string

    /**
     * Groups of the user
     */
    groups?: string[]
  }
}
