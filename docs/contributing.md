# Contributing / local development

## Setup

```bash
npm install       # also runs `prepare` -> `npm run build`
```

## npm scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Compile TypeScript (`tsc`) and copy `cards.json` into `dist/` |
| `npm run generate:cards` | Overwrite `src/data/cards.json` with a small hardcoded sample dataset — **don't run this on top of real data you want to keep** |
| `npm run import:cards` | Regenerate `src/data/cards.json` from the root CSV — the normal way to update card data |
| `npm run fetch:cards` | Regenerate `src/data/cards.json` from a remote/local JSON source (`--url=`/`--source=`/`RIFTBOUND_CARDS_SOURCE_URL`) |
| `npm run copy-assets` | Copy `src/data/cards.json` → `dist/data/cards.json` (also runs as part of `build`) |
| `npm test` | Run the `vitest` suite in `test/` once and exit |
| `npm run test:watch` | Run `vitest` in watch mode — re-runs affected tests on file save |

See [data-pipeline.md](./data-pipeline.md) for what each data script actually does under the hood.

## Making a data change

1. Edit `Riftbound - All Card Info - All Card Data.csv` at the repo root.
2. `npm run import:cards`
3. Review the diff in `src/data/cards.json` — this is a generated file, but it's checked into git, so the diff is your review surface for the CSV edit.
4. `npm run build && npm test`

## Making a model/API change

1. Edit `src/models/card.ts` and/or `src/utils/card-utils.ts`.
2. If you added new exported functions, document them in `docs/api-reference.md` and update the relevant section of `README.md`.
3. If you touched `utils/card-utils.ts`, add/update a case in `test/card-utils.test.ts` using its local fixture cards (no need to touch the real dataset).
4. If you added a new recognized enum value (e.g. a new `CardRarity`), also update `validRarities` in `src/utils/validate.ts` — otherwise `validateCard` will reject cards with that value, and the `import:cards` script will throw on them.
5. `npm test` (or `npx tsc --noEmit -p tsconfig.json` if running in the Linux sandbox where vitest fails)

## Adding a new set

1. Add the set name to `CardSet` in `src/models/card.ts` and to `validSets` in `src/utils/validate.ts`.
2. Add the lowercased prefix → set name entry to `src/data/setCodeMap.ts` — this is the single source of truth used by both import scripts.
3. Add the set to `setOrder` in `src/utils/card-utils.ts` so `sortBySet` orders it correctly.
4. Update `docs/game-background.md` set table and `docs/data-model.md` enum table.
5. Run `npm run import:cards` once a CSV containing the new set's cards is available.

## Versioning / changelog

`CHANGELOG.md` at the repo root is maintained by hand (no automated changesets tooling is currently wired up in this repo, despite the changelog's entry format looking changeset-like). Bump `version` in `package.json` and add an entry to `CHANGELOG.md` for any release-worthy change.

## Conventions

- No runtime dependencies. Think twice before adding one — see [architecture.md](./architecture.md).
- Utility functions in `card-utils.ts` are pure: take `Card[]` in, return a new `Card[]` out, never mutate the input array.
- Prefer editing the CSV + regenerating over hand-editing `src/data/cards.json` — hand edits get silently discarded on the next `import:cards` run.
