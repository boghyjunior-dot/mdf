import { MDF_BETS } from '../types/poker'
import { useRange } from '../state/RangeContext'

export function BetSizeBar() {
  const { state, dispatch } = useRange()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-400 mr-1">Bet size:</span>
      {MDF_BETS.map((bet) => (
        <button
          key={bet.label}
          type="button"
          onClick={() => dispatch({ type: 'SET_BET', betLabel: bet.label })}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            state.betLabel === bet.label
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
        >
          {bet.label}
          <span className="ml-1 text-xs opacity-70">{bet.foldPct}%</span>
        </button>
      ))}
    </div>
  )
}
