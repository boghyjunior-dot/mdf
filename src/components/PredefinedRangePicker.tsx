import { PREDEFINED_RANGES, getPredefinedRangeCategories } from '../lib/predefinedRanges'
import { useRange } from '../state/RangeContext'

export function PredefinedRangePicker() {
  const { dispatch } = useRange()
  const categories = getPredefinedRangeCategories()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-400 mr-1">Preset:</span>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) {
            dispatch({ type: 'LOAD_PREDEFINED_RANGE', rangeId: e.target.value })
            e.target.value = ''
          }
        }}
        className="rounded-md border border-slate-600 bg-slate-800 text-slate-200 text-sm px-3 py-1.5 min-w-[11rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <option value="">Load preset range…</option>
        {categories.map((category) => (
          <optgroup key={category} label={category.replace('MTT · 40BB · ', '')}>
            {PREDEFINED_RANGES.filter((range) => range.category === category).map((range) => (
              <option key={range.id} value={range.id} title={range.description}>
                {category.replace('MTT · 40BB · ', '')} {range.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
