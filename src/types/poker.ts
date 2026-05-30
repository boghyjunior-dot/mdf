export const SUITS = [
  { id: 's', symbol: '♠', label: 'Spades', color: 'text-slate-200' },
  { id: 'h', symbol: '♥', label: 'Hearts', color: 'text-red-400' },
  { id: 'd', symbol: '♦', label: 'Diamonds', color: 'text-blue-400' },
  { id: 'c', symbol: '♣', label: 'Clubs', color: 'text-emerald-400' },
] as const

export type SuitId = (typeof SUITS)[number]['id']

/** Four-color deck styling (spades black, hearts red, diamonds blue, clubs green). */
export const SUIT_FOUR_COLOR: Record<
  SuitId,
  { text: string; deckBg: string; deckBorder: string; rowBg: string; rowText: string }
> = {
  s: {
    text: 'text-slate-900',
    deckBg: 'bg-slate-100',
    deckBorder: 'border-slate-400',
    rowBg: 'bg-slate-300',
    rowText: 'text-slate-900',
  },
  h: {
    text: 'text-red-700',
    deckBg: 'bg-red-200',
    deckBorder: 'border-red-400',
    rowBg: 'bg-red-400',
    rowText: 'text-white',
  },
  d: {
    text: 'text-blue-700',
    deckBg: 'bg-blue-200',
    deckBorder: 'border-blue-400',
    rowBg: 'bg-blue-400',
    rowText: 'text-white',
  },
  c: {
    text: 'text-emerald-800',
    deckBg: 'bg-emerald-200',
    deckBorder: 'border-emerald-500',
    rowBg: 'bg-emerald-500',
    rowText: 'text-white',
  },
}

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const

export type Rank = (typeof RANKS)[number]
export type RankIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export type HandType = 'pair' | 'suited' | 'offsuit'
export type CellState = 'out' | 'in' | 'call' | 'fold'
export type InteractionMode = 'paint' | 'call' | 'fold' | 'selectCombos' | 'erase'
export type ComboDisposition = 'fold' | 'call' | 'in'
export type PaintFrequency = 100 | 50 | 25

export interface BoardCard {
  rank: RankIndex
  suit: SuitId
}

export type Street = 'preflop' | 'flop' | 'turn' | 'river'

export const STREET_LABELS: Record<Street, string> = {
  preflop: 'Preflop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
}

export interface HandCell {
  row: RankIndex
  col: RankIndex
  type: HandType
  label: string
  combos: number
}

export interface MdfBet {
  label: string
  foldPct: number
}

export const MDF_BETS: MdfBet[] = [
  { label: 'b25', foldPct: 20 },
  { label: 'b33', foldPct: 25 },
  { label: 'b40', foldPct: 28 },
  { label: 'b50', foldPct: 33 },
  { label: 'b67', foldPct: 40 },
  { label: 'b75', foldPct: 42 },
  { label: 'b100', foldPct: 50 },
  { label: 'b120', foldPct: 54 },
  { label: 'b150', foldPct: 60 },
  { label: 'b200', foldPct: 66 },
]

export interface RangeFilters {
  excludePairs: boolean
  onlyFlushDraw: boolean
  onlyStraightDraw: boolean
  onlyGutshot: boolean
}

/** @deprecated Use RangeFilters */
export type SuitFilters = RangeFilters

export interface FoldStats {
  folded: number
  defended: number
  untagged: number
  total: number
  currentPct: number
  targetPct: number
  delta: number
}

export function cellKey(row: RankIndex, col: RankIndex): string {
  return `${row}-${col}`
}
