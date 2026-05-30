import { describe, it, expect } from 'vitest'
import { ALL_CELLS } from './matrix'
import { expandRangeTokens, getPredefinedRange } from './predefinedRanges'

/** Offsuit hands below the bar (intentional folds), e.g. K4o–K2o for a 5x bar. */
function missingOffsuitBelowBar(labels: Set<string>, barRank: string): boolean {
  const barIdx = 'AKQJT98765432'.indexOf(barRank)
  if (barIdx < 0) return false
  for (const cell of ALL_CELLS) {
    if (cell.type !== 'offsuit') continue
    if (labels.has(cell.label)) continue
    const highIdx = Math.min(cell.row, cell.col)
    const lowIdx = Math.max(cell.row, cell.col)
    if (lowIdx <= barIdx) {
      return true
    }
    if (highIdx === 0) {
      return true
    }
  }
  return false
}

describe('BB offsuit bar coverage', () => {
  const bbBars: Array<[string, string]> = [
    ['40bb-bb-vs-btn', '5'],
    ['40bb-bb-vs-co', '6'],
    ['40bb-bb-vs-hj', '7'],
    ['40bb-bb-vs-utg', '9'],
  ]

  it.each(bbBars)('%s has no interior offsuit gaps above %sx bar', (id, bar) => {
    const range = getPredefinedRange(id)!
    const labels = new Set(expandRangeTokens(range.tokens))
    expect(missingOffsuitBelowBar(labels, bar)).toBe(false)
  })

  it('covers all suited hands for BB vs BTN', () => {
    const range = getPredefinedRange('40bb-bb-vs-btn')!
    const labels = new Set(expandRangeTokens(range.tokens))
    const missingSuited = ALL_CELLS.filter((c) => c.type === 'suited' && !labels.has(c.label))
    expect(missingSuited).toEqual([])
  })
})
