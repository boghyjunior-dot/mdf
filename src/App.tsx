import { RangeProvider } from './state/RangeContext'
import { BoardPicker } from './components/BoardPicker'
import { BetSizeBar } from './components/BetSizeBar'
import { StatsBar } from './components/StatsBar'
import { Toolbar } from './components/Toolbar'
import { HandMatrix } from './components/HandMatrix'
import { ComboPanel } from './components/ComboPanel'
import { Legend } from './components/Legend'

function App() {
  return (
    <RangeProvider>
      <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">MDF Range Tool</h1>
          <p className="text-sm text-slate-400">
            Paint your range, pick a bet size, tag hands to call or fold, and track MDF fold %.
          </p>
        </header>

        <div className="space-y-4">
          <section className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
            <BetSizeBar />
          </section>

          <section className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
            <StatsBar />
          </section>

          <section className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
            <Toolbar />
          </section>

          <section className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
            <BoardPicker />
          </section>

          <section className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
            <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 items-start">
              <div className="shrink-0">
                <HandMatrix />
              </div>
              <div className="w-full xl:w-auto xl:min-w-[19rem] xl:shrink-0 xl:sticky xl:top-4 border-t xl:border-t-0 xl:border-l border-slate-700 pt-4 xl:pt-0 xl:pl-6">
                <h2 className="text-sm font-semibold text-slate-300 mb-3">Combo detail</h2>
                <ComboPanel />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <Legend />
            </div>
          </section>
        </div>
      </div>
    </RangeProvider>
  )
}

export default App
