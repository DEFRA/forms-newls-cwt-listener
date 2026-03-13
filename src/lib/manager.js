import { FormStatus } from '@defra/forms-model'

import { config } from '../config.js'
import { getJson } from './fetch.js'

/** @type {string} */
const managerUrl = config.get('managerUrl')

/**
 * Gets the form version definition from the Forms Manager API
 * @param {string} formId
 * @param {FormStatus} formStatus
 * @param {number} versionNumber
 * @returns {Promise<import('@defra/forms-model').FormDefinition>}
 */
export async function getFormDefinition(formId, formStatus, versionNumber) {
  const statusPath = formStatus === FormStatus.Draft ? FormStatus.Draft : ''
  const formUrl =
    versionNumber !== undefined
      ? new URL(
          `/forms/${formId}/versions/${versionNumber}/definition`,
          managerUrl
        )
      : new URL(`/forms/${formId}/definition/${statusPath}`, managerUrl)

  const { body } = await getJson(formUrl)

  return /** @type {import('@defra/forms-model').FormDefinition} */ (body)
}
