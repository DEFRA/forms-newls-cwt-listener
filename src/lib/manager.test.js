import { FormStatus } from '@defra/forms-model'
import { buildDefinition } from '@defra/forms-model/stubs'

import { getJson } from './fetch.js'
import { getFormDefinition } from './manager.js'
vi.mock('./fetch.js')
vi.mock('../config.js', () => ({
  config: {
    get: vi.fn().mockReturnValueOnce('http://forms-manager')
  }
}))

describe('getDefinition', () => {
  it('should get the current definition if draft', async () => {
    const expectedDefinition = buildDefinition()
    const formId = '68a890909ab460290c289409'
    vi.mocked(getJson).mockResolvedValueOnce({
      response: {},
      body: expectedDefinition
    })

    const definition = await getFormDefinition(
      formId,
      FormStatus.Draft,
      undefined
    )
    expect(getJson).toHaveBeenCalledWith(
      expect.objectContaining({
        href: 'http://forms-manager/forms/68a890909ab460290c289409/definition/draft'
      })
    )
    expect(definition).toEqual(expectedDefinition)
  })

  it('should get the current definition if live', async () => {
    const expectedDefinition = buildDefinition()
    const formId = '68a890909ab460290c289409'
    vi.mocked(getJson).mockResolvedValueOnce({
      response: {},
      body: expectedDefinition
    })
    const definition = await getFormDefinition(
      formId,
      FormStatus.Live,
      undefined
    )

    expect(getJson).toHaveBeenCalledWith(
      expect.objectContaining({
        href: 'http://forms-manager/forms/68a890909ab460290c289409/definition/'
      })
    )
    expect(definition).toEqual(expectedDefinition)
  })

  it('should get a specific version if version number is provided', async () => {
    const expectedDefinition = buildDefinition()
    const formId = '68a890909ab460290c289409'
    const versionNumber = 3
    vi.mocked(getJson).mockResolvedValueOnce({
      response: {},
      body: expectedDefinition
    })
    const definition = await getFormDefinition(
      formId,
      FormStatus.Live,
      versionNumber
    )
    expect(getJson).toHaveBeenCalledWith(
      expect.objectContaining({
        href: 'http://forms-manager/forms/68a890909ab460290c289409/versions/3/definition'
      })
    )
    expect(definition).toEqual(expectedDefinition)
  })

  it('should get a specific version with draft status if version number is provided', async () => {
    const expectedDefinition = buildDefinition()
    const formId = '68a890909ab460290c289409'
    const versionNumber = 1
    vi.mocked(getJson).mockResolvedValueOnce({
      response: {},
      body: expectedDefinition
    })
    const definition = await getFormDefinition(
      formId,
      FormStatus.Draft,
      versionNumber
    )
    expect(getJson).toHaveBeenCalledWith(
      expect.objectContaining({
        href: 'http://forms-manager/forms/68a890909ab460290c289409/versions/1/definition'
      })
    )
    expect(definition).toEqual(expectedDefinition)
  })

  it('should handle version number 0 correctly', async () => {
    const expectedDefinition = buildDefinition()
    const formId = '68a890909ab460290c289409'
    const versionNumber = 0
    vi.mocked(getJson).mockResolvedValueOnce({
      response: {},
      body: expectedDefinition
    })
    const definition = await getFormDefinition(
      formId,
      FormStatus.Live,
      versionNumber
    )
    expect(getJson).toHaveBeenCalledWith(
      expect.objectContaining({
        href: 'http://forms-manager/forms/68a890909ab460290c289409/versions/0/definition'
      })
    )
    expect(definition).toEqual(expectedDefinition)
  })
})
