import { describe, it, expect, vi } from 'vitest'
import { rangeReducer, initialState, saveState, loadState, type AppState } from './rangeReducer'
import { cellKey } from '../types/poker'
import { ALL_CELLS } from '../lib/matrix'
import { getComboDisposition, getCombosInRange } from '../lib/combos'
import { computeFoldStats } from '../lib/mdf'

describe('rangeReducer combo dispositions', () => {
  const aks = ALL_CELLS.find((c) => c.label === 'AKs')!
  const key = cellKey(aks.row, aks.col)

  function withAksInRange(): AppState {
    return {
      ...initialState,
      cellStates: { [key]: 'in' as const },
      selectedCell: { row: aks.row, col: aks.col },
    }
  }

  it('persists per-combo fold from select combos panel', () => {
    const state = withAksInRange()
    const next = rangeReducer(state, {
      type: 'SET_COMBO_DISPOSITION',
      row: aks.row,
      col: aks.col,
      comboKey: 's',
      disposition: 'fold',
    })

    expect(next.foldedCombos[key]).toEqual(['s'])
    expect(next.calledCombos[key]).toBeUndefined()
    expect(next.cellStates[key]).toBe('in')

    const foldedSet = new Set(next.foldedCombos[key] ?? [])
    const calledSet = new Set(next.calledCombos[key] ?? [])
    expect(getComboDisposition('s', 'in', foldedSet, calledSet)).toBe('fold')
    expect(getComboDisposition('h', 'in', foldedSet, calledSet)).toBe('in')
  })

  it('persists per-combo call and switches from fold', () => {
    let state: AppState = withAksInRange()
    state = rangeReducer(state, {
      type: 'SET_COMBO_DISPOSITION',
      row: aks.row,
      col: aks.col,
      comboKey: 's',
      disposition: 'fold',
    })
    state = rangeReducer(state, {
      type: 'SET_COMBO_DISPOSITION',
      row: aks.row,
      col: aks.col,
      comboKey: 's',
      disposition: 'call',
    })

    expect(nextComboCall(state, key)).toBe('call')
  })

  it('persists per-combo fold after tagging whole hand call on matrix', () => {
    let state: AppState = withAksInRange()
    state = rangeReducer(state, { type: 'SET_MODE', mode: 'call' })
    state = rangeReducer(state, { type: 'SET_CELL', row: aks.row, col: aks.col })
    expect(state.cellStates[key]).toBe('call')

    state = rangeReducer(state, {
      type: 'SET_COMBO_DISPOSITION',
      row: aks.row,
      col: aks.col,
      comboKey: 's',
      disposition: 'fold',
    })

    expect(state.foldedCombos[key]).toEqual(['s'])
    expect(state.calledCombos[key]?.sort()).toEqual(['c', 'd', 'h'])
    expect(nextComboCall(state, key)).toBe('fold')
  })

  it('keeps call when clicking call mode again on the same hand', () => {
    let state: AppState = withAksInRange()
    state = rangeReducer(state, { type: 'SET_MODE', mode: 'call' })
    state = rangeReducer(state, { type: 'SET_CELL', row: aks.row, col: aks.col })
    state = rangeReducer(state, { type: 'SET_CELL', row: aks.row, col: aks.col })

    expect(state.cellStates[key]).toBe('call')
  })

  it('keeps partial rangeCombos when tagging whole hand fold', () => {
    let state: AppState = {
      ...withAksInRange(),
      rangeCombos: { [key]: ['s', 'd'] },
      mode: 'fold',
    }
    state = rangeReducer(state, { type: 'SET_CELL', row: aks.row, col: aks.col })

    expect(state.cellStates[key]).toBe('fold')
    expect(state.rangeCombos[key]).toEqual(['s', 'd'])

    const inRange = getCombosInRange(aks, new Set(), state.rangeCombos[key], state.board)
    expect(inRange).toEqual(['s', 'd'])

    const stats = computeFoldStats(
      state.cellStates,
      state.foldedCombos,
      state.calledCombos,
      state.rangeCombos,
      'b50',
    )
    expect(stats.folded).toBe(2)
    expect(stats.total).toBe(2)
  })

  it('does not fold locked combos when tagging whole hand fold', () => {
    let state: AppState = {
      ...withAksInRange(),
      mode: 'fold',
      excludedSuits: ['s'],
    }
    state = rangeReducer(state, { type: 'SET_CELL', row: aks.row, col: aks.col })

    expect(state.cellStates[key]).toBe('fold')
    const locked = new Set(state.excludedSuits)
    expect(getComboDisposition('s', 'fold', new Set(), new Set(), locked)).toBe('in')
    expect(getComboDisposition('h', 'fold', new Set(), new Set(), locked)).toBe('fold')
  })

  it('applies inverse action on right-click via SET_CELL inverse', () => {
    let state: AppState = withAksInRange()
    state = rangeReducer(state, { type: 'SET_MODE', mode: 'call' })
    state = rangeReducer(state, { type: 'SET_CELL', row: aks.row, col: aks.col })
    state = rangeReducer(state, {
      type: 'SET_CELL',
      row: aks.row,
      col: aks.col,
      inverse: true,
    })

    expect(state.cellStates[key]).toBe('fold')
  })

  it('does not wipe per-combo tags when re-clicking an in-range hand in paint mode', () => {
    let state: AppState = withAksInRange()
    state = rangeReducer(state, {
      type: 'SET_COMBO_DISPOSITION',
      row: aks.row,
      col: aks.col,
      comboKey: 's',
      disposition: 'fold',
    })
    state = rangeReducer(state, { type: 'SET_MODE', mode: 'paint' })
    state = rangeReducer(state, { type: 'SET_CELL', row: aks.row, col: aks.col })

    expect(state.foldedCombos[key]).toEqual(['s'])
  })

  it('round-trips per-combo tags through save and load', () => {
    let state: AppState = withAksInRange()
    state = rangeReducer(state, {
      type: 'SET_COMBO_DISPOSITION',
      row: aks.row,
      col: aks.col,
      comboKey: 's',
      disposition: 'fold',
    })

    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
    })

    saveState(state)
    const loaded = loadState()
    expect(loaded?.foldedCombos?.[key]).toEqual(['s'])
    expect(loaded?.calledCombos).toEqual({})

    vi.unstubAllGlobals()
  })

  it('materializes whole-cell fold into per-combo tags when editing one combo', () => {
    const state = {
      ...withAksInRange(),
      cellStates: { [key]: 'fold' as const },
    }
    const next = rangeReducer(state, {
      type: 'SET_COMBO_DISPOSITION',
      row: aks.row,
      col: aks.col,
      comboKey: 's',
      disposition: 'call',
    })

    expect(next.cellStates[key]).toBe('in')
    expect(next.calledCombos[key]).toEqual(['s'])
    expect(next.foldedCombos[key]?.sort()).toEqual(['c', 'd', 'h'])
  })
})

function nextComboCall(state: AppState, key: string): string {
  const foldedSet = new Set(state.foldedCombos[key] ?? [])
  const calledSet = new Set(state.calledCombos[key] ?? [])
  const cellState = state.cellStates[key]
  if (cellState !== 'in' && cellState !== 'call' && cellState !== 'fold') return 'in'
  return getComboDisposition('s', cellState, foldedSet, calledSet)
}
