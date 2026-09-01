/**
 * Outbound traffic leaves via the proxy described by the standard HTTPS_PROXY /
 * HTTP_PROXY / NO_PROXY environment variables. Wreck reaches it through the
 * proxy agent assigned in server.js, and Node's built-in `fetch` reaches it
 * when NODE_USE_ENV_PROXY is enabled.
 *
 * These helpers produce a non-sensitive summary of that configuration so it can
 * be logged at startup and before remote calls, without exposing the proxy
 * host, any credentials, or the individual exclusion entries.
 */

/** Hosts we expect the CDP proxy to be reachable on (i.e. the local sidecar). */
const EXPECTED_PROXY_HOSTS = ['localhost', '127.0.0.1', '::1']

const DEFAULT_HTTP_PORT = 80
const DEFAULT_HTTPS_PORT = 443

/**
 * Interprets a proxy "flag" environment variable (e.g. NODE_USE_ENV_PROXY)
 * as a boolean. Treats unset, empty, "0" and "false" as disabled.
 * @param {string | undefined} value
 * @returns {boolean}
 */
function isTruthyFlag(value) {
  if (!value) {
    return false
  }

  const normalised = value.trim().toLowerCase()

  return normalised !== '' && normalised !== '0' && normalised !== 'false'
}

/**
 * Parses a proxy URL into its non-sensitive parts. Returns null if the value is
 * missing or not a valid URL.
 * @param {string | undefined} proxyUrl
 * @returns {{ host: string, port: number } | null}
 */
function parseProxyUrl(proxyUrl) {
  if (!proxyUrl) {
    return null
  }

  try {
    const url = new URL(proxyUrl)
    const defaultPort =
      url.protocol === 'https:' ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT

    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : defaultPort
    }
  } catch {
    return null
  }
}

/**
 * @typedef {object} ProxyInfo
 * @property {boolean} useEnvProxy - Whether NODE_USE_ENV_PROXY is enabled
 * @property {boolean} enabled - Whether a proxy URL is configured, so Wreck
 *   routes outbound requests through it
 * @property {number | null} port - The proxy port, or null if not configured
 * @property {'Yes' | 'No'} isExpectedHost - Whether the proxy host is the
 *   expected local host (i.e. localhost / loopback)
 * @property {number} exclusionsCount - The number of NO_PROXY exclusion entries
 */

/**
 * Builds a non-sensitive summary of the outbound proxy configuration.
 * @returns {ProxyInfo}
 */
export function getProxyInfo() {
  const useEnvProxy = isTruthyFlag(process.env.NODE_USE_ENV_PROXY)

  const proxy = parseProxyUrl(
    process.env.HTTPS_PROXY ??
      process.env.https_proxy ??
      process.env.HTTP_PROXY ??
      process.env.http_proxy
  )

  const exclusions = (process.env.NO_PROXY ?? process.env.no_proxy ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  return {
    useEnvProxy,
    enabled: proxy !== null,
    port: proxy?.port ?? null,
    isExpectedHost:
      proxy !== null && EXPECTED_PROXY_HOSTS.includes(proxy.host)
        ? 'Yes'
        : 'No',
    exclusionsCount: exclusions.length
  }
}

/**
 * Formats the proxy summary as a single, greppable, non-sensitive log line.
 * @returns {string}
 */
export function describeProxyInfo() {
  const info = getProxyInfo()

  return (
    `proxy enabled=${info.enabled}, ` +
    `port=${info.port ?? 'n/a'}, ` +
    `expectedHost=${info.isExpectedHost}, ` +
    `exclusions=${info.exclusionsCount}, ` +
    `useEnvProxy=${info.useEnvProxy}`
  )
}
