# Data pipeline

The card dataset flows through three stages: **source CSV → `src/data/cards.json` → `dist/data/cards.json`**. There are three interchangeable ways to produce `cards.json`, and one script to publish it into `dist`. They are not run automatically as a chain — each is a separate, manually-invoked npm script.

## The scripts

| Script | npm command | Purpose |
| --- | --- | --- |
| [`scripts/import-csv.ts`](../scripts/import-csv.ts) | `npm run import:cards` | **The one actually used in practice.** Parses the maintainer-provided CSV at repo root into `src/data/cards.json`. |
| [`scripts/generate-cards.ts`](../scripts/generate-cards.ts) | `npm run generate:cards` | Writes a small **hardcoded example dataset** (5 flavor cards like "Abyssal Flamewing") to `src/data/cards.json`. Useful for resetting to a known-good sample or for testing the pipeline itself — **do not run this if you want the real 950-card dataset**, it will overwrite it. |
| [`scripts/fetch-cards.ts`](../scripts/fetch-cards.ts) | `npm run fetch:cards` | Fetches card JSON from a remote URL or local file (`--url=`, `--source=`, or `RIFTBOUND_CARDS_SOURCE_URL` env var) and normalizes it into `src/data/cards.json`. Not currently wired to a real endpoint — this is a scaffold for "pull from an external API" if/when one exists. |
| [`scripts/copy-assets.ts`](../scripts/copy-assets.ts) | (runs as part of `npm run build`) | Copies `src/data/cards.json` → `dist/data/cards.json` after `tsc` compiles. Needed because TypeScript's `outDir` compilation doesn't copy non-`.ts` assets on its own. |

All three data-generation scripts share the same shape: parse/normalize input → **validate** every record against the `Card` shape → throw on any invalid record → write the whole array as pretty-printed JSON. None of them do a partial write — it's all-or-nothing.

## `npm run import:cards` in detail

This is the script that matters for real data changes. Source: `Riftbound - All Card Info - All Card Data.csv` at the repo root.

**CSV columns** (header row, some columns are unnamed/unused spacers):

```
ID, Name, , , , , , Energy, Might, Power, Card Type, Rarity, Domain, Tags, Ability, Image URL
```

Column-to-field mapping:

- `ID` → `id` (also derives `setCode` from the prefix before `-`, e.g. `ogn-001` → `OGN`, and `set` via the `setCodeMap` lookup — see [data-model.md](./data-model.md#id--setcode--set))
- `Name` → `name`
- `Energy` → `energy`, and also feeds `cost` (see [data-model.md](./data-model.md#cost-vs-energy-vs-might))
- `Might` → `might`, fallback for `cost` if `Energy` is blank
- `Power` → `power` (currently always blank in the source CSV)
- `Card Type` → `type` (cast as-is, not validated against the `CardType` union at parse time — only at the later `validateCard` step)
- `Rarity` → `rarity`
- `Domain` → `domain` (comma-split, filtered to only recognized `CardDomain` values — unrecognized values are silently dropped, not errored)
- `Tags` → `tags` **and** `keywords` (same source column, duplicated into both fields)
- `Ability` → `ability`, `abilities` (single-element array), and `text` (all three, duplicated)
- `Image URL` → `imageUrl`

The CSV parser (`parseCsvLine`) is a minimal hand-rolled quoted-field parser (handles `"..."` and escaped `""` inside quotes) — it is not a general-purpose CSV library, so if the source CSV format changes (e.g. new columns, different quoting), check this function before assuming the parser will just handle it.

After parsing, `validateCard` checks every row has a non-empty `id`/`name`, a `type` in the known `CardType` set, a `rarity` in the known `CardRarity` set, numeric `cost`, non-empty `setCode`, and correctly-typed optional fields. **A single invalid row throws and aborts the entire import** — nothing is written. The thrown error includes the CSV row number (1-indexed from the header) and the parsed record, which is usually enough to spot the bad cell.

## Regenerating after a CSV update

```bash
npm run import:cards   # rewrites src/data/cards.json from the CSV
npm run build           # compiles TS + copies cards.json into dist/
npm test                 # sanity check nothing broke
```

`src/data/cards.json` is checked into the repo (not gitignored), so a regeneration shows up as a diff — review it like any other change before committing, since a bad CSV edit or a `setCodeMap` gap will show up as unexpected `undefined`s or wrong `set` values in the diff.

## Why `cards.json` exists as a separate file from `cards.ts`

`src/data/cards.ts` is trivial by design:

```ts
import { Card } from "../models/card";
import cardsJson from "./cards.json";

export const cards: Card[] = cardsJson as unknown as Card[];
```

Keeping the actual data in `.json` (rather than inlining a big TS array literal) means the import/fetch scripts can regenerate it with plain `fs.writeFileSync` + `JSON.stringify`, without needing to emit valid TypeScript syntax, and `tsconfig.json` has `resolveJsonModule: true` specifically to allow this import.
