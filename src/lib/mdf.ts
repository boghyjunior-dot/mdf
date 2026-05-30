import { ALL_CELLS } from './matrix'
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
  type SuitId,
} from '../types/poker'

/** Bet size as a percentage of the current pot (e.g. 50 → half-pot). */
export function computeBetPctOfPot(bet: number, pot: number): number {
  if (pot <= 0 || bet < 0) return 0
  return (bet / pot) * 100
}

/** MDF target fold % from pot and bet: bet / (pot + bet). */
export function computeMdfFoldPct(bet: number, pot: number): number {
  if (bet < 0 || pot < 0) return 0
  const total = pot + bet
  if (total <= 0) return 0
  return (bet / total) * 100
}

export function parseCustomSize(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function getTargetFoldPct(
  betLabel: string,
  customBet: string = '',
  customPot: string = '',
): number {
  const bet = parseCustomSize(customBet)
  const pot = parseCustomSize(customPot)
  if (bet != null && pot != null) {
    return computeMdfFoldPct(bet, pot)
  }
  return MDF_BETS.find((b) => b.label === betLabel)?.foldPct ?? MDF_BETS[3].foldPct
}

export function computeFoldStats(
  cellStates: Record<string, CellState>,
  foldedCombos: Record<string, string[]>,
  calledCombos: Record<string, string[]>,
  rangeCombos: Record<string, string[]>,
  betLabel: string,
  board: BoardCard[] = [],
  customBet: string = '',
  customPot: string = '',
  lockedSuits: Set<SuitId> = new Set(),
): FoldStats {
  let folded = 0
  let defended = 0
  let untagged = 0

  for (const cell of ALL_CELLS) {
    const key = cellKey(cell.row, cell.col)
    const state = cellStates[key] ?? 'out'
    if (state === 'out') continue

    const foldedSet = new Set(foldedCombos[key] ?? [])
    const calledSet = new Set(calledCombos[key] ?? [])
    const inRangeKeys = getCombosInRange(cell, lockedSuits, rangeCombos[key], board)
    if (inRangeKeys.length === 0) continue

    for (const comboKey of inRangeKeys) {
      const disposition = getComboDisposition(comboKey, state, foldedSet, calledSet, lockedSuits)
      if (disposition === 'fold') folded++
      else if (disposition === 'call') defended++
      else untagged++
    }
  }

  const total = folded + defended + untagged
  const currentPct = total > 0 ? (folded / total) * 100 : 0
  const targetPct = getTargetFoldPct(betLabel, customBet, customPot)

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
