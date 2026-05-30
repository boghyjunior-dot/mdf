# MDF Range Tool

A client-side poker study tool for building defending ranges against different bet sizes using **Minimum Defense Frequency (MDF)**.

## Features

- **13×13 hand matrix** with standard layout (suited above diagonal, offsuit below, pairs on diagonal)
- **Custom range painting** — click or drag to add hands to your range
- **MDF bet presets** — b25 through b200 with target fold percentages
- **Manual call/fold tagging** — mark hands and track combo-weighted fold % vs target
- **Bulk filters** — exclude entire ranks (row/column headers), hand categories (suited/offsuit/pairs), or specific suits (♠♥♦♣)
- **Auto-save** — range and settings persist in `localStorage`
- **Board picker** — set flop, turn, and river; folded combos drop out of your range each street, tags clear, and the bet target resets

## MDF Targets

| Bet | Target fold % |
|-----|---------------|
| b25 | 20% |
| b33 | 25% |
| b40 | 28% |
| b50 | 33% |
| b67 | 40% |
| b75 | 42% |
| b100 | 50% |
| b120 | 54% |
| b150 | 60% |
| b200 | 66% |

## Usage

1. Select **Paint range** and click/drag hands into your starting range, or load a **preset range** (UTG open, BB vs BTN, etc.)
2. Choose **Paint freq** — 100%, 50%, or 25% to include that fraction of combos per hand
3. Pick a **bet size** to set the MDF fold target
4. Use **Select combos** mode — click a hand, then pick which combos to fold or call in the panel
5. Watch **Current** fold % vs **Target** in the stats bar
6. Use rank headers, suit category toggles, or **Exclude suit** buttons (♠♥♦♣) to remove hand groups from MDF math
7. Set the **board** (flop → turn → river) to study postflop defense — folded combos are removed from your range, tags clear, and the bet target resets to b50

**Combo selection:**
- Use the **Combo detail** panel (right of matrix) with **F / C / –** buttons per combo
- Grids: 2×2 suited, 2×3 pairs, 3×4 offsuit
- Mixed hands (some combos folded, some not) show in amber on the matrix

**Tips:**
- Right-click a cell to remove it from range
- Drag while painting to fill multiple cells quickly
- Re-click tagged cells to cycle: call → fold → in range

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run test     # run unit tests
```

## Combo math

Fold % uses standard combo weighting: pairs = 6, suited = 4, offsuit = 12 combos per cell.
