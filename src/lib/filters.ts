import type { HandCell, RankIndex, SuitId } from '../types/poker'

/** Combo count for a hand type when all four suits are available. */
export function getFullComboCount(cell: HandCell): number {
  return cell.combos
}

export function isCellLocked(
  cell: HandCell,
  lockedRanks: Set<RankIndex>,
  pairsLocked = false,
): boolean {
  if (pairsLocked && cell.type === 'pair') return true
  return lockedRanks.has(cell.row) || lockedRanks.has(cell.col)
}

export function isComboLocked(comboKey: string, lockedSuits: Set<SuitId>): boolean {
  if (lockedSuits.size === 0) return false
  return comboKey.split('-').some((s) => lockedSuits.has(s as SuitId))
}
