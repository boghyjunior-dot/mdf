import { RANKS, SUITS, type BoardCard, type HandCell, type RankIndex, type Street, type SuitId } from '../types/poker'

export function boardCardId(card: BoardCard): string {
  return `${card.rank}-${card.suit}`
}

export function formatBoardCard(card: BoardCard): string {
  const suit = SUITS.find((s) => s.id === card.suit)!
  return `${RANKS[card.rank]}${suit.symbol}`
}

export function getStreet(board: BoardCard[]): Street {
  if (board.length >= 5) return 'river'
  if (board.length >= 4) return 'turn'
  if (board.length >= 3) return 'flop'
  return 'preflop'
}

export function comboToHoleCards(cell: HandCell, comboKey: string): BoardCard[] {
  const high = Math.min(cell.row, cell.col) as RankIndex
  const low = Math.max(cell.row, cell.col) as RankIndex

  if (cell.type === 'suited') {
    const suit = comboKey as SuitId
    return [
      { rank: high, suit },
      { rank: low, suit },
    ]
  }

  const [s1, s2] = comboKey.split('-') as [SuitId, SuitId]
  if (cell.type === 'pair') {
    return [
      { rank: high, suit: s1 },
      { rank: high, suit: s2 },
    ]
  }

  return [
    { rank: high, suit: s1 },
    { rank: low, suit: s2 },
  ]
}

export function isComboBlockedByBoard(
  cell: HandCell,
  comboKey: string,
  board: BoardCard[],
): boolean {
  if (board.length === 0) return false
  const blocked = new Set(board.map(boardCardId))
  return comboToHoleCards(cell, comboKey).some((hole) => blocked.has(boardCardId(hole)))
}

export function isBoardCardTaken(board: BoardCard[], index: number, card: BoardCard): boolean {
  const id = boardCardId(card)
  return board.some((existing, i) => i !== index && boardCardId(existing) === id)
}

export function shouldResetStreetDecision(
  prevBoard: BoardCard[],
  newBoard: BoardCard[],
): boolean {
  return getStreetBoundaryCrossed(prevBoard, newBoard) !== null
}

/** Returns which street boundary was crossed or changed (flop / turn / river). */
export function getStreetBoundaryCrossed(
  prevBoard: BoardCard[],
  newBoard: BoardCard[],
): 'flop' | 'turn' | 'river' | null {
  if (newBoard.length >= 3 && prevBoard.length < 3) return 'flop'
  if (newBoard.length >= 4 && prevBoard.length < 4) return 'turn'
  if (newBoard.length >= 5 && prevBoard.length < 5) return 'river'

  if (newBoard.length >= 3 && prevBoard.length >= 3 && flopCardsChanged(prevBoard, newBoard)) {
    return 'flop'
  }
  if (newBoard.length >= 4 && prevBoard.length >= 4 && turnCardChanged(prevBoard, newBoard)) {
    return 'turn'
  }
  if (newBoard.length >= 5 && prevBoard.length >= 5 && riverCardChanged(prevBoard, newBoard)) {
    return 'river'
  }

  return null
}

function flopCardsChanged(prevBoard: BoardCard[], newBoard: BoardCard[]): boolean {
  for (let i = 0; i < 3; i++) {
    if (boardCardId(prevBoard[i]) !== boardCardId(newBoard[i])) return true
  }
  return false
}

function turnCardChanged(prevBoard: BoardCard[], newBoard: BoardCard[]): boolean {
  return boardCardId(prevBoard[3]) !== boardCardId(newBoard[3])
}

function riverCardChanged(prevBoard: BoardCard[], newBoard: BoardCard[]): boolean {
  return boardCardId(prevBoard[4]) !== boardCardId(newBoard[4])
}

export function buildBoardFromSlots(slots: (BoardCard | null)[]): BoardCard[] {
  const board: BoardCard[] = []
  for (const slot of slots) {
    if (!slot) break
    board.push(slot)
  }
  return board
}

export const BOARD_SLOT_LABELS = ['Flop 1', 'Flop 2', 'Flop 3', 'Turn', 'River'] as const
