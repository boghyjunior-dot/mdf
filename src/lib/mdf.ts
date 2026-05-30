import { ALL_CELLS } from './matrix'
import { getCellFilterStatus } from './filters'
import {
  getComboDisposition,
  getCombosInRange,
} from './combos'
import {
  MDF_BETS,
  cellKey,
  type BoardCard,
  type CellState,
  type FoldStats,
  type RankIndex,
  type RangeFilters,
  type SuitId,
} from '../types/poker'
import { comboMatchesDrawFilters } from './draws'

export function getTargetFoldPct(betLabel: string): number {
  return MDF_BETS.find((b) => b.label === betLabel)?.foldPct ?? MDF_BETS[3].foldPct
}

export function computeFoldStats(
  cellStates: Record<string, CellState>,
  foldedCombos: Record<string, string[]>,
  calledCombos: Record<string, string[]>,
  rangeCombos: Record<string, string[]>,
  excludedRanks: Set<RankIndex>,
  rangeFilters: RangeFilters,
  excludedSuits: Set<SuitId>,
  betLabel: string,
  board: BoardCard[] = [],
): FoldStats {
  let folded = 0
  let defended = 0
  let untagged = 0

  for (const cell of ALL_CELLS) {
    const key = cellKey(cell.row, cell.col)
    const state = cellStates[key] ?? 'out'
    if (state === 'out') continue

    const { excluded } = getCellFilterStatus(
      cell,
      excludedRanks,
      rangeFilters,
      excludedSuits,
      board,
    )
    if (excluded) continue

    const foldedSet = new Set(foldedCombos[key] ?? [])
    const calledSet = new Set(calledCombos[key] ?? [])
    const inRangeKeys = getCombosInRange(cell, excludedSuits, rangeCombos[key], board)
    if (inRangeKeys.length === 0) continue

    for (const comboKey of inRangeKeys) {
      if (!comboMatchesDrawFilters(cell, comboKey, board, rangeFilters)) continue
      const disposition = getComboDisposition(comboKey, state, foldedSet, calledSet)
      if (disposition === 'fold') folded++
      else if (disposition === 'call') defended++
      else untagged++
    }
  }

  const total = folded + defended + untagged
  const currentPct = total > 0 ? (folded / total) * 100 : 0
  const targetPct = getTargetFoldPct(betLabel)

  return {
    folded,
    defended,
    untagged,
    total,
    currentPct,
    targetPct,
    delta: currentPct - targetPct,
  }
}

export function getDeltaColor(delta: number): 'green' | 'yellow' | 'red' {
  const abs = Math.abs(delta)
  if (abs <= 1) return 'green'
  if (abs <= 3) return 'yellow'
  return 'red'
}
