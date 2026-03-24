import {
  EMAIL_HEADER_MAX_LENGTH,
  fitNames,
  formatCoordinates,
  joinCoordinates,
  parseEuroSiteId,
  parseName,
  parseSssiId
} from './helpers.js'

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

    it('should parse a combined SSSI_ID---Name value into an integer', () => {
      expect(parseSssiId('1005725---Popehouse Moor SSSI')).toBe(1005725)
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

  describe('parseName', () => {
    it('should extract the name from a combined "ID---Name" SSSI value', () => {
      expect(parseName('1005725---Popehouse Moor SSSI')).toBe(
        'Popehouse Moor SSSI'
      )
    })

    it('should extract the name from a combined "ID---Name" Euro site value', () => {
      expect(parseName('UK11004---Arun Valley Ramsar')).toBe(
        'Arun Valley Ramsar'
      )
    })

    it('should return the original string when no separator is present', () => {
      expect(parseName('Just a plain name')).toBe('Just a plain name')
    })

    it('should handle numeric values', () => {
      expect(parseName(42)).toBe('42')
    })
  })

  describe('fitNames', () => {
    it('should return all names when they fit', () => {
      expect(fitNames(['Abbey Wood SSSI', 'Popehouse Moor SSSI'], 100)).toBe(
        'Abbey Wood SSSI, Popehouse Moor SSSI'
      )
    })

    it('should return empty string for empty array', () => {
      expect(fitNames([], 100)).toBe('')
    })

    it('should truncate names with (+N more) when they do not fit', () => {
      const names = [
        'Abbey Wood SSSI',
        'Popehouse Moor SSSI',
        'Arun Banks SSSI'
      ]
      const result = fitNames(names, 40)
      expect(result).toBe('Abbey Wood SSSI (+2 more)')
      expect(result.length).toBeLessThanOrEqual(40)
    })

    it('should truncate a single long name with ellipsis', () => {
      const names = ['A Very Long SSSI Name That Exceeds The Limit']
      const result = fitNames(names, 20)
      expect(result).toBe('A Very Long SSSI ...')
      expect(result.length).toBeLessThanOrEqual(20)
    })

    it('should include (+N more) when first name must be truncated and there are more', () => {
      const names = ['A Very Long SSSI Name', 'Another SSSI', 'Third SSSI']
      const result = fitNames(names, 30)
      expect(result).toContain('(+2 more)')
      expect(result.length).toBeLessThanOrEqual(30)
    })
  })

  describe('EMAIL_HEADER_MAX_LENGTH', () => {
    it('should be 255', () => {
      expect(EMAIL_HEADER_MAX_LENGTH).toBe(255)
    })
  })

  describe('parseEuroSiteId', () => {
    it('should extract the Euro Site ID from a combined value', () => {
      expect(parseEuroSiteId('UK11004---Arun Valley Ramsar')).toBe('UK11004')
    })

    it('should handle IDs with different formats', () => {
      expect(parseEuroSiteId('UK11001---Abberton Reservoir Ramsar')).toBe(
        'UK11001'
      )
    })

    it('should throw an error when separator is missing', () => {
      expect(() => parseEuroSiteId('Test Euro Site')).toThrow(
        'european_site_id value "Test Euro Site" does not contain the expected "---" separator'
      )
    })

    it('should throw an error for an empty string', () => {
      expect(() => parseEuroSiteId('')).toThrow(
        'european_site_id value "" does not contain the expected "---" separator'
      )
    })
  })
})
