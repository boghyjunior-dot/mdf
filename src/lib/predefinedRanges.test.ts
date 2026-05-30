import { describe, it, expect } from 'vitest'
import {
  countRangeCombos,
  expandHandToken,
  expandRangeTokens,
  getPredefinedRange,
  getPredefinedRangeCategories,
  parsePredefinedRange,
  PREDEFINED_RANGES,
} from './predefinedRanges'

describe('predefinedRanges', () => {
  it('expands pair plus notation', () => {
    expect(expandHandToken('TT+')).toEqual(['TT', 'JJ', 'QQ', 'KK', 'AA'])
  })

  it('expands suited plus notation', () => {
    expect(expandHandToken('AJs+')).toEqual(['AJs', 'AQs', 'AKs'])
  })

  it('expands exact hands', () => {
    expect(expandHandToken('AKs')).toEqual(['AKs'])
    expect(expandHandToken('KQo')).toEqual(['KQo'])
  })

  it('includes MTT 40BB continue presets for every position vs earlier opener', () => {
    const categories = getPredefinedRangeCategories()
    expect(categories).toEqual([
      'MTT · 40BB · HJ',
      'MTT · 40BB · CO',
      'MTT · 40BB · BTN',
      'MTT · 40BB · SB',
      'MTT · 40BB · BB',
    ])

    expect(PREDEFINED_RANGES).toHaveLength(15)
    expect(PREDEFINED_RANGES.every((r) => r.id.startsWith('40bb-'))).toBe(true)
    expect(PREDEFINED_RANGES.some((r) => r.category.includes('Open'))).toBe(false)

    const ids = PREDEFINED_RANGES.map((r) => r.id)
    expect(ids).toEqual([
      '40bb-hj-vs-utg',
      '40bb-co-vs-utg',
      '40bb-co-vs-hj',
      '40bb-btn-vs-utg',
      '40bb-btn-vs-hj',
      '40bb-btn-vs-co',
      '40bb-sb-vs-utg',
      '40bb-sb-vs-hj',
      '40bb-sb-vs-co',
      '40bb-sb-vs-btn',
      '40bb-bb-vs-utg',
      '40bb-bb-vs-hj',
      '40bb-bb-vs-co',
      '40bb-bb-vs-btn',
      '40bb-bb-vs-sb',
    ])
  })

  it('widens BB defend ranges vs later openers', () => {
    const ids = ['40bb-bb-vs-utg', '40bb-bb-vs-hj', '40bb-bb-vs-co', '40bb-bb-vs-btn', '40bb-bb-vs-sb']
    const counts = ids.map((id) => countRangeCombos(parsePredefinedRange(getPredefinedRange(id)!)))
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1])
    }
    expect(counts[0]).toBeLessThan(counts[3])
  })

  it('widens BTN defend ranges vs later openers', () => {
    const ids = ['40bb-btn-vs-utg', '40bb-btn-vs-hj', '40bb-btn-vs-co']
    const counts = ids.map((id) => countRangeCombos(parsePredefinedRange(getPredefinedRange(id)!)))
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThan(counts[i - 1])
    }
  })

  it('deduplicates overlapping tokens', () => {
    const labels = expandRangeTokens(['AKs', 'AJs+'])
    expect(labels.filter((l) => l === 'AKs')).toHaveLength(1)
    expect(labels).toContain('AQs')
  })
})
