import { RANKS, SUITS, SUIT_FOUR_COLOR, type BoardCard, type RankIndex, type SuitId } from '../types/poker'

interface PlayingCardProps {
  card?: BoardCard | null
  size?: 'sm' | 'md' | 'lg'
  variant?: 'board' | 'deck'
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  title?: string
  emptyLabel?: string
}

const SIZE_CLASSES = {
  sm: {
    card: 'w-8 h-11 p-0.5',
    rank: 'text-[10px]',
    suit: 'text-[10px]',
    empty: 'text-[9px]',
  },
  md: {
    card: 'w-10 h-14 p-1',
    rank: 'text-xs',
    suit: 'text-xs',
    empty: 'text-[9px]',
  },
  lg: {
    card: 'w-12 h-[4.5rem] sm:w-14 sm:h-[5rem] p-1.5',
    rank: 'text-base sm:text-lg',
    suit: 'text-xl sm:text-2xl',
    empty: 'text-xs',
  },
} as const

export function PlayingCard({
  card,
  size = 'md',
  variant = 'board',
  selected = false,
  disabled = false,
  onClick,
  title,
  emptyLabel,
}: PlayingCardProps) {
  const styles = SIZE_CLASSES[size]

  if (!card) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        title={title ?? emptyLabel}
        className={`${styles.card} rounded-md border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${
          disabled
            ? 'border-slate-800/60 bg-slate-900/20 cursor-not-allowed'
            : selected
              ? 'border-blue-400 bg-blue-950/30 shadow-[0_0_0_1px_rgba(96,165,250,0.4)]'
              : 'border-slate-600/70 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/70 cursor-pointer'
        }`}
      >
        {emptyLabel && !disabled && (
          <span className={`${styles.empty} text-slate-500 font-semibold`}>{emptyLabel}</span>
        )}
      </button>
    )
  }

  const rank = RANKS[card.rank]
  const suit = SUITS.find((s) => s.id === card.suit)!
  const colors = SUIT_FOUR_COLOR[card.suit]
  const isDeck = variant === 'deck'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title ?? `${rank}${suit.symbol}`}
      className={`${styles.card} rounded-md border flex flex-col justify-between shrink-0 shadow-md transition-all ${
        isDeck ? `${colors.deckBg} ${colors.deckBorder}` : 'bg-white border-slate-300'
      } ${
        disabled
          ? 'opacity-30 cursor-not-allowed grayscale'
          : selected
            ? 'border-blue-400 ring-2 ring-blue-400/50 cursor-pointer scale-105'
            : 'hover:border-blue-300 hover:shadow-lg hover:scale-105 cursor-pointer'
      }`}
    >
      <span className={`font-bold leading-none ${styles.rank} ${colors.text}`}>{rank}</span>
      <span className={`self-end leading-none ${styles.suit} ${colors.text}`}>{suit.symbol}</span>
    </button>
  )
}

export function cardFromRankSuit(rank: RankIndex, suit: SuitId): BoardCard {
  return { rank, suit }
}
