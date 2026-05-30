import { useMemo, useState } from 'react'
import { RANKS, SUITS, STREET_LABELS, SUIT_FOUR_COLOR, type BoardCard, type RankIndex, type SuitId } from '../types/poker'
import { useRange } from '../state/RangeContext'
import { boardCardId, getStreet, isBoardCardTaken } from '../lib/board'
import { PlayingCard, cardFromRankSuit } from './PlayingCard'

const FLOP_SLOTS = [0, 1, 2] as const
const TURN_SLOT = 3
const RIVER_SLOT = 4

export function BoardPicker() {
  const { state, dispatch } = useRange()
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const street = getStreet(state.board)
  const takenIds = useMemo(() => new Set(state.board.map(boardCardId)), [state.board])
  const nextSlot = state.board.length < 5 ? state.board.length : null

  const addCard = (rank: RankIndex, suit: SuitId) => {
    if (activeSlot === null) return
    const card = cardFromRankSuit(rank, suit)
    if (isBoardCardTaken(state.board, activeSlot, card)) return
    dispatch({ type: 'SET_BOARD_CARD', index: activeSlot, card })
    setActiveSlot(null)
  }

  const removeFromSlot = (index: number) => {
    if (index >= state.board.length) return
    dispatch({ type: 'SET_BOARD_CARD', index, card: null })
    setActiveSlot(null)
  }

  const clearBoard = () => {
    dispatch({ type: 'CLEAR_BOARD' })
    setActiveSlot(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <BoardGroup
          label="Flop"
          slots={FLOP_SLOTS}
          board={state.board}
          activeSlot={activeSlot}
          onSelectSlot={setActiveSlot}
          onRemove={removeFromSlot}
        />
        <div className="hidden sm:block w-px h-12 bg-slate-700/80" aria-hidden />
        <BoardGroup
          label="Turn"
          slots={[TURN_SLOT]}
          board={state.board}
          activeSlot={activeSlot}
          onSelectSlot={setActiveSlot}
          onRemove={removeFromSlot}
        />
        <div className="hidden sm:block w-px h-12 bg-slate-700/80" aria-hidden />
        <BoardGroup
          label="River"
          slots={[RIVER_SLOT]}
          board={state.board}
          activeSlot={activeSlot}
          onSelectSlot={setActiveSlot}
          onRemove={removeFromSlot}
        />

        <div className="flex items-center gap-3 ml-auto">
          <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-blue-300 border border-slate-700">
            {STREET_LABELS[street]}
          </span>
          {state.board.length > 0 && (
            <button
              type="button"
              onClick={clearBoard}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {activeSlot !== null && (
        <div className="rounded-lg border border-slate-700/80 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Select card · {slotLabel(activeSlot)}
            </span>
            <button
              type="button"
              onClick={() => setActiveSlot(null)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-[2.5rem_repeat(13,minmax(3rem,1fr))] sm:grid-cols-[3rem_repeat(13,minmax(3.5rem,1fr))] gap-1.5 sm:gap-2">
                <div />
                {RANKS.map((rank) => (
                  <div
                    key={rank}
                    className="text-sm sm:text-base font-bold text-slate-400 text-center pb-1"
                  >
                    {rank}
                  </div>
                ))}

                {SUITS.map((suit) => (
                  <SuitRow
                    key={suit.id}
                    suit={suit}
                    takenIds={takenIds}
                    onPick={addCard}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {nextSlot !== null && activeSlot === null && (
        <p className="text-sm text-slate-500">
          Click + on the next board slot to open the deck. Click a dealt card to remove it and later streets.
        </p>
      )}
    </div>
  )
}

function BoardGroup({
  label,
  slots,
  board,
  activeSlot,
  onSelectSlot,
  onRemove,
}: {
  label: string
  slots: readonly number[]
  board: BoardCard[]
  activeSlot: number | null
  onSelectSlot: (index: number) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="flex items-end gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-9 pb-1">
        {label}
      </span>
      <div className="flex gap-1.5">
        {slots.map((index) => {
          const card = board[index]
          const isOpen = index === board.length
          const isLocked = index > board.length
          const isSelecting = activeSlot === index

          return (
            <PlayingCard
              key={index}
              card={card}
              variant="deck"
              selected={isSelecting || isOpen}
              disabled={isLocked}
              emptyLabel={isOpen ? '+' : undefined}
              onClick={() => {
                if (card) onRemove(index)
                else if (isOpen) onSelectSlot(index)
              }}
              title={
                card
                  ? `Remove ${RANKS[card.rank]}${SUITS.find((s) => s.id === card.suit)!.symbol}`
                  : isOpen
                    ? `Pick ${slotLabel(index)}`
                    : slotLabel(index)
              }
            />
          )
        })}
      </div>
    </div>
  )
}

function SuitRow({
  suit,
  takenIds,
  onPick,
}: {
  suit: (typeof SUITS)[number]
  takenIds: Set<string>
  onPick: (rank: RankIndex, suit: SuitId) => void
}) {
  const rowStyle = SUIT_FOUR_COLOR[suit.id]

  return (
    <>
      <div
        className={`flex items-center justify-center font-bold rounded-md ${rowStyle.rowBg} ${rowStyle.rowText} text-xl sm:text-2xl min-h-[4.5rem] sm:min-h-[5rem]`}
      >
        {suit.symbol}
      </div>
      {RANKS.map((_, rankIndex) => {
        const card = cardFromRankSuit(rankIndex as RankIndex, suit.id)
        const taken = takenIds.has(boardCardId(card))

        return (
          <PlayingCard
            key={`${suit.id}-${rankIndex}`}
            card={card}
            size="lg"
            variant="deck"
            disabled={taken}
            onClick={() => onPick(rankIndex as RankIndex, suit.id)}
          />
        )
      })}
    </>
  )
}

function slotLabel(index: number): string {
  if (index < 3) return `Flop ${index + 1}`
  if (index === 3) return 'Turn'
  return 'River'
}
