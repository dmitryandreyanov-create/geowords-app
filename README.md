# GeoWords — Level 3 Mountains / Puzzle 1

Mobile-first PWA prototype based on the original GeoWords Level 3: Mountains workbook.

## Prototype scope
- Original Puzzle 1 map artwork
- Original clue sequence for GRANITE
- Pre-quiz facts needed to solve the final clue
- Tap targets over the original letter markers
- Automatic answer/progress handling
- Pinch/pan map interaction
- Completion medal + key-word definition
- Next-quiz fact bridge (Urals)

## Product architecture
Content lives in `data/levels.js`; the engine lives in `app.js`. New puzzles should be data-only wherever possible.
