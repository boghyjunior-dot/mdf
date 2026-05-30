import { describe, it, expect } from 'vitest'
import { ALL_CELLS, TOTAL_DECK_COMBOS } from './matrix'
import { getEligibleCombos, isCellExcluded } from './filters'
import {
  formatComboLabel,
  getCellComboStats,
  getComboDisposition,
  getComboGridLayout,
  getCombosForPaintFrequency,
  getDerivedCellState,
  isComboFolded,
} from './combos'
import { computeFoldStats, getTargetFoldPct, getDeltaColor } from './mdf'
import { cellKey, type RankIndex, type SuitId } from '../types/poker'

describe('matrix', () => {
  it('has 169 cells', () => {
    expect(ALL_CELLS).toHaveLength(169)
  })

  it('totals 1326 combos for full deck', () => {
    expect(TOTAL_DECK_COMBOS).toBe(1326)
  })
})

describe('combos', () => {
  const aks = ALL_CELLS.find((c) => c.label === 'AKs')!
  const aa = ALL_CELLS.find((c) => c.label === 'AA')!

  it('formats combo labels', () => {
    expect(formatComboLabel(aks, 's')).toBe('A♠K♠')
    expect(formatComboLabel(aa, 's-h')).toBe('A♠A♥')
  })

  it('derives mixed cell state from partial folds', () => {
    const stats = getCellComboStats(aks, 'in', new Set(['s']), new Set(), new Set())
    expect(stats.folded).toBe(1)
    expect(stats.untagged).toBe(3)
    expect(getDerivedCellState(stats)).toBe('mixed')
  })

  it('respects whole-cell fold when no per-combo tags', () => {
    expect(isComboFolded('s', 'fold', new Set(), new Set())).toBe(true)
    expect(getComboDisposition('h', 'fold', new Set(), new Set())).toBe('fold')
  })

  it('lays out combo grids by hand type', () => {
    expect(getComboGridLayout(aks, new Set())).toMatchObject({ columns: 2, rows: 2 })
    expect(getComboGridLayout(aa, new Set())).toMatchObject({ columns: 3, rows: 2 })
    const ako = ALL_CELLS.find((c) => c.label === 'AKo')!
    expect(getComboGridLayout(ako, new Set())).toMatchObject({ columns: 4, rows: 3 })
  })

  it('selects paint frequency combos', () => {
    expect(getCombosForPaintFrequency(aks, new Set(), 100)).toHaveLength(4)
    expect(getCombosForPaintFrequency(aks, new Set(), 50)).toHaveLength(2)
    expect(getCombosForPaintFrequency(aks, new Set(), 25)).toHaveLength(1)
  })
})

describe('mdf', () => {
  const noFilters = { excludePairs: false, onlyFlushDraw: false, onlyStraightDraw: false, onlyGutshot: false }

  it('returns correct target for b50', () => {
    expect(getTargetFoldPct('b50')).toBe(33)
  })

  it('computes fold percentage from combo weights', () => {
    const aa = ALL_CELLS.find((c) => c.label === 'AA')!
    const kk = ALL_CELLS.find((c) => c.label === 'KK')!
    const cellStates = {
      [cellKey(aa.row, aa.col)]: 'fold' as const,
      [cellKey(kk.row, kk.col)]: 'call' as const,
    }
    const stats = computeFoldStats(
      cellStates,
      {},
      {},
      {},
      new Set(),
      noFilters,
      new Set(),
      'b50',
    )

    expect(stats.folded).toBe(6)
    expect(stats.defended).toBe(6)
    expect(stats.total).toBe(12)
    expect(stats.currentPct).toBe(50)
  })

  it('counts only painted range combos at partial frequency', () => {
    const aks = ALL_CELLS.find((c) => c.label === 'AKs')!
    const key = cellKey(aks.row, aks.col)
    const stats = computeFoldStats(
      { [key]: 'in' },
      {},
      {},
      { [key]: getCombosForPaintFrequency(aks, new Set(), 50) },
      new Set(),
      noFilters,
      new Set(),
      'b50',
    )
    expect(stats.total).toBe(2)
  })

  it('counts per-combo suit folds', () => {
    const aks = ALL_CELLS.find((c) => c.label === 'AKs')!
    const cellStates = {
      [cellKey(aks.row, aks.col)]: 'in' as const,
    }
    const stats = computeFoldStats(
      cellStates,
      { [cellKey(aks.row, aks.col)]: ['s'] },
      {},
      {},
      new Set(),
      noFilters,
      new Set(),
      'b50',
    )
    expect(stats.folded).toBe(1)
    expect(stats.untagged).toBe(3)
    expect(stats.total).toBe(4)
  })

  it('colors delta within tolerance', () => {
    expect(getDeltaColor(0.5)).toBe('green')
    expect(getDeltaColor(2)).toBe('yellow')
    expect(getDeltaColor(5)).toBe('red')
  })
})

describe('filters', () => {
  const cell = ALL_CELLS.find((c) => c.label === 'AKs')!
  const aa = ALL_CELLS.find((c) => c.label === 'AA')!
  const noFilters = { excludePairs: false, onlyFlushDraw: false, onlyStraightDraw: false, onlyGutshot: false }

  it('excludes by rank', () => {
    expect(isCellExcluded(cell, new Set<RankIndex>([0]), noFilters, new Set(), [])).toBe(true)
  })

  it('reduces combo counts when suits are excluded', () => {
    expect(getEligibleCombos(cell, new Set<SuitId>(['s']))).toBe(3)
    expect(getEligibleCombos(aa, new Set<SuitId>(['s']))).toBe(3)
  })
})
