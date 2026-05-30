import { describe, it, expect } from 'vitest'
import { ALL_CELLS } from './matrix'
import {
  comboMatchesDrawFilters,
  hasFlushDraw,
  hasGutshot,
  hasOpenEndedStraightDraw,
} from './draws'
import { isCellExcluded } from './filters'
import type { BoardCard, RangeFilters } from '../types/poker'

const noDrawFilters: RangeFilters = {
  excludePairs: false,
  onlyFlushDraw: false,
  onlyStraightDraw: false,
  onlyGutshot: false,
}

describe('draws', () => {
  const board: BoardCard[] = [
    { rank: 8, suit: 'h' },
    { rank: 10, suit: 'h' },
    { rank: 12, suit: 'c' },
  ]

  it('detects flush draw', () => {
    const aks = ALL_CELLS.find((c) => c.label === 'AKs')!
    expect(hasFlushDraw([{ rank: 0, suit: 'h' }, { rank: 1, suit: 'h' }], board)).toBe(true)
    expect(comboMatchesDrawFilters(aks, 'h', board, { ...noDrawFilters, onlyFlushDraw: true })).toBe(true)
    expect(comboMatchesDrawFilters(aks, 's', board, { ...noDrawFilters, onlyFlushDraw: true })).toBe(false)
  })

  it('detects open-ended straight draw', () => {
    const straightBoard: BoardCard[] = [
      { rank: 8, suit: 's' },
      { rank: 7, suit: 'h' },
      { rank: 12, suit: 'd' },
    ]
    expect(hasOpenEndedStraightDraw([{ rank: 5, suit: 'c' }, { rank: 6, suit: 'd' }], straightBoard)).toBe(true)
  })

  it('detects gutshot but not as straight draw', () => {
    const qjo = ALL_CELLS.find((c) => c.label === 'QJo')!
    const gutshotBoard: BoardCard[] = [
      { rank: 4, suit: 's' },
      { rank: 6, suit: 'h' },
      { rank: 10, suit: 'd' },
    ]
    expect(hasGutshot([{ rank: 2, suit: 'c' }, { rank: 3, suit: 's' }], gutshotBoard)).toBe(true)
    expect(hasOpenEndedStraightDraw([{ rank: 2, suit: 'c' }, { rank: 3, suit: 's' }], gutshotBoard)).toBe(false)
    expect(comboMatchesDrawFilters(qjo, 'c-s', gutshotBoard, { ...noDrawFilters, onlyGutshot: true })).toBe(true)
  })

  it('excludes cells with no matching draw combos', () => {
    const aa = ALL_CELLS.find((c) => c.label === 'AA')!
    expect(
      isCellExcluded(aa, new Set(), { ...noDrawFilters, onlyFlushDraw: true }, new Set(), board),
    ).toBe(true)
  })
})
