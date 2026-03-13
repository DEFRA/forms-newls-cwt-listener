import { FormAdapterSubmissionSchemaVersion } from '@defra/forms-engine-plugin/engine/types/enums.js'
import { Engine, FormStatus, SchemaVersion } from '@defra/forms-model'
import {
  buildCheckboxComponent,
  buildDateComponent,
  buildDefinition,
  buildFileUploadComponent,
  buildFileUploadPage,
  buildList,
  buildListItem,
  buildMonthYearFieldComponent,
  buildQuestionPage,
  buildRepeaterPage,
  buildSummaryPage,
  buildTextFieldComponent,
  buildUkAddressFieldComponent
} from '@defra/forms-model/stubs'

import { buildFormAdapterSubmissionMessage } from '../../../__stubs__/event-builders.js'
import { formatter } from './v2.js'

vi.mock('../../../../config.js', () => ({
  config: {
    get: vi.fn(() => {
      return 'http://designer'
    })
  }
}))

describe('Machine Readable v2 tests', () => {
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
      buildQuestionPage({
        title: '',
        path: '/what-is-your-address',
        components: [
          buildUkAddressFieldComponent({
            title: 'What is your address?',
            name: 'hTFiWF',
            shortDescription: 'Your address',
            hint: '',
            options: {
              required: true
            },
            id: '61832544-01c4-4929-b45f-acf0a16d048b'
          })
        ],
        id: 'ecc7e7af-1276-42d5-869f-5626abb20e25'
      }),
      buildQuestionPage({
        title: '',
        path: '/what-is-your-date-of-birth',
        components: [
          buildDateComponent({
            title: 'What is your date of birth?',
            name: 'zznFWF',
            shortDescription: 'Your date of birth',
            hint: '',
            options: {
              required: true
            },
            id: '7fabac3b-ce13-45ed-8375-4b4a1d5aa4c8'
          })
        ],
        id: 'f19eb7f8-efaf-4a82-8ae1-b76cb893f967'
      }),
      buildQuestionPage({
        title: '',
        path: '/what-month-is-it',
        components: [
          buildMonthYearFieldComponent({
            title: 'What month is it?',
            name: 'KGSRJU',
            shortDescription: 'This month',
            hint: '',
            options: {
              required: true
            },
            id: '530e5411-8a95-4f7e-aec3-5a9f34bc947a'
          })
        ],
        id: '111680c2-0137-483f-81bb-6d475274acd7'
      }),
      buildRepeaterPage({
        title: '',
        path: '/what-is-the-team-members-name',
        components: [
          buildTextFieldComponent({
            title: "What is the team member's name?",
            name: 'biMrWQ',
            shortDescription: "Team member's name",
            hint: '',
            options: {
              required: true
            },
            id: '32d6f10b-9a9e-4703-8452-dcb554ebf515'
          })
        ],
        id: 'f227fb10-dcc8-4d49-9340-2fb138c642d9',
        repeat: {
          options: {
            name: 'FqQrLz',
            title: 'Team Member'
          },
          schema: {
            min: 2,
            max: 6
          }
        }
      }),
      buildQuestionPage({
        title: '',
        path: '/who-are-your-favourite-lotr-characters',
        components: [
          buildCheckboxComponent({
            title: 'Who are your favourite LotR characters?',
            name: 'hVcHQv',
            shortDescription: 'Your favourite LotR characters',
            hint: '',
            options: {
              required: true
            },
            list: '89dc874e-5f22-4c9e-9f7c-ee614ef5a3fe',
            id: '9c17ecd9-0799-4100-a338-990fbfdca003'
          })
        ],
        id: '50c33245-5534-4ed8-9b7a-47a3bece952d'
      }),
      buildFileUploadPage({
        title: '',
        path: '/please-add-supporting-evidence',
        components: [
          buildFileUploadComponent({
            title: 'Please add supporting evidence',
            name: 'IWEgMu',
            shortDescription: 'Supporting evidence',
            hint: '',
            options: {
              required: true,
              accept: 'application/pdf'
            },
            id: 'cbaa6e34-8ac7-463c-bc92-7ed5099772ae'
          })
        ],
        id: '2ed8aef4-f559-46e6-8beb-767c92e5f36d'
      }),
      buildSummaryPage({
        id: '449a45f6-4541-4a46-91bd-8b8931b07b50',
        title: 'Summary',
        path: '/summary'
      })
    ],
    conditions: [],
    sections: [],
    lists: [
      buildList({
        name: 'wawsKA',
        title: 'List for question hVcHQv',
        type: 'string',
        items: [
          buildListItem({
            id: '307c19bd-71f8-46ec-918e-c9c03f43c19e',
            text: 'Gandalf',
            value: 'Gandalf'
          }),
          buildListItem({
            id: '96136000-3ff8-4a3c-be92-26226b5135c7',
            text: 'Frodo',
            value: 'Frodo'
          }),
          buildListItem({
            id: 'e138ab49-f96d-454f-bab9-8f7a5d83e816',
            text: 'Bilbo',
            value: 'Bilbo'
          }),
          buildListItem({
            id: 'f06eb58e-e73c-45b9-a56f-947546f44d04',
            text: 'Samwise Gamgee',
            value: 'Samwise Gamgee'
          }),
          buildListItem({
            id: '17b20c84-d0a2-41c9-bc55-081c346d9542',
            text: 'Legolas',
            value: 'Legolas'
          }),
          buildListItem({
            id: '4a5461e9-8639-4dc7-8814-729900bfcd87',
            text: 'Gimli',
            value: 'Gimli'
          }),
          buildListItem({
            id: '220cd477-8b77-4d4d-b39f-e5ee63410a97',
            text: 'Aragorn',
            value: 'Aragorn'
          }),
          buildListItem({
            id: '62741a2e-c6dc-4f86-bf5c-76be2fdad4da',
            text: 'Arwena',
            value: 'Arwena'
          }),
          buildListItem({
            id: '35ab5eb8-b390-43ae-b92e-4f53b5b543cf',
            text: 'Éowina',
            value: 'Éowina'
          })
        ],
        id: '89dc874e-5f22-4c9e-9f7c-ee614ef5a3fe'
      })
    ]
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
        hTFiWF: {
          addressLine1: '1 Anywhere Street',
          town: 'Anywhereville',
          county: 'Anywhereshire',
          postcode: 'AN1 2WH'
        },
        zznFWF: { day: 1, month: 1, year: 2000 },
        KGSRJU: { month: 8, year: 2025 },
        hVcHQv: ['Gandalf', 'Frodo'],
        JHCHVE: 'Someone' // moved from first position to test ordering
      },
      repeaters: {
        biMrWQ: [
          {
            FqQrLz: 'Frodo'
          },
          {
            FqQrLz: 'Gandalf'
          }
        ]
      },
      files: {
        IWEgMu: [
          {
            fileName: 'supporting_evidence.pdf',
            fileId: 'ef4863e9-7e9e-40d0-8fea-cf34faf098cd',
            userDownloadLink:
              'http://localhost:3005/file-download/ef4863e9-7e9e-40d0-8fea-cf34faf098cd'
          }
        ]
      }
    },
    result: {
      files: {
        main: '818d567d-ee05-4a7a-8c49-d5c54fb09b16',
        repeaters: {
          FqQrLz: 'e3005cd2-8b1c-4dc4-b2ac-bd1ff73666a9'
        }
      }
    }
  })

  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(new Date('2025-09-01T00:00:00Z'))
  })
  afterAll(() => {
    vi.useRealTimers()
  })

  it('should return a valid machine v1 response', () => {
    const definition = buildDefinition({
      ...definitionBase,
      output: {
        audience: 'machine',
        version: '1'
      }
    })
    const formatted = JSON.parse(formatter(message, definition, '1'))
    expect(formatted).toEqual({
      meta: {
        schemaVersion: '1',
        timestamp: expect.any(String),
        referenceNumber: '874-C7C-D60',
        definition: {
          ...definitionBase,
          output: { audience: 'machine', version: '1' }
        }
      },
      data: {
        main: {
          hTFiWF: {
            addressLine1: '1 Anywhere Street',
            town: 'Anywhereville',
            county: 'Anywhereshire',
            postcode: 'AN1 2WH'
          },
          zznFWF: { day: 1, month: 1, year: 2000 },
          KGSRJU: { month: 8, year: 2025 },
          hVcHQv: ['Gandalf', 'Frodo'],
          JHCHVE: 'Someone' // moved from first position to test ordering
        },
        repeaters: {
          biMrWQ: [
            {
              FqQrLz: 'Frodo'
            },
            {
              FqQrLz: 'Gandalf'
            }
          ]
        },
        files: {
          IWEgMu: [
            {
              fileName: 'supporting_evidence.pdf',
              fileId: 'ef4863e9-7e9e-40d0-8fea-cf34faf098cd',
              userDownloadLink:
                'http://localhost:3005/file-download/ef4863e9-7e9e-40d0-8fea-cf34faf098cd'
            }
          ]
        }
      }
    })
  })
})
