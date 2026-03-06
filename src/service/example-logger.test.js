import {
  buildDefinition,
  buildQuestionPage,
  buildSummaryPage,
  buildTextFieldComponent
} from '@defra/forms-model/stubs'
import {
  ControllerType,
  Engine,
  FormStatus,
  SchemaVersion
} from '@defra/forms-model'
import { buildFormAdapterSubmissionMessage } from './__stubs__/event-builders.js'
import { FormAdapterSubmissionSchemaVersion } from '@defra/forms-engine-plugin/engine/types/enums.js'
import { handleFormSubmission } from './example-logger.js'
import { getFormDefinition } from '../lib/manager.js'
import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

vi.mock('pino', () => ({
  pino: () => ({
    info: vi.fn()
  })
}))

vi.mock('../lib/manager.js')

describe('example-logger', () => {
  const definitionBase = buildDefinition({
    name: 'Example notify form',
    engine: Engine.V2,
    schema: SchemaVersion.V2,
    startPage: '/summary',
    pages: [
      buildQuestionPage({
        title: '',
        path: '/what-is-your-name',
        components: [
          buildTextFieldComponent({
            title: 'What is your name?',
            name: 'JHCHVE',
            shortDescription: 'Your name',
            hint: '',
            options: {
              required: true
            },
            id: 'b2e4a0f5-eb78-4faf-a56d-cfe2462405e9'
          })
        ],
        id: '3b6baff0-e694-428b-9823-63799c5f730a'
      }),
      buildSummaryPage({
        id: '449a45f6-4541-4a46-91bd-8b8931b07b50',
        title: 'Summary',
        path: '/summary'
      })
    ],
    conditions: [],
    sections: [],
    lists: []
  })
  const message = buildFormAdapterSubmissionMessage({
    messageId: '1668fba2-386c-4e2e-a348-a241e4193d08',
    recordCreatedAt: new Date('2025-08-26'),
    meta: {
      schemaVersion: FormAdapterSubmissionSchemaVersion.V1,
      timestamp: new Date('2025-08-28T11:01:59.347Z'),
      formName: 'Example notify form',
      formId: '68aedbd12d36db797aa64454',
      formSlug: 'example-notify-form',
      status: FormStatus.Live,
      isPreview: false,
      notificationEmail: 'name@example.gov.uk',
      referenceNumber: '874-C7C-D60'
    },
    data: {
      main: {
        JHCHVE: 'Someone'
      },
      repeaters: {},
      files: {}
    },
    result: {
      files: {
        main: '818d567d-ee05-4a7a-8c49-d5c54fb09b16',
        repeaters: {}
      }
    }
  })

  it('should log out the form submission data', async () => {
    vi.mocked(getFormDefinition).mockResolvedValue(definitionBase)
    await handleFormSubmission(message)

    const expectedJSON = [
      {
        title: 'What is your name?',
        shortDescription: 'Your name',
        text: 'Someone',
        data: 'Someone',
        type: ControllerType.Page
      }
    ]

    vi.mocked(logger.info)

    const [loggerCall] = vi.mocked(logger.info).mock.calls[0]
    expect(JSON.parse(loggerCall)).toEqual(expectedJSON)
  })
})
