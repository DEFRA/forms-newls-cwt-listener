import { handleEvent } from './index.js'

describe('index', () => {
  describe('handleEvent', () => {
    it('should handle an empty list of events', async () => {
      const events = await handleEvent([])
      expect(events).toEqual({
        failed: [],
        saved: []
      })
    })
  })
})
