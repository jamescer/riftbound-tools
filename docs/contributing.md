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
2. If you touched `utils/card-utils.ts`, add/update a case in `test/card-utils.test.ts` using its local fixture cards (no need to touch the real dataset).
3. If you added a new recognized enum value (e.g. a new `CardRarity`), also update `validRarities` in `src/utils/validate.ts` — otherwise `validateCard` will reject cards with that value, and the `import:cards` script will throw on them.
4. `npm test`

## Versioning / changelog

`CHANGELOG.md` at the repo root is maintained by hand (no automated changesets tooling is currently wired up in this repo, despite the changelog's entry format looking changeset-like). Bump `version` in `package.json` and add an entry to `CHANGELOG.md` for any release-worthy change.

## Conventions

- No runtime dependencies. Think twice before adding one — see [architecture.md](./architecture.md).
- Utility functions in `card-utils.ts` are pure: take `Card[]` in, return a new `Card[]` out, never mutate the input array.
- Prefer editing the CSV + regenerating over hand-editing `src/data/cards.json` — hand edits get silently discarded on the next `import:cards` run.
