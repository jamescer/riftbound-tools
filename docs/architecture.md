# Architecture

## What this package is

`riftbound-tools` is a small CommonJS library published to npm as `riftbound-tools`. It has **zero runtime dependencies** — everything shipped in `dist/` is plain compiled JS plus one JSON data file. `ts-node`, `typescript`, `vitest`, and `@types/node` are devDependencies only, used for building/testing/data-generation, never bundled.

## Repo layout

```
riftbound-tools/
├── src/
│   ├── models/card.ts        # Card type + enums (see data-model.md)
│   ├── data/
│   │   ├── cards.ts           # typed re-export of cards.json
│   │   └── cards.json         # the actual dataset (generated, checked in)
│   ├── utils/card-utils.ts   # filter/sort/search functions
│   └── index.ts               # public API barrel
├── scripts/                   # data generation, not shipped in dist/
│   ├── import-csv.ts          # CSV -> cards.json (the one that matters)
│   ├── generate-cards.ts      # hardcoded sample -> cards.json
│   ├── fetch-cards.ts         # remote JSON -> cards.json
│   └── copy-assets.ts         # cards.json -> dist/data/cards.json
├── test/
│   └── card-utils.test.ts    # vitest unit tests for utils
├── docs/                       # you are here
├── dist/                       # build output, gitignored
├── Riftbound - All Card Info - All Card Data.csv   # source of truth for card data
├── tsconfig.json
├── package.json
├── CHANGELOG.md
└── README.md
```

## Module boundaries

- **`models/`** has no dependencies on anything else in `src/` — it's pure type definitions.
- **`data/`** depends only on `models/` (for the `Card` type annotation).
- **`utils/`** depends only on `models/` (imports `Card`, `CardDomain`, etc. as types) — it does **not** import `data/cards`. Utility functions take `cards: Card[]` as a parameter rather than reaching for the global dataset, which keeps them testable against arbitrary fixture arrays (see `test/card-utils.test.ts`, which uses its own local fixture cards rather than the real dataset).
- **`index.ts`** is the only file that ties the three together, via `export *`.

This means: adding a new field to `Card` only requires touching `models/card.ts` (types) and whichever data-generation script(s) populate that field — `utils/` code that doesn't reference the new field needs no changes.

## Build

```
npm run build
  → tsc -p tsconfig.json     # src/**/*.ts -> dist/**/*.js + .d.ts (declaration: true)
  → npm run copy-assets       # copies src/data/cards.json -> dist/data/cards.json
```

`tsconfig.json` compiles `src/` only (`rootDir: "src"`, `include: ["src/**/*"]`); `scripts/` and `test/` are explicitly excluded from the build and are only ever run directly via `ts-node`. `resolveJsonModule: true` is required because `data/cards.ts` imports `cards.json` directly.

`package.json`'s `prepare` script runs `npm run build` automatically on `npm install` (both for consumers installing from git and for local dev after cloning).

## Publishing shape

`package.json` declares:

```json
"main": "dist/index.js",
"types": "dist/index.d.ts",
"files": ["dist"],
"exports": { ".": { "import": "./dist/index.js", "require": "./dist/index.js" } }
```

Only `dist/` is published (`files: ["dist"]`) — `src/`, `scripts/`, `test/`, the CSV, and `docs/` never ship to consumers. Note `exports.import` and `exports.require` both point at the same CommonJS file (`type: "commonjs"` in `package.json`); there is no separate ESM build. That's a deliberate simplicity tradeoff, not an oversight — revisit only if a consumer actually needs native ESM.

## Testing

`vitest` runs `test/card-utils.test.ts`, which exercises the pure functions in `utils/card-utils.ts` against a small local fixture array (not the real `cards` dataset). `test/data-integrity.test.ts` validates the shape of the real `src/data/cards.json` at test time — it loads the dataset and asserts required fields, unique IDs, recognized enum values, and setCode/id consistency. This catches schema drift (e.g. a new card type in the CSV not yet reflected in the TypeScript enum) before it ships. Generation-time validation via `validateCard` in the import/generate/fetch scripts (see [data-pipeline.md](./data-pipeline.md)) is still the first line of defense; the test is a second check.
