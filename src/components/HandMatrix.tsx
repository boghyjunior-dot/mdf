import { Fragment, useEffect } from 'react'
import { RANKS, cellKey, type RankIndex } from '../types/poker'
import { ALL_CELLS } from '../lib/matrix'
import { isCellLocked } from '../lib/filters'
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
  const pairsLocked = state.pairsLocked

  useEffect(() => {
    const endDrag = () => dispatch({ type: 'SET_DRAGGING', isDragging: false })
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [dispatch])

  const handleCell = (row: RankIndex, col: RankIndex, inverse = false) => {
    const cell = ALL_CELLS.find((c) => c.row === row && c.col === col)!
    if (isCellLocked(cell, excludedRankSet, pairsLocked)) return

    if (state.mode === 'selectCombos') {
      dispatch({ type: 'SELECT_CELL', row, col })
      return
    }

    dispatch({ type: 'SET_CELL', row, col, inverse })
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
        <PairsLockHeader
          locked={pairsLocked}
          onClick={() => dispatch({ type: 'TOGGLE_PAIRS_LOCK' })}
        />

        {RANKS.map((rank, col) => (
          <RankHeader
            key={`col-${rank}`}
            rank={rank}
            locked={excludedRankSet.has(col as RankIndex)}
            onClick={() => dispatch({ type: 'TOGGLE_RANK', rank: col as RankIndex })}
          />
        ))}

        {RANKS.map((rowRank, row) => (
          <Fragment key={`row-${rowRank}`}>
            <RankHeader
              rank={rowRank}
              locked={excludedRankSet.has(row as RankIndex)}
              onClick={() => dispatch({ type: 'TOGGLE_RANK', rank: row as RankIndex })}
            />
            {RANKS.map((_, col) => {
              const cell = ALL_CELLS.find((c) => c.row === row && c.col === col)!
              const key = cellKey(row as RankIndex, col as RankIndex)
              const cellState = state.cellStates[key] ?? 'out'
              const locked = isCellLocked(cell, excludedRankSet, pairsLocked)

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
              if (cellState !== 'out') {
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
                  locked={locked}
                  partial={partialRange}
                  selected={isSelected}
                  onPointerDown={() => {
                    onPointerDown()
                    handleCell(row as RankIndex, col as RankIndex)
                  }}
                  onPointerEnter={() => {
                    if (state.isDragging && state.mode !== 'selectCombos' && !locked) {
                      handleCell(row as RankIndex, col as RankIndex)
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    handleCell(row as RankIndex, col as RankIndex, true)
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

function PairsLockHeader({
  locked,
  onClick,
}: {
  locked: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={locked ? 'Unlock pocket pairs for editing' : 'Lock pocket pairs from editing'}
      onClick={onClick}
      className={`
        w-7 sm:w-8 aspect-square
        flex items-center justify-center
        text-[10px] sm:text-xs font-bold rounded-sm
        transition-colors
        ${locked
          ? 'bg-amber-900/60 text-amber-200/70 brightness-50 ring-1 ring-amber-600/40'
          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}
      `}
    >
      PP
    </button>
  )
}

function RankHeader({
  rank,
  locked,
  onClick,
}: {
  rank: string
  locked: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={locked ? 'Unlock rank for editing' : 'Lock rank from editing'}
      onClick={onClick}
      className={`
        w-7 sm:w-8 aspect-square
        flex items-center justify-center
        text-xs sm:text-sm font-bold rounded-sm
        transition-colors
        ${locked
          ? 'bg-amber-900/60 text-amber-200/70 brightness-50 ring-1 ring-amber-600/40'
          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}
      `}
    >
      {rank}
    </button>
  )
}
