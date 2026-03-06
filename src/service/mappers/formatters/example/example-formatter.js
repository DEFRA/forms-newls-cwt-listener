// @ts-nocheck -- template example code, needs updating for forms-engine-plugin v4 API changes
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { FormModel } from '@defra/forms-engine-plugin/engine/models/FormModel.js'
import {
  hasFormComponents,
  hasRepeater,
  ControllerType
} from '@defra/forms-model'
import { createComponent } from '@defra/forms-engine-plugin/engine/components/helpers/components.js'
import { FileUploadField } from '@defra/forms-engine-plugin/engine/components/FileUploadField.js'

/**
 * @typedef {import('@defra/forms-engine-plugin/engine/types.d.ts').FormAdapterSubmissionMessage} FormAdapterSubmissionMessage
 * @typedef {import('@defra/forms-model').FormDefinition} FormDefinition
 * @typedef {import('@defra/forms-model').Page} Page
 */

/**
 * This is a higher order function that creates a mapper from the FormModel, FormAdapterSubmissionMessage and repeaterName
 * @param {FormModel} model
 * @param {FormAdapterSubmissionMessage} formSubmissionMessage
 * @param {Page} [page]
 */
function handleComponent(model, formSubmissionMessage, page = undefined) {
  return function (
    /** @type {import('@defra/forms-model').ComponentDef} */ component
  ) {
    /**
     * Here we're instantiating a component to get access to the Question title, label and text representation
     * The fields contain a helpful `getDisplayStringFromFormValue` method for extracting the human readable
     * text value from each of the different types of field
     */
    const field = createComponent(component, { model, basePath: '' })
    const title = field.title
    const shortDescription = field.label
    const fieldName = field.name
    let type = ControllerType.Page

    let data
    let text

    /**
     * Here we're getting the download link and raw data direct from the message
     * No additional data transformation required
     */
    if (field instanceof FileUploadField) {
      data = formSubmissionMessage.data.files[fieldName]
      text = data.map((file) => file.userDownloadLink)
      type = ControllerType.FileUpload
    } else if (page !== undefined && hasRepeater(page)) {
      /**
       * Making use of the repeaters section of the FormSubmissionMessage we're going to map
       * the raw values and get text representation of those values
       */
      const repeaterName = page.repeat.options.name
      const repeaters = formSubmissionMessage.data.repeaters[repeaterName]
      data = repeaters.map((repeaterField) => repeaterField[fieldName])
      text = repeaters.map((repeaterField) =>
        field.getDisplayStringFromFormValue(repeaterField[fieldName])
      )
      type = ControllerType.Repeat
    } else {
      const formValue = formSubmissionMessage.data.main[fieldName]
      text = field.getDisplayStringFromFormValue(formValue)
      data = formValue
    }

    return {
      title,
      shortDescription,
      text,
      data,
      type
    }
  }
}

/**
 * Here is an example formatter function that your team could use or update to prepare the data for your service
 * This formatter function will transform the formSubmission data into an array of
 * objects containing `title`, `shortDescription`, `data` and `text` fields.
 * @see {@link https://github.com/DEFRA/forms-adaptor-template/blob/main/src/service/mappers/formatters/example-formatter.test.js} for an example output
 * @param {FormAdapterSubmissionMessage} formSubmissionMessage
 * @param {FormDefinition} formDefinition
 */
export function formatter(formSubmissionMessage, formDefinition) {
  /**
   * The FormModel is a dependency for `createComponent`
   * @type {FormModel}
   */
  const model = new FormModel(formDefinition, { basePath: '' }, {})

  /**
   * We're going to iterate over the pages in the definition, and then the components to return the
   * data in order
   */
  const output = formDefinition.pages.flatMap(
    /** @returns {any[]} */ (page) => {
      if (!hasFormComponents(page)) {
        return []
      }
      const components = page.components

      /**
       * The repeater entry will be nested repeater page -> components
       */
      if (hasRepeater(page)) {
        // @ts-ignore - hasRepeater narrows page type but tsc doesn't recognise the guard
        const { title } = page.repeat.options

        const data = components.map(
          handleComponent(model, formSubmissionMessage, page)
        )

        return [
          {
            title, // repeater page title
            shortDescription: title,
            text: '', // text is not needed due to this being nested
            data, // an array of the components in the repeater, each with `title`, `shortDescription`, `text` and `data`
            type: ControllerType.Repeat
          }
        ]
      }

      return components.map(handleComponent(model, formSubmissionMessage))
    }
  )

  return JSON.stringify(output)
}
