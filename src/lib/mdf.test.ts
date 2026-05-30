import { describe, it, expect } from 'vitest'
import { ALL_CELLS, TOTAL_DECK_COMBOS } from './matrix'
import { getFullComboCount, isCellLocked, isComboLocked } from './filters'
import {
  formatComboLabel,
  getCellComboStats,
  getComboDisposition,
  getComboGridLayout,
  getDerivedCellState,
  isComboFolded,
} from './combos'
import { computeFoldStats, getTargetFoldPct, getDeltaColor, computeMdfFoldPct, computeBetPctOfPot } from './mdf'
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

  it('skips locked combos on whole-cell fold', () => {
    const locked = new Set<SuitId>(['s'])
    expect(getComboDisposition('s', 'fold', new Set(), new Set(), locked)).toBe('in')
    expect(getComboDisposition('h', 'fold', new Set(), new Set(), locked)).toBe('fold')
  })

  it('lays out combo grids by hand type', () => {
    expect(getComboGridLayout(aks, new Set())).toMatchObject({ columns: 2, rows: 2 })
    expect(getComboGridLayout(aa, new Set())).toMatchObject({ columns: 3, rows: 2 })
    const ako = ALL_CELLS.find((c) => c.label === 'AKo')!
    expect(getComboGridLayout(ako, new Set())).toMatchObject({ columns: 4, rows: 3 })
  })
})

describe('mdf', () => {
  it('returns correct target for b50', () => {
    expect(getTargetFoldPct('b50')).toBe(33)
  })

  it('computes custom target from pot and bet', () => {
    expect(getTargetFoldPct('b50', '50', '100')).toBeCloseTo(33.33, 1)
    expect(computeMdfFoldPct(50, 100)).toBeCloseTo(33.33, 1)
    expect(computeBetPctOfPot(75, 100)).toBe(75)
  })

  it('falls back to preset when custom sizes are incomplete', () => {
    expect(getTargetFoldPct('b100', '50', '')).toBe(50)
    expect(getTargetFoldPct('b100', '', '100')).toBe(50)
  })

  it('computes fold percentage from combo weights', () => {
    const aa = ALL_CELLS.find((c) => c.label === 'AA')!
    const kk = ALL_CELLS.find((c) => c.label === 'KK')!
    const cellStates = {
      [cellKey(aa.row, aa.col)]: 'fold' as const,
      [cellKey(kk.row, kk.col)]: 'call' as const,
    }
    const stats = computeFoldStats(cellStates, {}, {}, {}, 'b50')

    expect(stats.folded).toBe(6)
    expect(stats.defended).toBe(6)
    expect(stats.total).toBe(12)
    expect(stats.currentPct).toBe(50)
  })

  it('counts per-combo folds regardless of suit locks', () => {
    const aks = ALL_CELLS.find((c) => c.label === 'AKs')!
    const cellStates = {
      [cellKey(aks.row, aks.col)]: 'in' as const,
    }
    const stats = computeFoldStats(
      cellStates,
      { [cellKey(aks.row, aks.col)]: ['s'] },
      {},
      {},
      'b50',
    )
    expect(stats.folded).toBe(1)
    expect(stats.untagged).toBe(3)
    expect(stats.total).toBe(4)
  })

  it('excludes locked combos from whole-cell fold in MDF stats', () => {
    const aks = ALL_CELLS.find((c) => c.label === 'AKs')!
    const cellStates = {
      [cellKey(aks.row, aks.col)]: 'fold' as const,
    }
    const stats = computeFoldStats(
      cellStates,
      {},
      {},
      {},
      'b50',
      [],
      '',
      '',
      new Set(['s']),
    )
    expect(stats.folded).toBe(3)
    expect(stats.untagged).toBe(1)
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

  it('locks cells by rank without removing them from range math', () => {
    expect(isCellLocked(cell, new Set<RankIndex>([0]))).toBe(true)
    const stats = computeFoldStats(
      { [cellKey(cell.row, cell.col)]: 'in' },
      {},
      {},
      {},
      'b50',
    )
    expect(stats.total).toBe(4)
  })

  it('locks pocket pairs when pairs lock is on', () => {
    const aa = ALL_CELLS.find((c) => c.label === 'AA')!
    expect(isCellLocked(aa, new Set(), true)).toBe(true)
    expect(isCellLocked(cell, new Set(), true)).toBe(false)
  })

  it('locks combos by suit', () => {
    expect(isComboLocked('s', new Set<SuitId>(['s']))).toBe(true)
    expect(isComboLocked('s-h', new Set<SuitId>(['s']))).toBe(true)
    expect(isComboLocked('h-d', new Set<SuitId>(['s']))).toBe(false)
  })

  it('reports full combo counts per hand type', () => {
    expect(getFullComboCount(cell)).toBe(4)
    expect(getFullComboCount(aa)).toBe(6)
  })
})
