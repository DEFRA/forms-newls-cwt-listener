import { formatCoordinates, joinCoordinates } from './helpers.js'

describe('helpers', () => {
  describe('formatCoordinates', () => {
    it('should format easting and northing into a comma-separated string', () => {
      expect(formatCoordinates({ easting: 123456, northing: 654321 })).toBe(
        '123456,654321'
      )
    })

    it('should handle zero values', () => {
      expect(formatCoordinates({ easting: 0, northing: 0 })).toBe('0,0')
    })
  })

  describe('joinCoordinates', () => {
    it('should join coordinate strings with semicolons', () => {
      expect(joinCoordinates(['123,456', '789,012'])).toBe('123,456;789,012')
    })

    it('should return a single coordinate unchanged', () => {
      expect(joinCoordinates(['123,456'])).toBe('123,456')
    })

    it('should return empty string for empty array', () => {
      expect(joinCoordinates([])).toBe('')
    })
  })
})
