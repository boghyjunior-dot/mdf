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
  locked?: boolean
  partial?: boolean
  selected?: boolean
  onPointerDown: () => void
  onPointerEnter: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function MatrixCell({
  label,
  state,
  locked = false,
  partial = false,
  selected = false,
  onPointerDown,
  onPointerEnter,
  onContextMenu,
}: MatrixCellProps) {
  return (
    <button
      type="button"
      disabled={locked}
      title={locked ? 'Locked — unlock from header' : undefined}
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
        ${stateStyles[state]}
        ${locked ? 'cursor-not-allowed brightness-50' : 'hover:brightness-110'}
        ${partial && !locked ? 'opacity-90' : ''}
        ${selected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''}
      `}
    >
      {partial && !locked && (
        <span
          className="absolute inset-0 rounded-sm pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.12) 4px, rgba(0,0,0,0.12) 8px)',
          }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  )
}
