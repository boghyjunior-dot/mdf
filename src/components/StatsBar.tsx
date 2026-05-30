import { getStreet } from '../lib/board'
import { STREET_LABELS } from '../types/poker'
import { useRange } from '../state/RangeContext'

export function StatsBar() {
  const { state, stats } = useRange()
  const street = getStreet(state.board)

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
      <Stat label="Street" value={STREET_LABELS[street]} />
      <Stat label="Current" value={`${stats.currentPct.toFixed(1)}%`} />
      <Stat label="Combos" value={String(stats.total)} />
      <Stat label="Fold" value={String(stats.folded)} muted />
      <Stat label="Call" value={String(stats.defended)} muted />
      <Stat label="Untagged" value={String(stats.untagged)} muted />
    </div>
  )
}

function Stat({
  label,
  value,
  muted = false,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div>
      <span className="text-slate-400 mr-2">{label}</span>
      <span className={muted ? 'text-slate-300' : 'font-semibold text-white'}>{value}</span>
    </div>
  )
}
