import type { BoardCard, HandCell, RankIndex, RangeFilters, SuitId } from '../types/poker'
import { comboMatchesDrawFilters, hasAnyDrawFilterActive } from './draws'
import { comboToHoleCards } from './board'
import { getCellComboKeys, isComboEligible } from './combos'

export function getEligibleCombos(cell: HandCell, excludedSuits: Set<SuitId>): number {
  const n = 4 - excludedSuits.size
  if (n <= 0) return 0

  switch (cell.type) {
    case 'pair':
      return n >= 2 ? (n * (n - 1)) / 2 : 0
    case 'suited':
      return n
    case 'offsuit':
      return n >= 2 ? n * (n - 1) : 0
  }
}

function countMatchingCombos(
  cell: HandCell,
  excludedSuits: Set<SuitId>,
  board: BoardCard[],
  rangeFilters: RangeFilters,
): number {
  return getCellComboKeys(cell).filter((comboKey) => {
    if (!isComboEligible(comboKey, excludedSuits)) return false
    const holeCards = comboToHoleCards(cell, comboKey)
    if (board.some((card) => holeCards.some((hole) => hole.rank === card.rank && hole.suit === card.suit))) {
      return false
    }
    return comboMatchesDrawFilters(cell, comboKey, board, rangeFilters)
  }).length
}

export function isCellExcluded(
  cell: HandCell,
  excludedRanks: Set<RankIndex>,
  rangeFilters: RangeFilters,
  excludedSuits: Set<SuitId>,
  board: BoardCard[],
): boolean {
  if (excludedRanks.has(cell.row) || excludedRanks.has(cell.col)) {
    return true
  }
  if (rangeFilters.excludePairs && cell.type === 'pair') return true

  const eligibleCombos = getEligibleCombos(cell, excludedSuits)
  if (eligibleCombos === 0) return true

  if (board.length >= 3 && hasAnyDrawFilterActive(rangeFilters)) {
    return countMatchingCombos(cell, excludedSuits, board, rangeFilters) === 0
  }

  return false
}

export interface CellFilterStatus {
  excluded: boolean
  partial: boolean
  eligibleCombos: number
}

export function getCellFilterStatus(
  cell: HandCell,
  excludedRanks: Set<RankIndex>,
  rangeFilters: RangeFilters,
  excludedSuits: Set<SuitId>,
  board: BoardCard[] = [],
): CellFilterStatus {
  if (excludedRanks.has(cell.row) || excludedRanks.has(cell.col)) {
    return { excluded: true, partial: false, eligibleCombos: 0 }
  }
  if (rangeFilters.excludePairs && cell.type === 'pair') {
    return { excluded: true, partial: false, eligibleCombos: 0 }
  }

  const totalEligible = getEligibleCombos(cell, excludedSuits)
  if (totalEligible === 0) {
    return { excluded: true, partial: false, eligibleCombos: 0 }
  }

  if (board.length >= 3 && hasAnyDrawFilterActive(rangeFilters)) {
    const matchingCombos = countMatchingCombos(cell, excludedSuits, board, rangeFilters)
    if (matchingCombos === 0) {
      return { excluded: true, partial: false, eligibleCombos: 0 }
    }
    if (matchingCombos < totalEligible) {
      return { excluded: false, partial: true, eligibleCombos: matchingCombos }
    }
    return { excluded: false, partial: false, eligibleCombos: matchingCombos }
  }

  if (totalEligible < cell.combos) {
    return { excluded: false, partial: true, eligibleCombos: totalEligible }
  }

  return { excluded: false, partial: false, eligibleCombos: totalEligible }
}
