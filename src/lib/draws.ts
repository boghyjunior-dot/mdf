import { comboToHoleCards } from './board'
import { SUIT_IDS } from './combos'
import type { BoardCard, HandCell, RankIndex, RangeFilters } from '../types/poker'

const STRAIGHT_TEMPLATES: RankIndex[][] = [
  ...Array.from({ length: 9 }, (_, i) => [i, i + 1, i + 2, i + 3, i + 4] as RankIndex[]),
  [0, 9, 10, 11, 12],
]

const WHEEL_TEMPLATE = STRAIGHT_TEMPLATES[STRAIGHT_TEMPLATES.length - 1]

function isWheelTemplate(template: RankIndex[]): boolean {
  return template === WHEEL_TEMPLATE
}

interface StraightAnalysis {
  made: boolean
  oesd: boolean
  gutshot: boolean
}

function analyzeStraightDraw(holeCards: BoardCard[], board: BoardCard[]): StraightAnalysis {
  const cards = [...holeCards, ...board]
  const ranks = new Set(cards.map((c) => c.rank))
  const holeRanks = new Set(holeCards.map((c) => c.rank))
  let made = false
  let oesd = false
  let gutshot = false

  for (const template of STRAIGHT_TEMPLATES) {
    const present = template.filter((rank) => ranks.has(rank))
    if (present.length === 5) {
      made = true
      continue
    }
    if (present.length !== 4) continue
    if (!present.some((rank) => holeRanks.has(rank))) continue

    const missingIdx = template.findIndex((rank) => !ranks.has(rank))
    if (isWheelTemplate(template)) {
      gutshot = true
    } else if (missingIdx === 0 || missingIdx === 4) {
      oesd = true
    } else {
      gutshot = true
    }
  }

  if (made) return { made: true, oesd: false, gutshot: false }
  return { made: false, oesd, gutshot }
}

export function hasFlushDraw(holeCards: BoardCard[], board: BoardCard[]): boolean {
  if (board.length < 3) return false

  const all = [...holeCards, ...board]
  for (const suit of SUIT_IDS) {
    const inSuit = all.filter((c) => c.suit === suit)
    const holeInSuit = holeCards.filter((c) => c.suit === suit)
    if (inSuit.length === 4 && holeInSuit.length >= 1) return true
  }
  return false
}

export function hasOpenEndedStraightDraw(holeCards: BoardCard[], board: BoardCard[]): boolean {
  if (board.length < 3) return false
  const { made, oesd } = analyzeStraightDraw(holeCards, board)
  return !made && oesd
}

export function hasGutshot(holeCards: BoardCard[], board: BoardCard[]): boolean {
  if (board.length < 3) return false
  const { made, oesd, gutshot } = analyzeStraightDraw(holeCards, board)
  return !made && !oesd && gutshot
}

export function hasAnyDrawFilterActive(filters: RangeFilters): boolean {
  return filters.onlyFlushDraw || filters.onlyStraightDraw || filters.onlyGutshot
}

export function comboMatchesDrawFilters(
  cell: HandCell,
  comboKey: string,
  board: BoardCard[],
  filters: RangeFilters,
): boolean {
  if (board.length < 3 || !hasAnyDrawFilterActive(filters)) return true

  const holeCards = comboToHoleCards(cell, comboKey)
  const flushDraw = hasFlushDraw(holeCards, board)
  const straightDraw = hasOpenEndedStraightDraw(holeCards, board)
  const gutshot = hasGutshot(holeCards, board)

  if (filters.onlyFlushDraw && flushDraw) return true
  if (filters.onlyStraightDraw && straightDraw) return true
  if (filters.onlyGutshot && gutshot) return true
  return false
}
