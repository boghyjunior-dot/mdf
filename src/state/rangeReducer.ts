import {
  cellKey,
  type BoardCard,
  type CellState,
  type ComboDisposition,
  type InteractionMode,
  type PaintFrequency,
  type RankIndex,
  type RangeFilters,
  type SuitId,
} from '../types/poker'
import {
  getCombosForPaintFrequency,
  getCombosInRange,
  getEligibleCellComboKeys,
  getExpandedComboSets,
  pruneFoldedCombosFromRange,
  serializeComboSets,
  setsFromDisposition,
} from '../lib/combos'
import { isBoardCardTaken, shouldResetStreetDecision } from '../lib/board'
import { getPredefinedRange, parsePredefinedRange } from '../lib/predefinedRanges'
import { ALL_CELLS } from '../lib/matrix'

const STORAGE_KEY = 'mdf-range-tool-state'

export interface SelectedCell {
  row: RankIndex
  col: RankIndex
}

export interface AppState {
  cellStates: Record<string, CellState>
  foldedCombos: Record<string, string[]>
  calledCombos: Record<string, string[]>
  rangeCombos: Record<string, string[]>
  board: BoardCard[]
  mode: InteractionMode
  paintFrequency: PaintFrequency
  betLabel: string
  excludedRanks: RankIndex[]
  excludedSuits: SuitId[]
  selectedCell: SelectedCell | null
  suitFilters: RangeFilters
  isDragging: boolean
}

export type AppAction =
  | { type: 'SET_CELL'; row: RankIndex; col: RankIndex }
  | { type: 'ERASE_CELL'; row: RankIndex; col: RankIndex }
  | { type: 'SET_MODE'; mode: InteractionMode }
  | { type: 'SET_PAINT_FREQUENCY'; frequency: PaintFrequency }
  | { type: 'SET_BET'; betLabel: string }
  | { type: 'SET_BOARD_CARD'; index: number; card: BoardCard | null }
  | { type: 'CLEAR_BOARD' }
  | { type: 'TOGGLE_RANK'; rank: RankIndex }
  | { type: 'TOGGLE_EXCLUDED_SUIT'; suit: SuitId }
  | { type: 'SET_COMBO_DISPOSITION'; row: RankIndex; col: RankIndex; comboKey: string; disposition: ComboDisposition }
  | { type: 'SET_ALL_COMBO_DISPOSITIONS'; row: RankIndex; col: RankIndex; disposition: ComboDisposition }
  | { type: 'SELECT_CELL'; row: RankIndex; col: RankIndex } | { type: 'CLEAR_SELECTED_CELL' }
  | { type: 'TOGGLE_RANGE_FILTER'; filter: keyof RangeFilters }
  | { type: 'RESET_FILTERS' }
  | { type: 'CLEAR_RANGE' }
  | { type: 'LOAD_PREDEFINED_RANGE'; rangeId: string }
  | { type: 'SET_DRAGGING'; isDragging: boolean }
  | { type: 'LOAD_STATE'; state: Partial<AppState> }

export const initialState: AppState = {
  cellStates: {},
  foldedCombos: {},
  calledCombos: {},
  rangeCombos: {},
  board: [],
  mode: 'selectCombos',
  paintFrequency: 100,
  betLabel: 'b50',
  excludedRanks: [],
  excludedSuits: [],
  selectedCell: null,
  suitFilters: {
    excludePairs: false,
    onlyFlushDraw: false,
    onlyStraightDraw: false,
    onlyGutshot: false,
  },
  isDragging: false,
}

function getCell(row: RankIndex, col: RankIndex) {
  return ALL_CELLS.find((c) => c.row === row && c.col === col)!
}

function clearCellComboTags(
  foldedCombos: Record<string, string[]>,
  calledCombos: Record<string, string[]>,
  rangeCombos: Record<string, string[]>,
  key: string,
): {
  foldedCombos: Record<string, string[]>
  calledCombos: Record<string, string[]>
  rangeCombos: Record<string, string[]>
} {
  let nextFolded = foldedCombos
  let nextCalled = calledCombos
  let nextRange = rangeCombos

  if (key in foldedCombos) {
    nextFolded = { ...foldedCombos }
    delete nextFolded[key]
  }
  if (key in calledCombos) {
    nextCalled = { ...calledCombos }
    delete nextCalled[key]
  }
  if (key in rangeCombos) {
    nextRange = { ...rangeCombos }
    delete nextRange[key]
  }

  return { foldedCombos: nextFolded, calledCombos: nextCalled, rangeCombos: nextRange }
}

function nextCycleState(current: CellState): CellState {
  if (current === 'call') return 'fold'
  if (current === 'fold') return 'in'
  return 'call'
}

function applyModeToCell(current: CellState, mode: InteractionMode): CellState {
  switch (mode) {
    case 'selectCombos':
      return current
    case 'erase':
      return 'out'
    case 'call':
      if (current === 'out') return 'out'
      if (current === 'in') return 'call'
      return nextCycleState(current)
    case 'fold':
      if (current === 'out') return 'out'
      if (current === 'in') return 'fold'
      if (current === 'fold') return 'in'
      if (current === 'call') return 'fold'
      return 'fold'
    case 'paint':
      return 'in'
  }
}

function paintCell(
  state: AppState,
  row: RankIndex,
  col: RankIndex,
): Pick<AppState, 'cellStates' | 'foldedCombos' | 'calledCombos' | 'rangeCombos'> {
  const key = cellKey(row, col)
  const current = state.cellStates[key]
  const cell = getCell(row, col)
  const excludedSuits = new Set(state.excludedSuits)
  const painted = getCombosForPaintFrequency(cell, excludedSuits, state.paintFrequency)
  if (painted.length === 0) {
    return {
      cellStates: state.cellStates,
      foldedCombos: state.foldedCombos,
      calledCombos: state.calledCombos,
      rangeCombos: state.rangeCombos,
    }
  }

  const eligible = getEligibleCellComboKeys(cell, excludedSuits)
  const isFullRange = state.paintFrequency >= 100 || painted.length >= eligible.length
  const nextRange = isFullRange ? undefined : painted
  const currentRange = state.rangeCombos[key]
  const rangeUnchanged =
    current === 'in' || current === 'call' || current === 'fold'
      ? isFullRange
        ? currentRange === undefined
        : JSON.stringify(currentRange) === JSON.stringify(painted)
      : false

  if (rangeUnchanged) {
    return {
      cellStates: state.cellStates,
      foldedCombos: state.foldedCombos,
      calledCombos: state.calledCombos,
      rangeCombos: state.rangeCombos,
    }
  }

  const cleared = clearCellComboTags(state.foldedCombos, state.calledCombos, state.rangeCombos, key)
  const rangeCombos = { ...cleared.rangeCombos }

  if (nextRange) {
    rangeCombos[key] = nextRange
  } else {
    delete rangeCombos[key]
  }

  return {
    cellStates: { ...state.cellStates, [key]: 'in' },
    foldedCombos: cleared.foldedCombos,
    calledCombos: cleared.calledCombos,
    rangeCombos,
  }
}

function setCellState(
  state: AppState,
  row: RankIndex,
  col: RankIndex,
  mode: InteractionMode,
): Pick<AppState, 'cellStates' | 'foldedCombos' | 'calledCombos' | 'rangeCombos'> {
  if (mode === 'paint') {
    return paintCell(state, row, col)
  }

  const { cellStates, foldedCombos, calledCombos, rangeCombos } = state
  const key = cellKey(row, col)
  const current = cellStates[key] ?? 'out'
  const next = applyModeToCell(current, mode)

  if (next === current) {
    return { cellStates, foldedCombos, calledCombos, rangeCombos }
  }

  const updated = { ...cellStates }
  let nextTags = clearCellComboTags(foldedCombos, calledCombos, rangeCombos, key)

  if (next === 'out') {
    delete updated[key]
  } else {
    updated[key] = next
    if (mode === 'call' || mode === 'fold') {
      nextTags = clearCellComboTags(foldedCombos, calledCombos, rangeCombos, key)
    }
  }

  return { cellStates: updated, ...nextTags }
}

function applyStreetTransition(
  state: AppState,
  board: BoardCard[],
): Pick<AppState, 'cellStates' | 'rangeCombos' | 'foldedCombos' | 'calledCombos' | 'betLabel'> {
  const excludedSuits = new Set(state.excludedSuits)
  const pruned = pruneFoldedCombosFromRange(
    state.cellStates,
    state.foldedCombos,
    state.calledCombos,
    state.rangeCombos,
    excludedSuits,
    board,
  )

  return {
    ...pruned,
    foldedCombos: {},
    calledCombos: {},
    betLabel: 'b50',
  }
}

function applyBoardCard(
  board: BoardCard[],
  index: number,
  card: BoardCard | null,
): BoardCard[] | null {
  if (index < 0 || index > 4) return null

  if (card === null) {
    return board.slice(0, index)
  }

  if (index > board.length) return null

  const next = board.slice(0, index)
  if (isBoardCardTaken(next, index, card)) return null
  next.push(card)
  return next
}

function applyComboDispositions(
  state: AppState,
  row: RankIndex,
  col: RankIndex,
  update: (folded: Set<string>, called: Set<string>, eligible: string[]) => {
    folded: Set<string>
    called: Set<string>
  },
): Pick<AppState, 'foldedCombos' | 'calledCombos' | 'cellStates'> {
  const key = cellKey(row, col)
  const cellState = state.cellStates[key] ?? 'out'
  if (cellState === 'out') {
    return {
      foldedCombos: state.foldedCombos,
      calledCombos: state.calledCombos,
      cellStates: state.cellStates,
    }
  }

  const cell = getCell(row, col)
  const excludedSuits = new Set(state.excludedSuits)
  const eligible = getCombosInRange(cell, excludedSuits, state.rangeCombos[key], state.board)
  if (eligible.length === 0) {
    return {
      foldedCombos: state.foldedCombos,
      calledCombos: state.calledCombos,
      cellStates: state.cellStates,
    }
  }

  const expanded = getExpandedComboSets(
    cellState,
    new Set(state.foldedCombos[key] ?? []),
    new Set(state.calledCombos[key] ?? []),
    eligible,
  )

  const next = update(expanded.folded, expanded.called, eligible)
  const serialized = serializeComboSets(eligible, next.folded, next.called)

  const foldedCombos = { ...state.foldedCombos }
  const calledCombos = { ...state.calledCombos }

  if (serialized.foldedCombos) foldedCombos[key] = serialized.foldedCombos
  else delete foldedCombos[key]

  if (serialized.calledCombos) calledCombos[key] = serialized.calledCombos
  else delete calledCombos[key]

  const cellStates = { ...state.cellStates, [key]: 'in' as const }

  return { foldedCombos, calledCombos, cellStates }
}

export function rangeReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CELL': {
      const result = setCellState(state, action.row, action.col, state.mode)
      return {
        ...state,
        ...result,
        selectedCell: { row: action.row, col: action.col },
      }
    }
    case 'ERASE_CELL': {
      const key = cellKey(action.row, action.col)
      if (!(key in state.cellStates)) return state
      const updated = { ...state.cellStates }
      delete updated[key]
      const cleared = clearCellComboTags(
        state.foldedCombos,
        state.calledCombos,
        state.rangeCombos,
        key,
      )
      return {
        ...state,
        cellStates: updated,
        ...cleared,
        selectedCell:
          state.selectedCell?.row === action.row && state.selectedCell?.col === action.col
            ? null
            : state.selectedCell,
      }
    }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SET_PAINT_FREQUENCY':
      return { ...state, paintFrequency: action.frequency }
    case 'SET_BET':
      return { ...state, betLabel: action.betLabel }
    case 'SET_BOARD_CARD': {
      const newBoard = applyBoardCard(state.board, action.index, action.card)
      if (!newBoard) return state
      const reset = shouldResetStreetDecision(state.board, newBoard)
      if (!reset) {
        return { ...state, board: newBoard }
      }

      const transition = applyStreetTransition(state, newBoard)
      const selectedKey = state.selectedCell
        ? cellKey(state.selectedCell.row, state.selectedCell.col)
        : null

      return {
        ...state,
        board: newBoard,
        ...transition,
        selectedCell:
          selectedKey && selectedKey in transition.cellStates ? state.selectedCell : null,
      }
    }
    case 'CLEAR_BOARD':
      if (state.board.length === 0) return state
      return {
        ...state,
        board: [],
        foldedCombos: {},
        calledCombos: {},
        betLabel: 'b50',
      }
    case 'TOGGLE_RANK': {
      const excluded = new Set(state.excludedRanks)
      if (excluded.has(action.rank)) {
        excluded.delete(action.rank)
      } else {
        excluded.add(action.rank)
      }
      return { ...state, excludedRanks: [...excluded] }
    }
    case 'TOGGLE_EXCLUDED_SUIT': {
      const excluded = new Set(state.excludedSuits)
      if (excluded.has(action.suit)) {
        excluded.delete(action.suit)
      } else {
        excluded.add(action.suit)
      }
      return { ...state, excludedSuits: [...excluded] }
    }
    case 'SET_COMBO_DISPOSITION':
      return {
        ...state,
        ...applyComboDispositions(state, action.row, action.col, (folded, called) =>
          setsFromDisposition(folded, called, action.comboKey, action.disposition),
        ),
        selectedCell: { row: action.row, col: action.col },
      }
    case 'SET_ALL_COMBO_DISPOSITIONS': {
      const key = cellKey(action.row, action.col)
      const cellState = state.cellStates[key] ?? 'out'
      if (cellState === 'out') return state

      if (action.disposition === 'in') {
        const cleared = clearCellComboTags(
          state.foldedCombos,
          state.calledCombos,
          state.rangeCombos,
          key,
        )
        return {
          ...state,
          cellStates: { ...state.cellStates, [key]: 'in' },
          ...cleared,
          selectedCell: { row: action.row, col: action.col },
        }
      }

      if (action.disposition === 'fold') {
        const cleared = clearCellComboTags(
          state.foldedCombos,
          state.calledCombos,
          state.rangeCombos,
          key,
        )
        return {
          ...state,
          cellStates: { ...state.cellStates, [key]: 'fold' },
          ...cleared,
          selectedCell: { row: action.row, col: action.col },
        }
      }

      const cleared = clearCellComboTags(
        state.foldedCombos,
        state.calledCombos,
        state.rangeCombos,
        key,
      )
      return {
        ...state,
        cellStates: { ...state.cellStates, [key]: 'call' },
        ...cleared,
        selectedCell: { row: action.row, col: action.col },
      }
    }
    case 'SELECT_CELL':
      return { ...state, selectedCell: { row: action.row, col: action.col } }
    case 'CLEAR_SELECTED_CELL':
      return { ...state, selectedCell: null }
    case 'TOGGLE_RANGE_FILTER':
      return {
        ...state,
        suitFilters: {
          ...state.suitFilters,
          [action.filter]: !state.suitFilters[action.filter],
        },
      }
    case 'RESET_FILTERS':
      return {
        ...state,
        excludedRanks: [],
        excludedSuits: [],
        suitFilters: {
          excludePairs: false,
          onlyFlushDraw: false,
          onlyStraightDraw: false,
          onlyGutshot: false,
        },
      }
    case 'CLEAR_RANGE':
      return {
        ...state,
        cellStates: {},
        foldedCombos: {},
        calledCombos: {},
        rangeCombos: {},
        selectedCell: null,
      }
    case 'LOAD_PREDEFINED_RANGE': {
      const range = getPredefinedRange(action.rangeId)
      if (!range) return state
      return {
        ...state,
        cellStates: parsePredefinedRange(range),
        foldedCombos: {},
        calledCombos: {},
        rangeCombos: {},
        board: [],
        selectedCell: null,
      }
    }
    case 'SET_DRAGGING':
      return { ...state, isDragging: action.isDragging }
    case 'LOAD_STATE':
      return { ...state, ...action.state }
    default:
      return state
  }
}

export interface PersistedState {
  cellStates: Record<string, CellState>
  foldedCombos: Record<string, string[]>
  calledCombos: Record<string, string[]>
  rangeCombos: Record<string, string[]>
  board: BoardCard[]
  betLabel: string
  excludedRanks: RankIndex[]
  excludedSuits: SuitId[]
  paintFrequency: PaintFrequency
  suitFilters: RangeFilters
  mode: InteractionMode
}

export function saveState(state: AppState): void {
  const persisted: PersistedState = {
    cellStates: state.cellStates,
    foldedCombos: state.foldedCombos,
    calledCombos: state.calledCombos,
    rangeCombos: state.rangeCombos,
    board: state.board,
    betLabel: state.betLabel,
    excludedRanks: state.excludedRanks,
    excludedSuits: state.excludedSuits,
    paintFrequency: state.paintFrequency,
    suitFilters: state.suitFilters,
    mode: state.mode,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
}

export function loadState(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AppState> & {
      mode?: string
      suitFilters?: Partial<RangeFilters> & {
        excludeSuited?: boolean
        excludeOffsuit?: boolean
      }
    }
    const savedMode = parsed.mode as string | undefined
    const mode: InteractionMode | undefined =
      savedMode === 'foldSuit' ? 'selectCombos' : (parsed.mode as InteractionMode | undefined)
    const savedFilters = parsed.suitFilters
    const suitFilters: RangeFilters = {
      excludePairs: savedFilters?.excludePairs ?? false,
      onlyFlushDraw: savedFilters?.onlyFlushDraw ?? false,
      onlyStraightDraw: savedFilters?.onlyStraightDraw ?? false,
      onlyGutshot: savedFilters?.onlyGutshot ?? false,
    }
    return {
      ...parsed,
      mode,
      suitFilters,
      foldedCombos: parsed.foldedCombos ?? {},
      calledCombos: parsed.calledCombos ?? {},
      rangeCombos: parsed.rangeCombos ?? {},
      board: parsed.board ?? [],
      paintFrequency: parsed.paintFrequency ?? 100,
    }
  } catch {
    return null
  }
}
