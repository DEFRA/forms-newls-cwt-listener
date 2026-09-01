import { getProxyInfo, describeProxyInfo } from './proxy-info.js'

const PROXY_ENV_KEYS = [
  'NODE_USE_ENV_PROXY',
  'HTTPS_PROXY',
  'https_proxy',
  'HTTP_PROXY',
  'http_proxy',
  'NO_PROXY',
  'no_proxy'
]

describe('getProxyInfo', () => {
  /** @type {Record<string, string | undefined>} */
  let originalEnv = {}

  beforeEach(() => {
    originalEnv = {}
    for (const key of PROXY_ENV_KEYS) {
      originalEnv[key] = process.env[key]
      delete process.env[key]
    }
  })

  afterEach(() => {
    for (const key of PROXY_ENV_KEYS) {
      if (originalEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = originalEnv[key]
      }
    }
  })

  test('reports proxy disabled when no environment variables are set', () => {
    expect(getProxyInfo()).toEqual({
      useEnvProxy: false,
      enabled: false,
      port: null,
      isExpectedHost: 'No',
      exclusionsCount: 0
    })
  })

  test('reports the expected CDP configuration', () => {
    process.env.NODE_USE_ENV_PROXY = '1'
    process.env.HTTPS_PROXY = 'http://localhost:3128'
    process.env.NO_PROXY =
      '.internal.example.com,.s3.example.com,queue.example.com'

    expect(getProxyInfo()).toEqual({
      useEnvProxy: true,
      enabled: true,
      port: 3128,
      isExpectedHost: 'Yes',
      exclusionsCount: 3
    })
  })

  test('is enabled from the proxy URL alone, independently of NODE_USE_ENV_PROXY', () => {
    process.env.HTTPS_PROXY = 'http://localhost:3128'

    const info = getProxyInfo()

    expect(info.useEnvProxy).toBe(false)
    expect(info.enabled).toBe(true)
    expect(info.port).toBe(3128)
  })

  test('is not enabled when NODE_USE_ENV_PROXY is set but no proxy URL is configured', () => {
    process.env.NODE_USE_ENV_PROXY = '1'

    const info = getProxyInfo()

    expect(info.useEnvProxy).toBe(true)
    expect(info.enabled).toBe(false)
    expect(info.port).toBeNull()
  })

  test.each(['0', 'false', '', '  '])(
    'treats NODE_USE_ENV_PROXY=%j as disabled',
    (value) => {
      process.env.NODE_USE_ENV_PROXY = value
      process.env.HTTPS_PROXY = 'http://localhost:3128'

      expect(getProxyInfo().useEnvProxy).toBe(false)
    }
  )

  test('reports a non-local proxy host as not the expected host', () => {
    process.env.NODE_USE_ENV_PROXY = '1'
    process.env.HTTPS_PROXY = 'http://proxy.internal.example.com:3128'

    expect(getProxyInfo().isExpectedHost).toBe('No')
  })

  test.each(['127.0.0.1', 'localhost'])(
    'treats %s as the expected local proxy host',
    (host) => {
      process.env.NODE_USE_ENV_PROXY = '1'
      process.env.HTTPS_PROXY = `http://${host}:3128`

      expect(getProxyInfo().isExpectedHost).toBe('Yes')
    }
  )

  test('defaults to port 443 for an https proxy URL with no explicit port', () => {
    process.env.NODE_USE_ENV_PROXY = '1'
    process.env.HTTPS_PROXY = 'https://localhost'

    expect(getProxyInfo().port).toBe(443)
  })

  test('falls back to HTTP_PROXY when HTTPS_PROXY is not set', () => {
    process.env.NODE_USE_ENV_PROXY = '1'
    process.env.HTTP_PROXY = 'http://localhost:8080'

    expect(getProxyInfo().port).toBe(8080)
  })

  test('ignores blank NO_PROXY entries when counting exclusions', () => {
    process.env.NO_PROXY = 'a.example.com, ,b.example.com,'

    expect(getProxyInfo().exclusionsCount).toBe(2)
  })

  test('treats an invalid proxy URL as no proxy configured', () => {
    process.env.NODE_USE_ENV_PROXY = '1'
    process.env.HTTPS_PROXY = 'not-a-url'

    const info = getProxyInfo()

    expect(info.enabled).toBe(false)
    expect(info.port).toBeNull()
  })

  describe('describeProxyInfo', () => {
    test('formats a non-sensitive single-line summary', () => {
      process.env.NODE_USE_ENV_PROXY = '1'
      process.env.HTTPS_PROXY = 'http://localhost:3128'
      process.env.NO_PROXY = 'a.example.com,b.example.com'

      expect(describeProxyInfo()).toBe(
        'proxy enabled=true, port=3128, expectedHost=Yes, exclusions=2, useEnvProxy=true'
      )
    })

    test('renders the port as n/a when no proxy is configured', () => {
      expect(describeProxyInfo()).toBe(
        'proxy enabled=false, port=n/a, expectedHost=No, exclusions=0, useEnvProxy=false'
      )
    })
  })
})
