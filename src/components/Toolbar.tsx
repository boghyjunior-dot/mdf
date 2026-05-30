import type { RangeFilters } from '../types/poker'
import { SUITS } from '../types/poker'
import { useRange } from '../state/RangeContext'
import { MdfTargetDisplay } from './MdfTargetDisplay'
import { PredefinedRangePicker } from './PredefinedRangePicker'

const MODES: { id: import('../types/poker').InteractionMode; label: string }[] = [
  { id: 'selectCombos', label: 'Select combos' },
  { id: 'paint', label: 'Paint range' },
  { id: 'call', label: 'Tag call' },
  { id: 'fold', label: 'Tag fold' },
  { id: 'erase', label: 'Erase' },
]

const PAINT_FREQUENCIES: import('../types/poker').PaintFrequency[] = [100, 50, 25]

const DRAW_FILTERS: { filter: keyof RangeFilters; label: string }[] = [
  { filter: 'onlyFlushDraw', label: 'Flush draw' },
  { filter: 'onlyStraightDraw', label: 'Straight draw' },
  { filter: 'onlyGutshot', label: 'Gutshot' },
]

export function Toolbar() {
  const { state, dispatch } = useRange()
  const drawFiltersDisabled = state.board.length < 3

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400 mr-1">Mode:</span>
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => dispatch({ type: 'SET_MODE', mode: mode.id })}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              state.mode === mode.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
            }`}
          >
            {mode.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => dispatch({ type: 'CLEAR_RANGE' })}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 ml-2"
        >
          Clear range
        </button>
        <PredefinedRangePicker />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400 mr-1">Paint freq:</span>
        {PAINT_FREQUENCIES.map((freq) => (
          <button
            key={freq}
            type="button"
            onClick={() => dispatch({ type: 'SET_PAINT_FREQUENCY', frequency: freq })}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              state.paintFrequency === freq
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
            }`}
          >
            {freq}%
          </button>
        ))}
        <span className="text-xs text-slate-500 ml-1">
          {state.mode === 'paint'
            ? 'Click or drag hands into range at this frequency'
            : 'Switch to Paint range to use'}
        </span>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-start gap-4 xl:gap-6">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-slate-400 mr-1">Filters:</span>
          {DRAW_FILTERS.map(({ filter, label }) => (
            <FilterToggle
              key={filter}
              label={label}
              active={state.suitFilters[filter]}
              disabled={drawFiltersDisabled}
              title={drawFiltersDisabled ? 'Set a flop to use draw filters' : `Show only ${label.toLowerCase()} combos`}
              onClick={() => dispatch({ type: 'TOGGLE_RANGE_FILTER', filter })}
            />
          ))}
          <FilterToggle
            label="Pairs"
            active={state.suitFilters.excludePairs}
            variant="exclude"
            onClick={() => dispatch({ type: 'TOGGLE_RANGE_FILTER', filter: 'excludePairs' })}
          />
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET_FILTERS' })}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Reset filters
          </button>
          {drawFiltersDisabled && (
            <span className="text-xs text-slate-500">Draw filters need a flop</span>
          )}
        </div>
        <MdfTargetDisplay compact />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400 mr-1">Exclude suit:</span>
        {SUITS.map((suit) => (
          <button
            key={suit.id}
            type="button"
            title={`Exclude ${suit.label}`}
            onClick={() => dispatch({ type: 'TOGGLE_EXCLUDED_SUIT', suit: suit.id })}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              state.excludedSuits.includes(suit.id)
                ? 'bg-red-900/80 text-red-200 ring-1 ring-red-500'
                : `bg-slate-700 hover:bg-slate-600 ${suit.color}`
            }`}
          >
            {suit.symbol}
            {state.excludedSuits.includes(suit.id) ? ' ✕' : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

function FilterToggle({
  label,
  active,
  disabled = false,
  title,
  variant = 'include',
  onClick,
}: {
  label: string
  active: boolean
  disabled?: boolean
  title?: string
  variant?: 'include' | 'exclude'
  onClick: () => void
}) {
  const activeClass =
    variant === 'exclude'
      ? 'bg-red-900/80 text-red-200 ring-1 ring-red-500'
      : 'bg-blue-900/80 text-blue-200 ring-1 ring-blue-500'

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        disabled
          ? 'bg-slate-800/60 text-slate-600 cursor-not-allowed'
          : active
            ? activeClass
            : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
      }`}
    >
      {label} {active && !disabled ? (variant === 'exclude' ? '✕' : '✓') : ''}
    </button>
  )
}
