const items = [
  { color: 'bg-slate-800 border border-slate-700', label: 'Out of range' },
  { color: 'bg-blue-700', label: 'In range' },
  { color: 'bg-emerald-700', label: 'Call' },
  { color: 'bg-red-800', label: 'Fold' },
  { color: 'bg-amber-800', label: 'Mixed (partial suit folds)' },
  { color: 'opacity-40 line-through bg-slate-700', label: 'Excluded by filter' },
  { color: 'opacity-70 bg-blue-700', label: 'Partially excluded (suit filter)' },
]

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded-sm ${item.color}`} />
          <span>{item.label}</span>
        </div>
      ))}
      <span className="text-slate-500">Right-click inverses the current mode · Drag to paint</span>
    </div>
  )
}
