import { SUITS } from '../types/poker'
import { useRange } from '../state/RangeContext'
import { PredefinedRangePicker } from './PredefinedRangePicker'

const MODES: { id: import('../types/poker').InteractionMode; label: string }[] = [
  { id: 'selectCombos', label: 'Select combos' },
  { id: 'paint', label: 'Paint range' },
  { id: 'call', label: 'Tag call' },
  { id: 'fold', label: 'Tag fold' },
  { id: 'erase', label: 'Erase' },
]

export function Toolbar() {
  const { state, dispatch } = useRange()

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
        <span className="text-sm text-slate-400 mr-1">Lock suit:</span>
        {SUITS.map((suit) => (
          <button
            key={suit.id}
            type="button"
            title={state.excludedSuits.includes(suit.id) ? `Unlock ${suit.label} combos` : `Lock ${suit.label} combos from editing`}
            onClick={() => dispatch({ type: 'TOGGLE_EXCLUDED_SUIT', suit: suit.id })}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              state.excludedSuits.includes(suit.id)
                ? 'bg-amber-900/60 text-amber-200/70 brightness-50 ring-1 ring-amber-600/40'
                : `bg-slate-700 hover:bg-slate-600 ${suit.color}`
            }`}
          >
            {suit.symbol}
            {state.excludedSuits.includes(suit.id) ? ' 🔒' : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
