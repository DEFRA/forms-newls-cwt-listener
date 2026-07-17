/**
 * Destination registry: resolves a mapping file's "destination" to a sender
 * function, and checks on startup that every destination the mapping files name
 * is actually configured.
 *
 * The mapping file only names its destination; that name is what selects the
 * address, credential, handler and retry policy from config, so a new
 * destination needs a config block rather than a change here.
 */

import { createLogger } from '../../common/helpers/logging/logger.js'
import { getErrorMessage } from '../../common/helpers/error-message.js'
import { getDestinationSettings } from '../transmitters/destination-config.js'
import { send } from '../transmitters/submission-transmitter.js'
import { loadRegistry } from './registry.js'

const logger = createLogger()

/**
 * @typedef {import('./types.js').Destination} Destination
 * @typedef {(payload: Record<string, unknown>) => Promise<void>} DestinationSender
 */

/**
 * Resolves a destination declaration to its sender function.
 * @param {Destination} destination - The destination from the mapping file
 * @returns {DestinationSender}
 */
export function resolveDestination(destination) {
  if (destination.type !== 'rest') {
    throw new Error(`Unsupported destination type "${destination.type}"`)
  }

  return (payload) => send(destination.name, payload)
}

/**
 * Whether a configured address is usable as an address at all. This is a shape
 * check, not a reachability one - it catches an unset or malformed environment
 * variable on startup rather than on the first submission.
 * @param {string} url
 * @returns {boolean}
 */
function looksLikeUrl(url) {
  return URL.canParse(url)
}

/**
 * Describes what is wrong with a destination's config, or null if it is usable.
 * @param {string} name - The destination name from a mapping file
 * @returns {string | null}
 */
function findConfigProblem(name) {
  try {
    const settings = getDestinationSettings(name)

    if (!looksLikeUrl(settings.url)) {
      return `Destination "${name}" has no valid URL configured (got "${settings.url}")`
    }

    return null
  } catch (error) {
    return getErrorMessage(error)
  }
}

/**
 * Checks that every destination named by a mapping file has usable config,
 * throwing with all of the problems found rather than only the first.
 *
 * This runs on startup so that a missing or malformed destination setting stops
 * the service coming up, instead of surfacing as a failed submission later.
 * @param {string} mappingsDir - Directory containing the mapping files
 */
export function checkDestinationsAreConfigured(mappingsDir) {
  const { mappings } = loadRegistry(mappingsDir)

  const names = new Set(mappings.map((mapping) => mapping.destination.name))
  const problems = [...names]
    .sort()
    .map(findConfigProblem)
    .filter((problem) => problem !== null)

  if (problems.length) {
    throw new Error(
      `Mapping destinations are not configured correctly:\n${problems
        .map((problem) => `- ${problem}`)
        .join('\n')}`
    )
  }

  logger.info(
    `Checked config for ${names.size} mapping destination(s): ${[...names].sort().join(', ')}`
  )
}
