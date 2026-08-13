# riftbound-tools documentation

`riftbound-tools` is a Node/TypeScript library that packages structured data and utilities for the **Riftbound: League of Legends Trading Card Game**. It exists so that fan sites, deckbuilders, and other tools don't each have to scrape, parse, and model the card data themselves — they `npm install riftbound-tools` and get typed cards plus filter/search helpers out of the box.

This `docs/` folder is the extended reference for the project. The root [`README.md`](../README.md) stays short (npm/GitHub render it directly); everything else — data model details, the CSV-to-JSON pipeline, the full API surface, and game background — lives here.

## Start here

| Doc | What it covers |
| --- | --- |
| [architecture.md](./architecture.md) | Repo layout, module boundaries, build/publish flow, how the pieces fit together |
| [data-model.md](./data-model.md) | The `Card` interface field-by-field, enums, and what the real dataset actually contains |
| [data-pipeline.md](./data-pipeline.md) | How `cards.json` is produced from the source CSV, and the other data scripts |
| [api-reference.md](./api-reference.md) | Every exported type and function from the package entrypoint, with examples |
| [contributing.md](./contributing.md) | Local dev setup, npm scripts, testing conventions |
| [game-background.md](./game-background.md) | Riftbound (the actual card game) background: publishers, sets, release dates, rules primer |
| [../CHANGELOG.md](../CHANGELOG.md) | Version history (kept at repo root by convention) |

## The one-paragraph version

This package has no runtime dependencies. It ships a `Card` discriminated-union type (`src/models/card.ts`), a static dataset of ~950 cards compiled into `src/data/cards.json` (`src/data/cards.ts` just imports and re-exports it, typed), and a small set of pure filter/search/sort functions over arrays of cards (`src/utils/card-utils.ts`). Everything is re-exported from `src/index.ts`. The card data originates from a maintainer-provided CSV (`Riftbound - All Card Info - All Card Data.csv` at repo root) and is regenerated via `npm run import:cards`, not hand-edited.

## Context for future Claude sessions

If you're picking this repo up cold, the things most worth knowing before making changes:

- **This is a data + utility library, not an app.** There's no server, no UI, no state beyond the static card array. Changes here ripple out to every consumer app that imports `riftbound-tools`.
- **`cards.json` is generated, not authored.** Never hand-edit `src/data/cards.json` directly for a lasting fix — fix it upstream in the CSV (or the import script) and regenerate, or the fix will be lost on the next import. See [data-pipeline.md](./data-pipeline.md).
- **`cost` is a derived field**, not a column that exists in the source CSV. See [data-model.md](./data-model.md#cost-vs-energy-vs-might) before assuming it means what it sounds like it means.
- **The `CardSet` / `CardRarity` enums are ahead of the data.** They already include sets and rarities (`Vendetta`, `Radiance`, `Ultimate`-style tiers) that don't exist in `cards.json` yet, because the real-world game hasn't released them. Check [game-background.md](./game-background.md) for the real-world release schedule before treating an enum member as "in the data."
- **Package is CommonJS**, targets ES2020, and has zero runtime dependencies by design — keep it that way unless there's a strong reason to add one.
