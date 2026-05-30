import type { ComboDisposition, HandCell, SuitId } from '../types/poker'
import { RANKS, SUITS } from '../types/poker'
import { useRange } from '../state/RangeContext'
import {
  getCellComboStats,
  getComboDisposition,
  getComboGridLayout,
  getCombosInRange,
  getDerivedCellState,
} from '../lib/combos'
import { ALL_CELLS } from '../lib/matrix'
import { cellKey } from '../types/poker'

const dispositionBorder: Record<ComboDisposition, string> = {
  fold: 'border-red-600/60 bg-red-950/30',
  call: 'border-emerald-600/60 bg-emerald-950/30',
  in: 'border-slate-600 bg-slate-800/50',
}

export function ComboPanel() {
  const { state, dispatch, excludedSuitSet } = useRange()

  if (!state.selectedCell) {
    return (
      <p className="text-sm text-slate-500">
        Select a hand on the matrix to choose which combos to fold or call.
      </p>
    )
  }

  const { row, col } = state.selectedCell
  const cell = ALL_CELLS.find((c) => c.row === row && c.col === col)
  if (!cell) return null

  const key = cellKey(row, col)
  const cellState = state.cellStates[key] ?? 'out'
  if (cellState === 'out') {
    return (
      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-300">{cell.label}</span> is not in range.
        Paint it into your range first.
      </p>
    )
  }

  const foldedSet = new Set(state.foldedCombos[key] ?? [])
  const calledSet = new Set(state.calledCombos[key] ?? [])
  const inRangeKeys = getCombosInRange(cell, excludedSuitSet, state.rangeCombos[key], state.board)
  const inRangeSet = new Set(inRangeKeys)
  const stats = getCellComboStats(
    cell,
    cellState,
    foldedSet,
    excludedSuitSet,
    calledSet,
    inRangeKeys,
  )
  const derived = getDerivedCellState(stats)
  const grid = getComboGridLayout(cell, excludedSuitSet)

  const setDisposition = (comboKey: string, disposition: ComboDisposition) => {
    dispatch({ type: 'SET_COMBO_DISPOSITION', row, col, comboKey, disposition })
  }

  return (
    <div className="space-y-4" onPointerDown={(e) => e.stopPropagation()}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-white text-lg">{cell.label}</span>
          {derived === 'mixed' && (
            <span className="text-amber-400 text-xs font-medium">Mixed</span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          {stats.folded} fold · {stats.defended} call · {stats.untagged} untagged
          {inRangeKeys.length < cell.combos && (
            <span className="text-slate-500"> · {inRangeKeys.length} combos in range</span>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <BulkButton
            label="Fold all"
            onClick={() =>
              dispatch({ type: 'SET_ALL_COMBO_DISPOSITIONS', row, col, disposition: 'fold' })
            }
          />
          <BulkButton
            label="Call all"
            onClick={() =>
              dispatch({ type: 'SET_ALL_COMBO_DISPOSITIONS', row, col, disposition: 'call' })
            }
          />
          <BulkButton
            label="Clear"
            onClick={() =>
              dispatch({ type: 'SET_ALL_COMBO_DISPOSITIONS', row, col, disposition: 'in' })
            }
          />
        </div>
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))` }}
      >
        {grid.cells.flat().map((comboKey, idx) =>
          comboKey ? (
            <ComboCard
              key={comboKey}
              cell={cell}
              comboKey={comboKey}
              inRange={inRangeSet.has(comboKey)}
              disposition={getComboDisposition(comboKey, cellState, foldedSet, calledSet)}
              onSetDisposition={setDisposition}
            />
          ) : (
            <div key={`empty-${idx}`} className="rounded-md bg-slate-900/40 border border-slate-800/50 min-h-[72px]" />
          ),
        )}
      </div>
    </div>
  )
}

function ComboCard({
  cell,
  comboKey,
  inRange,
  disposition,
  onSetDisposition,
}: {
  cell: HandCell
  comboKey: string
  inRange: boolean
  disposition: ComboDisposition
  onSetDisposition: (key: string, d: ComboDisposition) => void
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-md border px-1 py-2 ${
        inRange ? dispositionBorder[disposition] : 'border-slate-800 bg-slate-900/40 opacity-40'
      }`}
    >
      <ComboLabel cell={cell} comboKey={comboKey} dimmed={!inRange} />
      {inRange ? (
        <div className="flex gap-0.5">
          <DispositionButton
            label="F"
            title="Fold"
            active={disposition === 'fold'}
            activeClass="bg-red-700 text-white"
            onClick={() => onSetDisposition(comboKey, 'fold')}
          />
          <DispositionButton
            label="C"
            title="Call"
            active={disposition === 'call'}
            activeClass="bg-emerald-700 text-white"
            onClick={() => onSetDisposition(comboKey, 'call')}
          />
          <DispositionButton
            label="–"
            title="Untagged"
            active={disposition === 'in'}
            activeClass="bg-blue-700 text-white"
            onClick={() => onSetDisposition(comboKey, 'in')}
          />
        </div>
      ) : (
        <span className="text-[10px] text-slate-500">Out</span>
      )}
    </div>
  )
}

function ComboLabel({
  cell,
  comboKey,
  dimmed = false,
}: {
  cell: HandCell
  comboKey: string
  dimmed?: boolean
}) {
  const high = RANKS[Math.min(cell.row, cell.col)]
  const low = RANKS[Math.max(cell.row, cell.col)]

  const suitEl = (id: SuitId) => {
    const suit = SUITS.find((s) => s.id === id)!
    return <span className={suit.color}>{suit.symbol}</span>
  }

  if (cell.type === 'suited') {
    const id = comboKey as SuitId
    return (
      <span className={`text-xs font-semibold whitespace-nowrap ${dimmed ? 'text-slate-500' : 'text-slate-100'}`}>
        {high}
        {suitEl(id)}
        {low}
        {suitEl(id)}
      </span>
    )
  }

  const [s1, s2] = comboKey.split('-') as [SuitId, SuitId]
  if (cell.type === 'pair') {
    return (
      <span className={`text-xs font-semibold whitespace-nowrap ${dimmed ? 'text-slate-500' : 'text-slate-100'}`}>
        {high}
        {suitEl(s1)}
        {high}
        {suitEl(s2)}
      </span>
    )
  }

  return (
    <span className={`text-xs font-semibold whitespace-nowrap ${dimmed ? 'text-slate-500' : 'text-slate-100'}`}>
      {high}
      {suitEl(s1)}
      {low}
      {suitEl(s2)}
    </span>
  )
}

function DispositionButton({
  label,
  title,
  active,
  activeClass,
  onClick,
}: {
  label: string
  title: string
  active: boolean
  activeClass: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
        active ? activeClass : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
    >
      {label}
    </button>
  )
}

function BulkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
    >
      {label}
    </button>
  )
}