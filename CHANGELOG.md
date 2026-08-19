# riftbound-tools

## 1.2.3

### Scripts

WIP

---

## 1.2.2

### New utilities

- `groupByCost(cards)` — groups cards by cost value (`Record<number, Card[]>`); the missing member of the `groupBy*` family
- `countByCost(cards)` — count per cost value (`Record<number, number>`); the mana curve in one call
- `getUniqueSets(cards)` — returns `CardSet[]` in chronological release order; complements `getUniqueSetCodes` with typed, set-name-level deduplication (e.g. OGN + OGS both collapse to "Origins")
- `sumCost(cards)` — total cost across a card array; useful for deck mana value calculations
- `filterByImageUrl(cards, hasImage?)` — keep cards with (or without) an `imageUrl`; defaults to `true` (has art), pass `false` to audit cards missing art

### Fixes

- `scripts/fetch-riot-api.ts`: improved 403/401/429 error messages with specific guidance. 403 now explains that development keys do not include `riftbound-content-v1` access and links to the production key approval flow at developer.riotgames.com.

---

## 1.2.1

### New utilities

- `getCardStats(cards)` — returns aggregate statistics (`min`, `max`, `avg`, `count`) for the `cost`, `energy`, and `might` fields across a card array. Useful for mana-curve analysis and deck analytics without reimplementing aggregation. `energy` and `might` stats count only cards where those fields are defined. `CardStats` and `CardFieldStats` interfaces exported alongside it.

### Documentation

- Updated `api-reference.md` Typical usage section: now shows `composeFilters` as an alternative to inline nesting; removed the stale "no built-in chaining/fluent API" claim.
- Added `CardFieldStats` and `CardStats` interface entries to the Types section of `api-reference.md`, and `getCardStats` to the Utilities section.
- Added a `## Stats` section to `README.md` showing `getCardStats` usage.
- Updated `README.md` quick-start note to mention `composeFilters`.

---

## 1.2.0

### New utilities

- `filterByEnergyExists(cards)` — keeps cards that have `energy` defined; more ergonomic than `filterByType(cards, "Unit")` when the field is what matters
- `filterByMightExists(cards)` — keeps cards that have `might` defined (Units with combat stats + costed Spells/Gear)
- `getCardReprintings(cards, cardOrId)` — returns all other printings of a card (same name, different id); accepts a `Card` object or a raw id string. Returns `[]` if no alternate printings exist.

### Refactor

- **Centralized `setCodeMap`** into `src/data/setCodeMap.ts`, exported from the package root. Previously copy-pasted identically in `scripts/import-csv.ts` and `scripts/fetch-cards.ts`; now both import the single authoritative version. When a new set ships, only one file needs updating.

### Fixes

- `validateCard` now checks that `collectible`, when present, is a boolean (previously unchecked)

---

## 1.1.9

### New utilities

- `filterByIds(cards, ids)` — bulk ID lookup returning all cards whose `id` is in the given list; uses a `Set` for O(n) lookup instead of O(n²). Useful for hydrating saved deck lists back into typed `Card` objects.
- `paginateCards(cards, page, pageSize)` — zero-indexed page slicing for card browser UIs; returns a `CardPage` object with `items`, `total`, `page`, `pageSize`, and `totalPages`. Sort/filter the array before passing it in.
- `CardPage` interface exported alongside `paginateCards`.

### Fixes

- `normalizeDomain` in `import-csv.ts` now emits a `console.warn` when it encounters an unrecognized domain value instead of silently dropping it. Previously, a new domain string in the CSV would vanish without any indication — now it surfaces as a visible warning pointing to the fix needed (add to `CardDomain` and `validDomains`).

### Documentation

- Updated `game-background.md`, `data-model.md`, and `docs/README.md` to reflect that Vendetta released on 2026-07-31. Its CSV has not yet been imported into `cards.json`, but the set code (`VND`) is already in the `setCodeMap`. Radiance is still unreleased (expected 2026-10-23).
- Added `CardFilter` and `CardPage` type entries to the Types section of `api-reference.md`.

---

## 1.1.8

### New utilities

- `composeFilters(...filters)` — composes multiple `CardFilter` functions into a single reusable filter applied left-to-right; eliminates deep nesting for complex multi-condition filter chains. `CardFilter` type alias (`(cards: Card[]) => Card[]`) exported alongside it.
- `sortBySet(cards, direction?)` — sort by chronological set release order using the new exported `setOrder` map (Origins=0 → Spiritforged=1 → Unleashed=2 → Vendetta=3 → Radiance=4); cards with unknown set sort last
- `setOrder: Partial<Record<CardSet, number>>` — the set ordering map used by `sortBySet`, exported for custom set-order comparisons
- `groupBySetCode(cards)` — groups by raw `setCode` string (e.g. `"OGN"`, `"OGS"`); distinguishes codes that map to the same `CardSet` (unlike `groupBySet`, which merges `OGN` and `OGS` into `Origins`)
- `countBySetCode(cards)` — count variant of `groupBySetCode`

### Fixes

- Fixed `scripts/generate-cards.ts` example cards to accurately reflect the real data model: Units now have `energy` set (not just `cost`), Spells/Gear use `might` as play cost (no `energy`), Runes have empty `text`/`abilities` and `cost: 0`, `abilities` is always at most 1 element, and `keywords` contains Riftbound region/champion tags rather than game-agnostic strings. Also added inline doc comments explaining the per-type field conventions.

---

## 1.1.7

### Data

- Removed deprecated `ability` field from all 930 affected cards in `cards.json`. `import-csv.ts` and `fetch-cards.ts` no longer emit it. Use `text` or `abilities[0]` — both remain present and contain the same value. `fetch-cards.ts` still reads a remote source's `ability` field as a fallback to populate `text`/`abilities` when those aren't present.

### Documentation

- `DomainFilterMode` type (`"any" | "all"`) is now documented in `api-reference.md` — it was exported but missing from the reference.
- Updated README to include `getUniqueDomains`, `getUniqueTypes`, `getUniqueRarities`, `getUniqueSetCodes` in the Unique values section (added in 1.1.6 but omitted from the README update).
- Updated `CLAUDE.md`, `data-model.md`, and `data-pipeline.md` to reflect that `ability` is no longer emitted by the import scripts and `power` is deprecated.

---

## 1.1.6

### New utilities

- `filterBySetCodes(cards, setCodes)` — multi-code variant of `filterBySetCode`; OR filter on raw set code strings, works even for codes not yet in the `CardSet` union
- `getUniqueDomains(cards)` — sorted distinct `CardDomain` values present in the given cards; multi-domain cards contribute each domain independently
- `getUniqueTypes(cards)` — sorted distinct `CardType` values present in the given cards
- `getUniqueRarities(cards)` — sorted distinct `CardRarity` values (alphabetical); use `rarityOrder` if you need tier order
- `getUniqueSetCodes(cards)` — sorted distinct `setCode` strings; works with raw codes, no `CardSet` knowledge required

### Improvements

- **Sort tie-breaking**: `sortByCost`, `sortByMight`, `sortByRarity`, and `sortByEnergy` now break ties alphabetically by `name`, making output deterministic when the primary sort key is equal
- **`power` deprecated** on `CardBase` — 0 cards in the dataset have a `power` value; marked `@deprecated` in JSDoc and in `data-model.md`

---

## 1.1.5

### New utilities

- `getUniqueNames(cards)` — sorted list of every distinct card name in the collection; deduplicated so Showcase reprints don't produce duplicate entries. Useful for autocomplete vocabularies.

### Documentation

- Rewrote `README.md` — the previous README showed only ~12 of the 40+ exported functions. The new version documents the full API by category: filter (by type, domain, rarity, set, stat range, rules keywords, name), sort, group/count, unique-value helpers, sampling, validation, and types. Includes key model facts (energy is Unit-only, cost is derived, keywords vs. rules keywords distinction).
- Added `getUniqueNames` entry to `api-reference.md`.

### Package

- Added `engines: { "node": ">=14.0.0" }` to `package.json` — the compiled output targets ES2020/CommonJS, which requires Node.js 14+.

---

## 1.1.4

### New utilities

- `filterByNameContains(cards, query)` — case-insensitive substring match on `name` only; fills the gap between the exact-match `getCardsByName` and the full-haystack `searchCards`; useful for typeahead/autocomplete
- `sampleCards(cards, n)` — Fisher-Yates random sample of `n` cards; useful for random-card-of-the-day, booster pack simulation, or generating random test fixtures

### Fixes

- `package.json` version bumped from `1.1.0` to `1.1.4` — it had not been updated across three prior CHANGELOG releases

### Documentation

- Fixed stale note in `game-background.md` that said `"Ultimate"` rarity was not yet in the `CardRarity` type — it was added in a prior session
- Updated `architecture.md` repo layout to include `validate.test.ts` and `CLAUDE.md`; rewrote the Testing section to describe all three test files and their distinct roles

---

## 1.1.3

### New utilities

- `filterByText(cards, query)` — case-insensitive substring search within the `text` field only; distinct from `searchCards` which searches across name, domain, abilities, and keywords as well
- `sortByEnergy(cards, direction?)` — sort by `energy` field, treating cards with no energy as 0; use after `filterByType(cards, "Unit")` for a pure Unit cost curve

### Documentation fixes

- Corrected `data-model.md` field descriptions for `energy` and `might` — the previous docs incorrectly stated that Spells and Gear have `energy`. Data shows only Units (491/491) carry `energy`; for Spells/Gear, `might` is their play cost. Added a per-type field table documenting the actual breakdown.
- Updated `CLAUDE.md` to reflect the corrected energy/might model.

### Tests

- Added 7 per-type field relationship tests to `data-integrity.test.ts`:
  - All Units have `energy` set
  - No Spells, Gears, Runes, Battlefields, or Legends have `energy` set
  - Runes, Battlefields, and Legends always have `cost: 0`
  - For Units, `cost` equals `energy`
  - No card has a `tags` field (deprecated field fully stripped from `cards.json`)

---

## 1.1.2

### New utilities

- `filterByEnergyRange(cards, min, max)` — filters by the `energy` field specifically, excluding cards with no energy cost (Legends, Battlefields, Runes). Meaningfully different from `filterByCostRange`, which uses the derived `cost` field and includes those types at `cost: 0`.
- `filterByRulesKeywords(cards, keywords[])` — multi-keyword OR rules filter; each keyword is a case-insensitive partial match, consistent with `filterByRulesKeyword`
- `getUniqueKeywords(cards)` — sorted list of every distinct region/champion tag across the given cards; useful for building filter dropdowns
- `getUniqueRulesKeywords(cards)` — sorted list of every distinct rules keyword found in `text` fields
- `countByType(cards)` — aggregate card count per `CardType`
- `countByDomain(cards)` — aggregate card count per `CardDomain`; multi-domain cards counted once per domain
- `countByRarity(cards)` — aggregate card count per `CardRarity`
- `countBySet(cards)` — aggregate card count per `CardSet`; cards with no `set` counted under `"__unknown__"`

---

## 1.1.1

### New utilities

- `filterByKeywords(cards, keywords[])` — multi-keyword OR filter against the `keywords` tag array; completes the pattern set by `filterByRarities`/`filterByTypes`/`filterBySets`
- `groupByRarity(cards)` — groups cards into `Partial<Record<CardRarity, Card[]>>`
- `groupBySet(cards)` — groups cards into `Partial<Record<CardSet | "__unknown__", Card[]>>`; cards with an unrecognized `set` fall under `"__unknown__"`

### Data

- Regenerated `src/data/cards.json` via `import:cards` to remove the deprecated `tags` field that was still present on 657 of 950 cards from a previous import run. All 950 cards are intact; only the stale `tags` key is gone.

### Documentation

- Added note to `data-model.md` explaining the 20 cards with empty `text` — they are legitimate (6 basic Rune types × 2 printings + 8 generated token units) and not a data error
- Added `groupByRarity`, `groupBySet`, and `filterByKeywords` to `api-reference.md`

---

## 1.1.0

### New utilities

- `filterByDomains(cards, domains, mode)` — filter by multiple domains at once; `mode: "all"` requires a card to belong to every listed domain (AND), `mode: "any"` requires at least one (OR)
- `filterByCollectible(cards, collectible?)` — filter by collectible flag; cards with `collectible: undefined` are treated as collectible
- `filterByCostRange(cards, min, max)` — keep cards whose cost falls within `[min, max]` inclusive
- `filterByMightRange(cards, min, max)` — keep cards whose `might` stat falls within `[min, max]`; cards with no `might` value (non-Unit types) are excluded
- `sortByName(cards, direction?)` — alphabetical sort using `localeCompare`
- `getCardsByName(cards, name)` — case-insensitive exact-name lookup; returns all printings (e.g. Common + Showcase)
- `extractRulesKeywords(card)` — parses `[Keyword]` notation out of a card's `text` field, decoding HTML entities; distinct from the `keywords` field which contains region/champion tags
- `filterByRulesKeyword(cards, keyword)` — case-insensitive partial match on extracted rules keywords
- `groupByType(cards)` — groups cards into `Partial<Record<CardType, Card[]>>`
- `groupByDomain(cards)` — groups cards into `Partial<Record<CardDomain, Card[]>>`; multi-domain cards appear in each matching group

### Validation now exported from package

- `validateCard(card)` — runtime type-guard for the `Card` shape, useful for validating externally-fetched card data before passing it to utility functions
- `validDomains`, `validTypes`, `validRarities`, `validSets` — `Set<T>` constants for each enum, exported for use in custom validators and UI filters

### Model changes

- `CardRarity` now includes `"Ultimate"` (introduced in the Unleashed set per game docs)
- `tags` field on `CardBase` is deprecated — it has always been identical to `keywords`; use `keywords` instead. The import script no longer emits `tags`; existing records in `cards.json` will have `tags` removed on the next `import:cards` run
- `ability` field on `CardBase` was already deprecated; noted more clearly in JSDoc

### Bug fixes and code quality

- Fixed variable shadowing in `filterByKeyword` (inner loop variable shadowed the outer `keyword` parameter)
- `searchCards` now explicitly filters `undefined` values (from optional `card.set`) before joining the haystack
- `normalizeType` and `normalizeRarity` in the import script now throw immediately on unrecognized values rather than silently producing a bad cast — errors identify the invalid string
- `validateCard` extracted from per-script duplicates into `src/utils/validate.ts` (single source of truth, also exported from the package)
- `normalizeRemoteCard` in `fetch-cards.ts` now preserves all Card fields (`energy`, `power`, `domain`, `imageUrl`, `ability`) and derives `setCode`/`set` from the `id` prefix using the same map as the CSV importer

### Testing

- Test suite expanded from 5 tests covering 5 functions to 50+ tests covering all 18 utility functions
- Added `test/data-integrity.test.ts` — validates the real `src/data/cards.json` at test time (unique IDs, recognized enum values, setCode/id consistency, required field presence)
- Added `vitest.config.ts` with explicit `include` pattern and `environment: "node"`

### Documentation

- Corrected `data-pipeline.md` which incorrectly stated Card Type was "cast as-is, not validated at parse time"
- Updated `architecture.md` repo layout and module-boundary descriptions to reflect current structure
- Updated `api-reference.md` with all new exports
- Updated `contributing.md` script table and enum-update guidance
- Updated `data-model.md` with correct rarity table, `tags` deprecation note, and rules-keyword distinction

---

## 0.1.3

### Patch Changes

- 6a02606: huge refactor of card models
