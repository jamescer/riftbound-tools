# Architecture

## What this package is

`riftbound-tools` is a small CommonJS library published to npm as `riftbound-tools`. It has **zero runtime dependencies** — everything shipped in `dist/` is plain compiled JS plus one JSON data file. `ts-node`, `typescript`, `vitest`, and `@types/node` are devDependencies only, used for building/testing/data-generation, never bundled.

## Repo layout

```
riftbound-tools/
├── src/
│   ├── models/card.ts          # Card type + enums (see data-model.md)
│   ├── data/
│   │   ├── cards.ts             # typed re-export of cards.json
│   │   ├── cards.json           # the actual dataset (generated, checked in)
│   │   └── setCodeMap.ts        # setCodeMap: Record<string, CardSet> (shared by scripts + exported)
│   ├── utils/
│   │   ├── card-utils.ts        # filter/sort/search/group functions
│   │   └── validate.ts          # validateCard() + valid* sets (exported from package)
│   └── index.ts                 # public API barrel
├── scripts/                     # data generation, not shipped in dist/
│   ├── import-csv.ts            # CSV -> cards.json (the one that matters)
│   ├── generate-cards.ts        # hardcoded sample -> cards.json
│   ├── fetch-cards.ts           # remote JSON -> cards.json
│   ├── copy-assets.ts           # cards.json -> dist/data/cards.json
│   └── utils.ts                 # re-exports validateCard + valid* from src/utils/validate
├── test/
│   ├── card-utils.test.ts       # vitest unit tests for all utility functions
│   ├── data-integrity.test.ts   # validates shape of real src/data/cards.json
│   └── validate.test.ts         # unit tests for validateCard()
├── docs/                         # you are here
├── dist/                         # build output, gitignored
├── Riftbound - All Card Info - All Card Data.csv   # source of truth for card data
├── CLAUDE.md                    # AI agent onboarding — repo conventions, commands, key invariants
├── vitest.config.ts
├── tsconfig.json
├── package.json
├── CHANGELOG.md
└── README.md
```

## Module boundaries

- **`models/`** has no dependencies on anything else in `src/` — it's pure type definitions.
- **`data/`** depends only on `models/` (for the `Card` and `CardSet` type annotations). `setCodeMap.ts` lives here and is imported by both `scripts/import-csv.ts` and `scripts/fetch-cards.ts` so the mapping stays in one place; it is also exported from `index.ts` for consumers who need to resolve raw set codes.
- **`utils/card-utils.ts`** depends only on `models/` (imports `Card`, `CardDomain`, etc. as types) — it does **not** import `data/cards`. Utility functions take `cards: Card[]` as a parameter rather than reaching for the global dataset, which keeps them testable against arbitrary fixture arrays (see `test/card-utils.test.ts`, which uses its own local fixture cards rather than the real dataset).
- **`utils/validate.ts`** depends only on `models/`. It exports `validateCard()` (a runtime type-guard for the `Card` shape) and the `valid*` sets (`validTypes`, `validRarities`, `validDomains`, `validSets`). It is also re-exported by `scripts/utils.ts` so the data-pipeline scripts can import it without a relative path change, and it is part of the public package API (re-exported from `index.ts`).
- **`index.ts`** is the only file that ties everything together, via `export *`.

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

Three test files, each with a distinct role:

- **`test/card-utils.test.ts`** — exercises every exported function in `utils/card-utils.ts` against a small local fixture array (not the real dataset). Adding a new utility means adding a `describe` block here.
- **`test/validate.test.ts`** — unit tests for `validateCard()` covering valid inputs, missing required fields, wrong types, and invalid enum values.
- **`test/data-integrity.test.ts`** — loads the real `src/data/cards.json` and asserts structural invariants: required fields, unique IDs, recognized enum values, setCode/id consistency, and per-type field relationships (e.g. all Units have `energy`, no Spells/Gears do, Runes/Battlefields/Legends always have `cost: 0`). Catches schema drift — a new card type in the CSV not yet in the TypeScript enum — before it ships.

Generation-time validation via `validateCard` in the import/generate/fetch scripts (see [data-pipeline.md](./data-pipeline.md)) is the first line of defense; `data-integrity.test.ts` is a second check at test time.
