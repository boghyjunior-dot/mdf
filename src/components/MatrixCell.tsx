import type { DerivedCellState } from '../lib/combos'

const stateStyles: Record<DerivedCellState | 'out', string> = {
  out: 'bg-slate-800 text-slate-500 border-slate-700',
  in: 'bg-blue-700 text-blue-50 border-blue-600',
  call: 'bg-emerald-700 text-emerald-50 border-emerald-600',
  fold: 'bg-red-800 text-red-50 border-red-700',
  mixed: 'bg-amber-800 text-amber-50 border-amber-600',
}

interface MatrixCellProps {
  label: string
  state: DerivedCellState | 'out'
  excluded: boolean
  partial?: boolean
  selected?: boolean
  onPointerDown: () => void
  onPointerEnter: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function MatrixCell({
  label,
  state,
  excluded,
  partial = false,
  selected = false,
  onPointerDown,
  onPointerEnter,
  onContextMenu,
}: MatrixCellProps) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault()
        onPointerDown()
      }}
      onPointerEnter={onPointerEnter}
      onContextMenu={onContextMenu}
      className={`
        relative w-full aspect-square min-w-0
        flex items-center justify-center
        text-[10px] sm:text-xs font-semibold
        border rounded-sm
        select-none touch-none
        transition-colors
        hover:brightness-110
        ${stateStyles[state]}
        ${excluded ? 'opacity-40 line-through' : partial ? 'opacity-70' : ''}
        ${selected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''}
      `}
    >
      {(excluded || partial) && (
        <span
          className="absolute inset-0 rounded-sm pointer-events-none"
          style={{
            background: excluded
              ? 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.25) 3px, rgba(0,0,0,0.25) 6px)'
              : 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.12) 4px, rgba(0,0,0,0.12) 8px)',
          }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  )
}
