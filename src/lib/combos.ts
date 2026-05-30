import { RANKS, SUITS, cellKey, type BoardCard, type CellState, type ComboDisposition, type HandCell, type SuitId } from '../types/poker'
import { isComboBlockedByBoard } from './board'
import { isComboLocked } from './filters'
import { ALL_CELLS } from './matrix'

export const SUIT_IDS = SUITS.map((s) => s.id) as SuitId[]

const SUIT_SYMBOL: Record<SuitId, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
}

export function getPairComboKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < SUIT_IDS.length; i++) {
    for (let j = i + 1; j < SUIT_IDS.length; j++) {
      keys.push(`${SUIT_IDS[i]}-${SUIT_IDS[j]}`)
    }
  }
  return keys
}

export function getSuitedComboKeys(): string[] {
  return [...SUIT_IDS]
}

export function getOffsuitComboKeys(): string[] {
  const keys: string[] = []
  for (const s1 of SUIT_IDS) {
    for (const s2 of SUIT_IDS) {
      if (s1 !== s2) keys.push(`${s1}-${s2}`)
    }
  }
  return keys
}

export function getCellComboKeys(cell: HandCell): string[] {
  switch (cell.type) {
    case 'pair':
      return getPairComboKeys()
    case 'suited':
      return getSuitedComboKeys()
    case 'offsuit':
      return getOffsuitComboKeys()
  }
}

export function isComboEligible(comboKey: string, excludedSuits: Set<SuitId>): boolean {
  return comboKey.split('-').every((s) => !excludedSuits.has(s as SuitId))
}

export function getEligibleCellComboKeys(
  cell: HandCell,
  excludedSuits: Set<SuitId>,
): string[] {
  return getCellComboKeys(cell).filter((key) => isComboEligible(key, excludedSuits))
}

export function formatComboLabel(cell: HandCell, comboKey: string): string {
  const high = RANKS[Math.min(cell.row, cell.col)]
  const low = RANKS[Math.max(cell.row, cell.col)]

  if (cell.type === 'suited') {
    const sym = SUIT_SYMBOL[comboKey as SuitId]
    return `${high}${sym}${low}${sym}`
  }

  const [s1, s2] = comboKey.split('-') as [SuitId, SuitId]
  if (cell.type === 'pair') {
    return `${high}${SUIT_SYMBOL[s1]}${high}${SUIT_SYMBOL[s2]}`
  }

  return `${high}${SUIT_SYMBOL[s1]}${low}${SUIT_SYMBOL[s2]}`
}

/** Suited: 2×2 grid (♠♥ / ♦♣) */
const SUITED_GRID: string[][] = [
  ['s', 'h'],
  ['d', 'c'],
]

/** Pairs: 2×3 grid */
const PAIR_GRID: string[][] = [
  ['s-h', 's-d', 's-c'],
  ['h-d', 'h-c', 'd-c'],
]

/** Offsuit: 3×4 grid — columns = high-card suit, rows = low-card suit slot */
function buildOffsuitGrid(): string[][] {
  const rows: string[][] = [[], [], []]
  for (let col = 0; col < SUIT_IDS.length; col++) {
    const high = SUIT_IDS[col]
    let rowIdx = 0
    for (const low of SUIT_IDS) {
      if (low === high) continue
      rows[rowIdx][col] = `${high}-${low}`
      rowIdx++
    }
  }
  return rows
}

const OFFSUIT_GRID = buildOffsuitGrid()

export interface ComboGridLayout {
  columns: number
  rows: number
  cells: (string | null)[][]
}

export function getComboGridLayout(
  cell: HandCell,
  excludedSuits: Set<SuitId>,
): ComboGridLayout {
  let template: string[][]

  switch (cell.type) {
    case 'suited':
      template = SUITED_GRID
      break
    case 'pair':
      template = PAIR_GRID
      break
    case 'offsuit':
      template = OFFSUIT_GRID
      break
  }

  const cells = template.map((row) =>
    row.map((key) => (isComboEligible(key, excludedSuits) ? key : null)),
  )

  return {
    columns: template[0]?.length ?? 0,
    rows: template.length,
    cells,
  }
}

export function getOrderedEligibleCombos(
  cell: HandCell,
  excludedSuits: Set<SuitId>,
): string[] {
  return getComboGridLayout(cell, excludedSuits)
    .cells.flat()
    .filter((key): key is string => key !== null)
}

export function getCombosInRange(
  cell: HandCell,
  lockedSuits: Set<SuitId>,
  rangeCombos: string[] | undefined,
  board: BoardCard[] = [],
): string[] {
  const allKeys = getCellComboKeys(cell)

  const inRange = rangeCombos
    ? rangeCombos.filter((key) => allKeys.includes(key))
    : allKeys

  return inRange.filter(
    (key) => isComboLocked(key, lockedSuits) || !isComboBlockedByBoard(cell, key, board),
  )
}

/** All combos that could remain in range (locked combos ignore board blocks). */
export function getMaxCombosInRange(
  cell: HandCell,
  lockedSuits: Set<SuitId>,
  board: BoardCard[] = [],
): string[] {
  return getCellComboKeys(cell).filter(
    (key) => isComboLocked(key, lockedSuits) || !isComboBlockedByBoard(cell, key, board),
  )
}

export function isPartialPaintRange(
  cell: HandCell,
  excludedSuits: Set<SuitId>,
  rangeCombos: string[] | undefined,
): boolean {
  if (!rangeCombos) return false
  const eligible = getOrderedEligibleCombos(cell, excludedSuits)
  return rangeCombos.length > 0 && rangeCombos.length < eligible.length
}

export function getComboDisposition(
  comboKey: string,
  cellState: 'in' | 'call' | 'fold',
  foldedComboKeys: Set<string>,
  calledComboKeys: Set<string>,
  lockedSuits: Set<SuitId> = new Set(),
): ComboDisposition {
  if (foldedComboKeys.has(comboKey)) return 'fold'
  if (calledComboKeys.has(comboKey)) return 'call'

  const hasPerCombo = foldedComboKeys.size > 0 || calledComboKeys.size > 0
  if (!hasPerCombo) {
    if (cellState === 'fold') {
      if (isComboLocked(comboKey, lockedSuits)) return 'in'
      return 'fold'
    }
    if (cellState === 'call') {
      if (isComboLocked(comboKey, lockedSuits)) return 'in'
      return 'call'
    }
  }

  return 'in'
}

export function isComboFolded(
  comboKey: string,
  cellState: 'in' | 'call' | 'fold',
  foldedComboKeys: Set<string>,
  calledComboKeys: Set<string> = new Set(),
  lockedSuits: Set<SuitId> = new Set(),
): boolean {
  return getComboDisposition(comboKey, cellState, foldedComboKeys, calledComboKeys, lockedSuits) === 'fold'
}

export function isComboDefended(
  comboKey: string,
  cellState: 'in' | 'call' | 'fold',
  foldedComboKeys: Set<string>,
  calledComboKeys: Set<string> = new Set(),
  lockedSuits: Set<SuitId> = new Set(),
): boolean {
  return getComboDisposition(comboKey, cellState, foldedComboKeys, calledComboKeys, lockedSuits) === 'call'
}

export function getExpandedComboSets(
  cellState: 'in' | 'call' | 'fold',
  foldedComboKeys: Set<string>,
  calledComboKeys: Set<string>,
  eligible: string[],
  lockedSuits: Set<SuitId> = new Set(),
): { folded: Set<string>; called: Set<string> } {
  const hasPerCombo = foldedComboKeys.size > 0 || calledComboKeys.size > 0
  const unlocked = eligible.filter((key) => !isComboLocked(key, lockedSuits))

  if (!hasPerCombo && cellState === 'fold') {
    return { folded: new Set(unlocked), called: new Set() }
  }
  if (!hasPerCombo && cellState === 'call') {
    return { folded: new Set(), called: new Set(unlocked) }
  }

  return {
    folded: new Set([...foldedComboKeys].filter((key) => eligible.includes(key))),
    called: new Set([...calledComboKeys].filter((key) => eligible.includes(key))),
  }
}

export function expandWholeCellFolds(
  cell: HandCell,
  cellState: 'in' | 'call' | 'fold',
  foldedComboKeys: Set<string>,
  excludedSuits: Set<SuitId>,
): Set<string> {
  return getExpandedComboSets(
    cellState,
    foldedComboKeys,
    new Set(),
    getEligibleCellComboKeys(cell, excludedSuits),
    excludedSuits,
  ).folded
}

export interface CellComboStats {
  folded: number
  defended: number
  untagged: number
  total: number
}

export function getCellComboStats(
  cell: HandCell,
  cellState: 'in' | 'call' | 'fold',
  foldedComboKeys: Set<string>,
  excludedSuits: Set<SuitId>,
  calledComboKeys: Set<string> = new Set(),
  inRangeCombos?: string[],
): CellComboStats {
  const eligible = inRangeCombos ?? getOrderedEligibleCombos(cell, excludedSuits)
  let folded = 0
  let defended = 0
  let untagged = 0

  for (const key of eligible) {
    const disposition = getComboDisposition(key, cellState, foldedComboKeys, calledComboKeys, excludedSuits)
    if (disposition === 'fold') folded++
    else if (disposition === 'call') defended++
    else untagged++
  }

  return { folded, defended, untagged, total: eligible.length }
}

export type DerivedCellState = 'in' | 'call' | 'fold' | 'mixed'

export function getDerivedCellState(stats: CellComboStats): DerivedCellState {
  if (stats.total === 0) return 'in'
  if (stats.folded === stats.total) return 'fold'
  if (stats.defended === stats.total) return 'call'
  if (stats.untagged === stats.total) return 'in'
  return 'mixed'
}

export function setsFromDisposition(
  folded: Set<string>,
  called: Set<string>,
  comboKey: string,
  disposition: ComboDisposition,
): { folded: Set<string>; called: Set<string> } {
  const nextFolded = new Set(folded)
  const nextCalled = new Set(called)
  nextFolded.delete(comboKey)
  nextCalled.delete(comboKey)

  if (disposition === 'fold') nextFolded.add(comboKey)
  if (disposition === 'call') nextCalled.add(comboKey)

  return { folded: nextFolded, called: nextCalled }
}

export function serializeComboSets(
  eligible: string[],
  folded: Set<string>,
  called: Set<string>,
): {
  foldedCombos?: string[]
  calledCombos?: string[]
} {
  const foldedKeys = eligible.filter((key) => folded.has(key))
  const calledKeys = eligible.filter((key) => called.has(key))

  return {
    ...(foldedKeys.length > 0 ? { foldedCombos: foldedKeys } : {}),
    ...(calledKeys.length > 0 ? { calledCombos: calledKeys } : {}),
  }
}

export interface PrunedRange {
  cellStates: Record<string, 'in'>
  rangeCombos: Record<string, string[]>
}

/** Drop folded combos from the continuing range after a street completes. */
export function pruneFoldedCombosFromRange(
  cellStates: Record<string, CellState>,
  foldedCombos: Record<string, string[]>,
  calledCombos: Record<string, string[]>,
  rangeCombos: Record<string, string[]>,
  excludedSuits: Set<SuitId>,
  board: BoardCard[],
): PrunedRange {
  const nextCellStates: Record<string, 'in'> = {}
  const nextRangeCombos: Record<string, string[]> = {}

  for (const cell of ALL_CELLS) {
    const key = cellKey(cell.row, cell.col)
    const cellState = cellStates[key]
    if (!cellState || cellState === 'out') continue

    const inRange = getCombosInRange(cell, excludedSuits, rangeCombos[key], board)
    const foldedSet = new Set(foldedCombos[key] ?? [])
    const calledSet = new Set(calledCombos[key] ?? [])

    const remaining = inRange.filter(
      (comboKey) =>
        isComboLocked(comboKey, excludedSuits) ||
        getComboDisposition(comboKey, cellState, foldedSet, calledSet, excludedSuits) !== 'fold',
    )

    if (remaining.length === 0) continue

    nextCellStates[key] = 'in'

    const maxInRange = getMaxCombosInRange(cell, excludedSuits, board)
    if (remaining.length < maxInRange.length) {
      nextRangeCombos[key] = remaining
    }
  }

  return { cellStates: nextCellStates, rangeCombos: nextRangeCombos }
}
