import { getDeltaColor } from '../lib/mdf'
import { useRange } from '../state/RangeContext'

const deltaStyles = {
  green: 'text-emerald-400',
  yellow: 'text-amber-400',
  red: 'text-red-400',
}

const deltaRingStyles = {
  green: 'border-emerald-500/40 bg-emerald-950/20',
  yellow: 'border-amber-500/40 bg-amber-950/20',
  red: 'border-red-500/40 bg-red-950/20',
}

export function MdfTargetDisplay({ compact = false }: { compact?: boolean }) {
  const { stats } = useRange()
  const deltaColor = getDeltaColor(stats.delta)
  const deltaSign = stats.delta >= 0 ? '+' : ''

  if (compact) {
    return (
      <div className="flex gap-3 shrink-0">
        <div className="rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-3 min-w-[6.5rem]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
            Target fold
          </p>
          <p className="text-3xl font-bold tabular-nums text-white leading-none">
            {stats.targetPct.toFixed(0)}
            <span className="text-lg text-slate-400">%</span>
          </p>
        </div>

        <div className={`rounded-lg border px-4 py-3 min-w-[6.5rem] ${deltaRingStyles[deltaColor]}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
            Delta
          </p>
          <p className={`text-3xl font-bold tabular-nums leading-none ${deltaStyles[deltaColor]}`}>
            {deltaSign}{stats.delta.toFixed(1)}
            <span className="text-lg opacity-80">%</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1 tabular-nums">
            {stats.currentPct.toFixed(1)}% fold
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <div className="flex-1 min-w-[10rem] rounded-xl border border-slate-700 bg-slate-950/50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Target fold
        </p>
        <p className="text-4xl sm:text-5xl font-bold tabular-nums text-white leading-none">
          {stats.targetPct.toFixed(0)}
          <span className="text-2xl sm:text-3xl text-slate-400 ml-0.5">%</span>
        </p>
      </div>

      <div className={`flex-1 min-w-[10rem] rounded-xl border px-5 py-4 ${deltaRingStyles[deltaColor]}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Delta
        </p>
        <p className={`text-4xl sm:text-5xl font-bold tabular-nums leading-none ${deltaStyles[deltaColor]}`}>
          {deltaSign}{stats.delta.toFixed(1)}
          <span className="text-2xl sm:text-3xl opacity-80 ml-0.5">%</span>
        </p>
        <p className="text-xs text-slate-500 mt-2 tabular-nums">
          Current {stats.currentPct.toFixed(1)}% fold
        </p>
      </div>
    </div>
  )
}
