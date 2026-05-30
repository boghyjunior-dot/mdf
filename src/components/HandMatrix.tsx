import { Fragment, useEffect } from 'react'
import { RANKS, cellKey, type RankIndex } from '../types/poker'
import { ALL_CELLS } from '../lib/matrix'
import { getCellFilterStatus } from '../lib/filters'
import {
  getCellComboStats,
  getCombosInRange,
  getDerivedCellState,
  isPartialPaintRange,
  type DerivedCellState,
} from '../lib/combos'
import { useRange } from '../state/RangeContext'
import { MatrixCell } from './MatrixCell'

export function HandMatrix() {
  const { state, dispatch, excludedRankSet, excludedSuitSet } = useRange()

  useEffect(() => {
    const endDrag = () => dispatch({ type: 'SET_DRAGGING', isDragging: false })
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [dispatch])

  const handleCell = (row: RankIndex, col: RankIndex) => {
    const key = cellKey(row, col)
    const current = state.cellStates[key] ?? 'out'
    const hasPerCombo = key in state.foldedCombos || key in state.calledCombos

    if (state.mode === 'selectCombos') {
      dispatch({ type: 'SELECT_CELL', row, col })
      return
    }

    if (
      state.mode === 'paint' &&
      (current === 'in' || current === 'call' || current === 'fold')
    ) {
      dispatch({ type: 'SELECT_CELL', row, col })
      return
    }

    if (
      (state.mode === 'call' || state.mode === 'fold') &&
      hasPerCombo &&
      current === 'in'
    ) {
      dispatch({ type: 'SELECT_CELL', row, col })
      return
    }

    dispatch({ type: 'SET_CELL', row, col })
  }

  const handleErase = (row: RankIndex, col: RankIndex) => {
    dispatch({ type: 'ERASE_CELL', row, col })
  }

  const onPointerDown = () => {
    if (state.mode === 'selectCombos') return
    dispatch({ type: 'SET_DRAGGING', isDragging: true })
  }

  const onPointerUp = () => {
    dispatch({ type: 'SET_DRAGGING', isDragging: false })
  }

  return (
    <div
      className="overflow-x-auto"
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        className="inline-grid gap-0.5 sm:gap-1"
        style={{ gridTemplateColumns: 'repeat(14, minmax(28px, 1fr))' }}
      >
        <div className="w-7 sm:w-8" />

        {RANKS.map((rank, col) => (
          <RankHeader
            key={`col-${rank}`}
            rank={rank}
            rankIndex={col as RankIndex}
            excluded={excludedRankSet.has(col as RankIndex)}
            onClick={() => dispatch({ type: 'TOGGLE_RANK', rank: col as RankIndex })}
          />
        ))}

        {RANKS.map((rowRank, row) => (
          <Fragment key={`row-${rowRank}`}>
            <RankHeader
              rank={rowRank}
              rankIndex={row as RankIndex}
              excluded={excludedRankSet.has(row as RankIndex)}
              onClick={() => dispatch({ type: 'TOGGLE_RANK', rank: row as RankIndex })}
            />
            {RANKS.map((_, col) => {
              const cell = ALL_CELLS.find((c) => c.row === row && c.col === col)!
              const key = cellKey(row as RankIndex, col as RankIndex)
              const cellState = state.cellStates[key] ?? 'out'
              const filterStatus = getCellFilterStatus(
                cell,
                excludedRankSet,
                state.suitFilters,
                excludedSuitSet,
                state.board,
              )

              const foldedSet = new Set(state.foldedCombos[key] ?? [])
              const calledSet = new Set(state.calledCombos[key] ?? [])
              const inRangeKeys = getCombosInRange(
                cell,
                excludedSuitSet,
                state.rangeCombos[key],
                state.board,
              )
              let displayState: DerivedCellState | 'out' = cellState
              const partialRange =
                cellState !== 'out' &&
                isPartialPaintRange(cell, excludedSuitSet, state.rangeCombos[key])
              if (cellState !== 'out' && !filterStatus.excluded) {
                const stats = getCellComboStats(
                  cell,
                  cellState,
                  foldedSet,
                  excludedSuitSet,
                  calledSet,
                  inRangeKeys,
                )
                displayState = getDerivedCellState(stats)
              }

              const isSelected =
                state.selectedCell?.row === row && state.selectedCell?.col === col

              return (
                <MatrixCell
                  key={key}
                  label={cell.label}
                  state={displayState}
                  excluded={filterStatus.excluded}
                  partial={filterStatus.partial || partialRange}
                  selected={isSelected}
                  onPointerDown={() => {
                    onPointerDown()
                    handleCell(row as RankIndex, col as RankIndex)
                  }}
                  onPointerEnter={() => {
                    if (state.isDragging && state.mode !== 'selectCombos') {
                      handleCell(row as RankIndex, col as RankIndex)
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    handleErase(row as RankIndex, col as RankIndex)
                  }}
                />
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function RankHeader({
  rank,
  excluded,
  onClick,
}: {
  rank: string
  rankIndex: RankIndex
  excluded: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-7 sm:w-8 aspect-square
        flex items-center justify-center
        text-xs sm:text-sm font-bold rounded-sm
        transition-colors
        ${excluded
          ? 'bg-red-900 text-red-200 ring-1 ring-red-500'
          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}
      `}
    >
      {rank}
    </button>
  )
}
