# riftbound-tools — Claude context

A **CommonJS TypeScript library** (`"type": "commonjs"`) with zero runtime dependencies. It provides typed models, a static card dataset (~950 cards), and filter/sort/search utilities for the Riftbound TCG.

## Quick orientation

```
src/
  models/card.ts       — types: Card (discriminated union), CardBase, CardDomain, CardRarity, CardType, CardSet
  data/cards.ts        — exports `cards: Card[]` backed by cards.json
  data/cards.json      — generated; do not edit by hand
  data/setCodeMap.ts   — setCodeMap: Record<string, CardSet>; shared by scripts + exported from package
  utils/card-utils.ts  — all filter/sort/search/group/stats functions
  utils/validate.ts    — validateCard(), validDomains/Types/Rarities/Sets (also exported from package)
  index.ts             — barrel re-export of all five above

scripts/
  import-csv.ts        — CSV → cards.json (canonical data pipeline)
  fetch-cards.ts       — fetch remote JSON → cards.json (alternative source)
  generate-cards.ts    — writes 5 example cards to cards.json (dev fixture; overwrites real data)
  copy-assets.ts       — copies cards.json → dist/data/cards.json (run after tsc)
  utils.ts             — thin re-export shim so scripts can import from ./utils

test/
  card-utils.test.ts   — unit tests for all utility functions (~70 tests)
  data-integrity.test.ts — validates real cards.json shape at test time
  validate.test.ts     — unit tests for validateCard() (~50 tests)

docs/
  api-reference.md     — every exported function with signatures and examples
  architecture.md      — module boundaries, repo layout
  contributing.md      — how to add new utilities/enums
  data-model.md        — field-by-field explanation of CardBase
  data-pipeline.md     — CSV → JSON import flow, validation steps
  game-background.md   — Riftbound TCG context for contributors unfamiliar with the game
```

## Key commands

| Command | What it does |
| --- | --- |
| `npm run build` | `tsc -p tsconfig.json` then `copy-assets` |
| `npm test` | `vitest run` |
| `npm run test:watch` | `vitest` (interactive) |
| `npm run fetch:riot` | Regenerate `src/data/cards.json` from the official Riot `riftbound-content-v1` API (requires `RIOT_API_KEY` env var) |
| `npm run import:cards` | Regenerate `src/data/cards.json` from the CSV |
| `npm run fetch:cards -- --url=<url>` | Populate `src/data/cards.json` from an arbitrary remote JSON source |
| `npm run generate:cards` | Write 5 example cards (overwrites real data — dev only) |

Verify types without building: `npx tsc --noEmit -p tsconfig.json`

## Important conventions

### Data model
- `Card` is a discriminated union narrowed by `type`. To narrow: `if (card.type === "Unit") { ... }`.
- When constructing a `Card` literal from a spread, TypeScript needs `as Card` — this is expected, not a smell.
- `cost` is derived (`energy ?? might ?? 0`), not a CSV column. `energy` is **Unit-only** (all 491 Units have it; Spells/Gear never do). For Spells/Gear, `might` is their play cost. For Units, `energy` is play cost and `might` is a separate combat stat.
- `tags` is **deprecated** — always identical to `keywords`. The import script no longer emits it. Use `keywords` for region/champion tags.
- `ability` is **deprecated** — use `abilities[0]` or `text`. The import script no longer emits it; `cards.json` has 0 cards with this field.
- `power` is **deprecated** — defined in the schema but unused. 0 cards have it. Do not read or filter on it.
- `keywords` = region/champion tags (e.g. `"Ionia"`, `"Dragon"`). Not the same as rules keywords.
- Rules keywords (`[Accelerate]`, `[Deflect]`) live in `text` in `[Bracket]` notation. Use `extractRulesKeywords(card)` to parse them.
- 20 cards have empty `text` — this is correct (Rune base cards + generated token units with no ability text).

### Adding a new utility function
1. Add to `src/utils/card-utils.ts` (pure function, takes/returns `Card[]`).
2. Add tests to `test/card-utils.test.ts`.
3. Update `docs/api-reference.md`.
4. Run `npx tsc --noEmit -p tsconfig.json` to confirm no type errors.
No import changes needed — `src/index.ts` re-exports `* from "./utils/card-utils"`.

### Adding a new enum value (e.g. a new CardRarity)
1. Add the string literal to the type in `src/models/card.ts`.
2. Add to the matching `valid*` Set in `src/utils/validate.ts`.
3. Update `docs/data-model.md` and `docs/contributing.md`.
4. Regenerate `cards.json` once the CSV contains cards with that value.

### Adding a new set
1. Add the set name to `CardSet` in `src/models/card.ts`.
2. Add it to `validSets` in `src/utils/validate.ts`.
3. Add the lowercased set code → set name mapping to `src/data/setCodeMap.ts` (also add it to `setOrder` in `src/utils/card-utils.ts` if you want `sortBySet` to order it correctly).
4. Update `docs/game-background.md` set table and `docs/data-model.md` enum table.
5. Run `npm run import:cards` once the CSV contains Vendetta/new-set cards.

### Regenerating cards.json

**Preferred: Riot API** (requires `RIOT_API_KEY` env var — never commit the key):
```bash
export RIOT_API_KEY=RGAPI-...
npm run fetch:riot
```
Invalid cards (unrecognized type/rarity) are logged and skipped. If skips occur, add the new value to `src/models/card.ts` and `src/utils/validate.ts`, then re-run.

Quarterly automation: `.github/workflows/sync-cards.yml` runs this on a schedule and opens a PR when `cards.json` changes. Add `RIOT_API_KEY` as a GitHub Actions repository secret to activate it.

**Alternative: CSV** — `Riftbound - All Card Info - All Card Data.csv` must be at the repo root:
```bash
npm run import:cards
```
The CSV script throws immediately on unknown `type` or `rarity` — update the enum and `valid*` set first.

### Running scripts via ts-node
Scripts are excluded from `tsconfig.json` (so they don't end up in `dist/`). Run them via `ts-node`, not `tsc`:
```bash
npx ts-node ./scripts/import-csv.ts
```
Running `tsc` directly on script files without `-p tsconfig.json` produces false `esModuleInterop` errors — ignore those; the scripts work correctly via ts-node.

### Test environment limitation
`node_modules` was installed on Windows; `vitest run` fails in the Linux sandbox with a rollup native-module error. Use `npx tsc --noEmit -p tsconfig.json` for CI-style verification in the shell. Tests run correctly in the Windows environment where the package was installed.
