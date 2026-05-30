import { describe, it, expect } from 'vitest'
import {
  countRangeCombos,
  expandHandToken,
  expandRangeTokens,
  getPredefinedRange,
  parsePredefinedRange,
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

  it('parses UTG open into cell states', () => {
    const range = getPredefinedRange('utg-open')!
    const cellStates = parsePredefinedRange(range)
    expect(cellStates['0-1']).toBe('in')
    expect(cellStates['0-0']).toBe('in')
    expect(countRangeCombos(cellStates)).toBeGreaterThan(120)
    expect(countRangeCombos(cellStates)).toBeLessThan(170)
  })

  it('parses BB vs BTN wider than UTG', () => {
    const utg = countRangeCombos(parsePredefinedRange(getPredefinedRange('utg-open')!))
    const bbBtn = countRangeCombos(parsePredefinedRange(getPredefinedRange('bb-vs-btn')!))
    expect(bbBtn).toBeGreaterThan(utg)
  })

  it('deduplicates overlapping tokens', () => {
    const labels = expandRangeTokens(['AKs', 'AJs+'])
    expect(labels.filter((l) => l === 'AKs')).toHaveLength(1)
    expect(labels).toContain('AQs')
  })

  it('keeps study presets in ascending combo order', () => {
    const ids = ['top-10', 'top-20', 'top-30', 'top-40', 'top-50', 'top-60', 'top-70', 'top-80']
    const counts = ids.map((id) =>
      countRangeCombos(parsePredefinedRange(getPredefinedRange(id)!)),
    )
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThan(counts[i - 1])
    }
  })

  it('targets roughly the labeled study percentages', () => {
    const checks: [string, number, number][] = [
      ['top-30', 370, 420],
      ['top-40', 510, 550],
      ['top-50', 640, 680],
      ['top-60', 770, 820],
      ['top-70', 900, 960],
      ['top-80', 1040, 1080],
    ]
    for (const [id, min, max] of checks) {
      const count = countRangeCombos(parsePredefinedRange(getPredefinedRange(id)!))
      expect(count).toBeGreaterThanOrEqual(min)
      expect(count).toBeLessThanOrEqual(max)
    }
  })
})
