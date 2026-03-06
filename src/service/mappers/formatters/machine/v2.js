/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('@defra/forms-model').FormDefinition} FormDefinition
 */

/**
 * This example formats the current machine readable v2 data
 * @param {FormAdapterSubmissionMessage} formSubmissionMessage
 * @param {FormDefinition} formDefinition
 * @param {string} schemaVersion
 */
export function formatter(
  formSubmissionMessage,
  formDefinition,
  schemaVersion
) {
  const output = {
    meta: {
      schemaVersion,
      timestamp: new Date().toISOString(),
      referenceNumber: formSubmissionMessage.meta.referenceNumber,
      definition: formDefinition
    },
    data: formSubmissionMessage.data
  }

  return JSON.stringify(output)
}
