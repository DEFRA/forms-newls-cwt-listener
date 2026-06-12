/**
 * Destination registry: resolves a mapping file's "destination" to a sender
 * function. Destinations are configured through the existing service config
 * (e.g. the University API URL and key); the mapping file only names which
 * destination to use, so new destinations can be added here without touching
 * the engine.
 */

import { send as sendToUniversityApi } from '../transmitters/submission-transmitter.js'

/**
 * @typedef {import('./types.js').Destination} Destination
 * @typedef {(payload: Record<string, unknown>) => Promise<void>} DestinationSender
 */

/** @type {Record<string, DestinationSender>} */
const restDestinations = {
  universityApi: /** @type {DestinationSender} */ (
    /** @type {unknown} */ (sendToUniversityApi)
  )
}

/**
 * Resolves a destination declaration to its sender function.
 * @param {Destination} destination - The destination from the mapping file
 * @returns {DestinationSender}
 */
export function resolveDestination(destination) {
  if (destination.type !== 'rest') {
    throw new Error(`Unsupported destination type "${destination.type}"`)
  }
  const sender = restDestinations[destination.name]
  if (!sender) {
    throw new Error(`Unknown destination "${destination.name}"`)
  }
  return sender
}
