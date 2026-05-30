import { RANKS, cellKey, type CellState, type Rank, type RankIndex } from '../types/poker'
import { ALL_CELLS } from './matrix'

export interface PredefinedRange {
  id: string
  label: string
  category: string
  description: string
  tokens: string[]
}

const LABEL_TO_CELL = new Map(ALL_CELLS.map((cell) => [cell.label, cell]))

function rankIndex(rank: string): RankIndex {
  const idx = RANKS.indexOf(rank as Rank)
  if (idx < 0) throw new Error(`Invalid rank: ${rank}`)
  return idx as RankIndex
}

/** Expand one token like `TT+`, `AJs+`, `AKs`, or `KQo`. */
export function expandHandToken(token: string): string[] {
  const trimmed = token.trim()
  if (!trimmed) return []

  const pairPlus = trimmed.match(/^([AKQJT98765432])\1\+$/)
  if (pairPlus) {
    const start = rankIndex(pairPlus[1])
    const hands: string[] = []
    for (let r = start; r >= 0; r--) {
      hands.push(`${RANKS[r]}${RANKS[r]}`)
    }
    return hands
  }

  const suitedPlus = trimmed.match(/^([AKQJT98765432])([AKQJT98765432])s\+$/)
  if (suitedPlus) {
    const high = rankIndex(suitedPlus[1])
    const low = rankIndex(suitedPlus[2])
    if (high >= low) return []
    const hands: string[] = []
    for (let l = low; l > high; l--) {
      hands.push(`${RANKS[high]}${RANKS[l]}s`)
    }
    return hands
  }

  const offsuitPlus = trimmed.match(/^([AKQJT98765432])([AKQJT98765432])o\+$/)
  if (offsuitPlus) {
    const high = rankIndex(offsuitPlus[1])
    const low = rankIndex(offsuitPlus[2])
    if (high >= low) return []
    const hands: string[] = []
    for (let l = low; l > high; l--) {
      hands.push(`${RANKS[high]}${RANKS[l]}o`)
    }
    return hands
  }

  const pairExact = trimmed.match(/^([AKQJT98765432])\1$/)
  if (pairExact) {
    return [`${pairExact[1]}${pairExact[1]}`]
  }

  const exactWithSuffix = trimmed.match(/^([AKQJT98765432])([AKQJT98765432])([so])$/)
  if (exactWithSuffix) {
    const high = rankIndex(exactWithSuffix[1])
    const low = rankIndex(exactWithSuffix[2])
    if (high >= low) return []
    return [`${RANKS[high]}${RANKS[low]}${exactWithSuffix[3]}`]
  }

  if (LABEL_TO_CELL.has(trimmed)) return [trimmed]

  return []
}

export function expandRangeTokens(tokens: string[]): string[] {
  const labels = new Set<string>()
  for (const token of tokens) {
    for (const label of expandHandToken(token)) {
      labels.add(label)
    }
  }
  return [...labels]
}

export function parsePredefinedRange(range: PredefinedRange): Record<string, CellState> {
  const labels = expandRangeTokens(range.tokens)
  const cellStates: Record<string, CellState> = {}

  for (const label of labels) {
    const cell = LABEL_TO_CELL.get(label)
    if (cell) {
      cellStates[cellKey(cell.row, cell.col)] = 'in'
    }
  }

  return cellStates
}

export function countRangeCombos(cellStates: Record<string, CellState>): number {
  let total = 0
  for (const cell of ALL_CELLS) {
    const key = cellKey(cell.row, cell.col)
    if (cellStates[key] === 'in') total += cell.combos
  }
  return total
}

export const PREDEFINED_RANGES: PredefinedRange[] = [
  {
    id: 'utg-open',
    label: 'UTG open',
    category: 'Open raise',
    description: 'Tight ~15% UTG open range',
    tokens: ['77+', 'ATs+', 'KQs', 'KJs', 'QJs', 'JTs', 'T9s', '98s', 'AKo', 'AQo', 'AJo', 'KQo'],
  },
  {
    id: 'hj-open',
    label: 'HJ open',
    category: 'Open raise',
    description: 'Typical ~18% hijack open',
    tokens: ['66+', 'A9s+', 'K9s+', 'Q9s+', 'J9s+', 'T8s+', '98s', '87s', '76s', 'AKo', 'AQo', 'AJo', 'ATo', 'KQo', 'KJo'],
  },
  {
    id: 'co-open',
    label: 'CO open',
    category: 'Open raise',
    description: 'Typical ~28% cutoff open',
    tokens: [
      '55+', 'A2s+', 'K5s+', 'Q8s+', 'J8s+', 'T7s+', '96s+', '85s+', '75s', '65s', '54s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo',
    ],
  },
  {
    id: 'btn-open',
    label: 'BTN open',
    category: 'Open raise',
    description: 'Wide ~45% button open',
    tokens: [
      '22+', 'A2s+', 'K2s+', 'Q2s+', 'J4s+', 'T6s+', '95s+', '84s+', '74s+', '64s+', '53s+', '43s',
      'A2o+', 'K5o+', 'Q8o+', 'J8o+', 'T8o+', '98o',
    ],
  },
  {
    id: 'sb-open',
    label: 'SB open',
    category: 'Open raise',
    description: 'Wide ~50% small blind open',
    tokens: [
      '22+', 'A2s+', 'K2s+', 'Q2s+', 'J2s+', 'T4s+', '94s+', '84s+', '73s+', '63s+', '53s+', '43s',
      'A2o+', 'K2o+', 'Q4o+', 'J7o+', 'T7o+', '97o+', '87o',
    ],
  },
  {
    id: 'bb-vs-btn',
    label: 'BB vs BTN',
    category: 'Defend',
    description: 'BB defend vs button open ~50%',
    tokens: [
      '22+', 'A2s+', 'K2s+', 'Q2s+', 'J2s+', 'T2s+', '92s+', '82s+', '72s+', '62s+', '52s+', '42s+', '32s',
      'A2o+', 'K2o+', 'Q2o+', 'J4o+', 'T6o+', '96o+', '86o+', '76o', '65o', '54o',
    ],
  },
  {
    id: 'bb-vs-co',
    label: 'BB vs CO',
    category: 'Defend',
    description: 'BB defend vs cutoff open ~38%',
    tokens: [
      '22+', 'A2s+', 'K2s+', 'Q4s+', 'J6s+', 'T6s+', '95s+', '85s+', '75s+', '64s+', '54s', '43s',
      'A2o+', 'K5o+', 'Q8o+', 'J8o+', 'T8o+', '98o', '87o',
    ],
  },
  {
    id: 'bb-vs-sb',
    label: 'BB vs SB',
    category: 'Defend',
    description: 'BB defend vs small blind open ~55%',
    tokens: [
      '22+', 'A2s+', 'K2s+', 'Q2s+', 'J2s+', 'T2s+', '92s+', '82s+', '72s+', '62s+', '52s+', '42s+', '32s',
      'A2o+', 'K2o+', 'Q2o+', 'J2o+', 'T4o+', '94o+', '84o+', '74o+', '64o+', '54o',
    ],
  },
  {
    id: 'top-10',
    label: 'Top 10%',
    category: 'Study',
    description: 'Strong ~10% range for MDF drills',
    tokens: ['88+', 'A9s+', 'A5s', 'KTs+', 'QTs+', 'JTs', 'T9s', '98s', 'AKo', 'AQo', 'AJo', 'KQo'],
  },
  {
    id: 'top-20',
    label: 'Top 20%',
    category: 'Study',
    description: 'Strong ~20% range for MDF drills',
    tokens: ['66+', 'A2s+', 'K9s+', 'Q9s+', 'J9s+', 'T8s+', '98s', '87s', '76s', 'AKo', 'AQo', 'AJo', 'ATo', 'KQo', 'KJo'],
  },
  {
    id: 'top-30',
    label: 'Top 30%',
    category: 'Study',
    description: 'Top ~30% of hands by combo weight',
    tokens: [
      '55+', 'A2s+', 'K7s+', 'Q8s+', 'J9s+', 'T8s+', '98s', '87s', '76s', '65s', '54s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'KQo', 'KJo', 'KTo', 'K9o',
      'QJo', 'QTo', 'Q9o', 'JTo', 'J9o', 'T9o', '98o',
    ],
  },
  {
    id: 'top-40',
    label: 'Top 40%',
    category: 'Study',
    description: 'Top ~40% of hands by combo weight',
    tokens: [
      '33+', 'A2s+', 'K5s+', 'Q7s+', 'J7s+', 'T6s+', '96s+', '85s+', '75s', '65s', '54s', '43s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
      'QJo', 'QTo', 'Q9o', 'Q8o', 'JTo', 'J9o', 'J8o', 'T9o', 'T8o', '98o', '87o',
    ],
  },
  {
    id: 'top-50',
    label: 'Top 50%',
    category: 'Study',
    description: 'Top ~50% of hands by combo weight',
    tokens: [
      '22+', 'A2s+', 'K2s+', 'Q2s+', 'J4s+', 'T6s+', '95s+', '84s+', '74s+', '64s+', '53s+',
      'A2o+', 'K5o+', 'Q8o+', 'J8o+', 'T8o+',
    ],
  },
  {
    id: 'top-60',
    label: 'Top 60%',
    category: 'Study',
    description: 'Top ~60% of hands by combo weight',
    tokens: [
      '22+', 'A2s+', 'K2s+', 'Q3s+', 'J5s+', 'T5s+', '94s+', '84s+', '73s+', '63s+', '53s+', '43s', '32s',
      'A2o+', 'K6o+', 'Q7o+', 'J8o+', 'T8o+', '97o+', '86o+', '75o+', '64o+', '54o', '43o',
    ],
  },
  {
    id: 'top-70',
    label: 'Top 70%',
    category: 'Study',
    description: 'Top ~70% of hands by combo weight',
    tokens: [
      '22+', 'A2s+', 'K2s+', 'Q2s+', 'J3s+', 'T4s+', '94s+', '84s+', '73s+', '63s+', '53s+', '43s',
      'A2o+', 'K3o+', 'Q5o+', 'J6o+', 'T7o+', '96o+', '85o+', '74o+', '64o+', '54o',
    ],
  },
  {
    id: 'top-80',
    label: 'Top 80%',
    category: 'Study',
    description: 'Top ~80% of hands by combo weight',
    tokens: [
      '22+', 'A2s+', 'K2s+', 'Q2s+', 'J3s+', 'T3s+', '93s+', '83s+', '73s+', '63s+', '53s+', '43s', '32s',
      'A2o+', 'K2o+', 'Q4o+', 'J5o+', 'T6o+', '95o+', '84o+', '73o+', '63o+', '53o+', '43o',
    ],
  },
]

export function getPredefinedRange(id: string): PredefinedRange | undefined {
  return PREDEFINED_RANGES.find((range) => range.id === id)
}

export function getPredefinedRangeCategories(): string[] {
  return [...new Set(PREDEFINED_RANGES.map((range) => range.category))]
}
