import { formatCoordinates, joinCoordinates, parseSssiId } from './helpers.js'

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

  describe('parseSssiId', () => {
    it('should parse a numeric string into an integer', () => {
      expect(parseSssiId('1001234')).toBe(1001234)
    })

    it('should parse a number value', () => {
      expect(parseSssiId(42)).toBe(42)
    })

    it('should throw an error for a non-numeric string', () => {
      expect(() => parseSssiId('Arun Banks SSSI')).toThrow(
        'SSSI_id value "Arun Banks SSSI" cannot be parsed into an integer'
      )
    })

    it('should throw an error for an empty string', () => {
      expect(() => parseSssiId('')).toThrow(
        'SSSI_id value "" cannot be parsed into an integer'
      )
    })
  })
})
