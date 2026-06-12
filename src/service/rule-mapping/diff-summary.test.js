import { describe, it, expect } from 'vitest'

import { describeDifferences } from './diff-summary.js'

describe('describeDifferences', () => {
  it('returns no differences for equal payloads', () => {
    expect(describeDifferences({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toEqual([])
  })

  it('treats undefined-valued and omitted keys as equal (JSON normalisation)', () => {
    expect(describeDifferences({ a: 1, b: undefined }, { a: 1 })).toEqual([])
  })

  it('reports a key present in legacy but missing in rules', () => {
    expect(describeDifferences({ a: 1, b: 2 }, { a: 1 })).toEqual([
      { path: 'b', description: 'present in legacy but missing in rules' }
    ])
  })

  it('reports a key present in rules but missing in legacy', () => {
    expect(describeDifferences({ a: 1 }, { a: 1, b: 2 })).toEqual([
      { path: 'b', description: 'present in rules but missing in legacy' }
    ])
  })

  it('reports differing string lengths without the values', () => {
    const differences = describeDifferences({ name: 'Alice' }, { name: 'Bob' })
    expect(differences).toEqual([
      {
        path: 'name',
        description: 'string length differs (legacy=5, rules=3)'
      }
    ])
  })

  it('reports same-length string differences without the values', () => {
    expect(describeDifferences({ code: 'ABC' }, { code: 'XYZ' })).toEqual([
      { path: 'code', description: 'string values differ (same length)' }
    ])
  })

  it('reports differing numbers and booleans without the values', () => {
    expect(
      describeDifferences({ n: 1, ok: true }, { n: 2, ok: false })
    ).toEqual([
      { path: 'n', description: 'values differ' },
      { path: 'ok', description: 'values differ' }
    ])
  })

  it('reports type differences', () => {
    expect(describeDifferences({ a: '1' }, { a: 1 })).toEqual([
      { path: 'a', description: 'type differs (legacy=string, rules=number)' }
    ])
  })

  it('reports array length differences and missing items by index', () => {
    const differences = describeDifferences(
      { items: ['a', 'b', 'c'] },
      { items: ['a'] }
    )
    expect(differences).toEqual([
      {
        path: 'items',
        description: 'array length differs (legacy=3, rules=1)'
      },
      {
        path: 'items[1]',
        description: 'item present in legacy but missing in rules'
      },
      {
        path: 'items[2]',
        description: 'item present in legacy but missing in rules'
      }
    ])
  })

  it('descends into nested objects and arrays', () => {
    const differences = describeDifferences(
      { applicant: { contacts: [{ email: 'a@b.com' }] } },
      { applicant: { contacts: [{ email: 'cd@ef.com' }] } }
    )
    expect(differences).toEqual([
      {
        path: 'applicant.contacts[0].email',
        description: 'string length differs (legacy=7, rules=9)'
      }
    ])
  })

  it('reports a null vs object difference as a type difference at the root', () => {
    expect(describeDifferences({ a: 1 }, null)).toEqual([
      {
        path: '(root)',
        description: 'type differs (legacy=object, rules=null)'
      }
    ])
  })

  it('reports a failed rules payload (undefined) as a root type difference', () => {
    expect(describeDifferences({ a: 1 }, undefined)).toEqual([
      {
        path: '(root)',
        description: 'type differs (legacy=object, rules=null)'
      }
    ])
  })

  it('never includes the underlying values in any description', () => {
    const differences = describeDifferences(
      { secret: 'super-secret-value', n: 42 },
      { secret: 'other', n: 7 }
    )
    const serialised = JSON.stringify(differences)
    expect(serialised).not.toContain('super-secret-value')
    expect(serialised).not.toContain('other')
    expect(serialised).not.toContain('42')
    expect(serialised).not.toContain('7')
  })
})
