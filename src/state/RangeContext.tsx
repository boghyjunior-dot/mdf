import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type Dispatch,
  type ReactNode,
} from 'react'
import {
  rangeReducer,
  initialState,
  loadState,
  saveState,
  type AppAction,
  type AppState,
} from './rangeReducer'
import { computeFoldStats } from '../lib/mdf'
import type { FoldStats, RankIndex, SuitId } from '../types/poker'

interface RangeContextValue {
  state: AppState
  dispatch: Dispatch<AppAction>
  stats: FoldStats
  excludedRankSet: Set<RankIndex>
  excludedSuitSet: Set<SuitId>
}

const RangeContext = createContext<RangeContextValue | null>(null)

export function RangeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rangeReducer, initialState, (init) => {
    const saved = loadState()
    return saved ? { ...init, ...saved } : init
  })

  useEffect(() => {
    saveState(state)
  }, [
    state.cellStates,
    state.foldedCombos,
    state.calledCombos,
    state.rangeCombos,
    state.board,
    state.paintFrequency,
    state.betLabel,
    state.excludedRanks,
    state.excludedSuits,
    state.suitFilters,
    state.mode,
  ])

  const excludedRankSet = useMemo(
    () => new Set(state.excludedRanks),
    [state.excludedRanks],
  )

  const excludedSuitSet = useMemo(
    () => new Set(state.excludedSuits),
    [state.excludedSuits],
  )

  const stats = useMemo(
    () =>
      computeFoldStats(
        state.cellStates,
        state.foldedCombos,
        state.calledCombos,
        state.rangeCombos,
        excludedRankSet,
        state.suitFilters,
        excludedSuitSet,
        state.betLabel,
        state.board,
      ),
    [
      state.cellStates,
      state.foldedCombos,
      state.calledCombos,
      state.rangeCombos,
      excludedRankSet,
      state.suitFilters,
      excludedSuitSet,
      state.betLabel,
      state.board,
    ],
  )

  return (
    <RangeContext.Provider value={{ state, dispatch, stats, excludedRankSet, excludedSuitSet }}>
      {children}
    </RangeContext.Provider>
  )
}

export function useRange(): RangeContextValue {
  const ctx = useContext(RangeContext)
  if (!ctx) throw new Error('useRange must be used within RangeProvider')
  return ctx
}
