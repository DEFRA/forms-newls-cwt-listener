/**
 * Mapping registry: loads and validates the JSON mapping files from the
 * configured mappings directory and indexes them by form id.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { createLogger } from '../../common/helpers/logging/logger.js'
import { validateMappingDefinition } from './mapping-schema.js'

const logger = createLogger()

/**
 * @typedef {import('./types.js').MappingDefinition} MappingDefinition
 */

/**
 * @typedef {object} MappingRegistry
 * @property {MappingDefinition[]} mappings - All loaded mapping definitions
 * @property {Map<string, MappingDefinition>} byFormId - Mapping definitions indexed by form id
 */

/** @type {Map<string, MappingRegistry>} */
const registryCache = new Map()

/**
 * Loads a single mapping file and validates it.
 * @param {string} filePath
 * @returns {MappingDefinition}
 */
export function loadMappingFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  /** @type {unknown} */
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new Error(
      `Mapping file "${filePath}" is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error }
    )
  }
  return validateMappingDefinition(parsed, filePath)
}

/**
 * Loads every "*.mapping.json" file in the given directory into a registry.
 * Results are cached per directory; use clearRegistryCache() in tests.
 * @param {string} mappingsDir - Directory containing the mapping files
 * @returns {MappingRegistry}
 */
export function loadRegistry(mappingsDir) {
  const absoluteDir = resolve(mappingsDir)
  const cached = registryCache.get(absoluteDir)
  if (cached) {
    return cached
  }

  /** @type {MappingDefinition[]} */
  const mappings = []
  /** @type {Map<string, MappingDefinition>} */
  const byFormId = new Map()

  const fileNames = readdirSync(absoluteDir).filter((fileName) =>
    fileName.endsWith('.mapping.json')
  )

  for (const fileName of fileNames) {
    const mapping = loadMappingFile(join(absoluteDir, fileName))
    mappings.push(mapping)

    for (const formId of mapping.formIds) {
      const existing = byFormId.get(formId)
      if (existing) {
        throw new Error(
          `Form id "${formId}" is claimed by both mapping "${existing.id}" and mapping "${mapping.id}"`
        )
      }
      byFormId.set(formId, mapping)
    }
  }

  logger.info(
    `Loaded ${mappings.length} mapping definition(s) from ${absoluteDir}`
  )

  const registry = { mappings, byFormId }
  registryCache.set(absoluteDir, registry)
  return registry
}

/**
 * Finds the mapping definition that applies to a form id, if any.
 * @param {string} mappingsDir - Directory containing the mapping files
 * @param {string} formId - The submitted form's id
 * @returns {MappingDefinition | undefined}
 */
export function findMappingForForm(mappingsDir, formId) {
  return loadRegistry(mappingsDir).byFormId.get(formId)
}

/**
 * Clears the per-directory registry cache (intended for tests).
 */
export function clearRegistryCache() {
  registryCache.clear()
}
