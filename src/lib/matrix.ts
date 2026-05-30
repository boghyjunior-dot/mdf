import {
  RANKS,
  type HandCell,
  type HandType,
  type RankIndex,
} from '../types/poker'

export function getHandType(row: RankIndex, col: RankIndex): HandType {
  if (row === col) return 'pair'
  if (row < col) return 'suited'
  return 'offsuit'
}

export function getComboCount(type: HandType): number {
  switch (type) {
    case 'pair':
      return 6
    case 'suited':
      return 4
    case 'offsuit':
      return 12
  }
}

export function getHandLabel(row: RankIndex, col: RankIndex): string {
  const high = RANKS[Math.min(row, col)]
  const low = RANKS[Math.max(row, col)]
  const type = getHandType(row, col)

  if (type === 'pair') return `${high}${high}`
  if (type === 'suited') return `${high}${low}s`
  return `${high}${low}o`
}

function buildCell(row: RankIndex, col: RankIndex): HandCell {
  const type = getHandType(row, col)
  return {
    row,
    col,
    type,
    label: getHandLabel(row, col),
    combos: getComboCount(type),
  }
}

export const ALL_CELLS: HandCell[] = []
for (let row = 0; row < 13; row++) {
  for (let col = 0; col < 13; col++) {
    ALL_CELLS.push(buildCell(row as RankIndex, col as RankIndex))
  }
}

export const TOTAL_DECK_COMBOS = ALL_CELLS.reduce((sum, cell) => sum + cell.combos, 0)
