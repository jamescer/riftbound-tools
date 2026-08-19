# API reference

Everything below is re-exported from the package root (`src/index.ts` → `dist/index.js`):

```ts
import { ... } from "riftbound-tools";
```

`src/index.ts` is a barrel:

```ts
export * from "./models/card";
export * from "./data/cards";
export * from "./utils/card-utils";
export * from "./utils/validate";
```

## Types (`src/models/card.ts`)

- `CardDomain`, `CardRarity`, `CardType`, `CardSet` — string-literal unions. See [data-model.md](./data-model.md) for the full list of values and which ones actually appear in data today.
- `CardBase` — the shared field shape.
- `UnitCard`, `SpellCard`, `GearCard`, `RuneCard`, `BattlefieldCard`, `LegendCard` — `CardBase` narrowed by `type`.
- `Card` — the union of all six; this is the type you'll use in almost all consuming code.

### `DomainFilterMode`

```ts
type DomainFilterMode = "any" | "all";
```

Exported from `src/utils/card-utils.ts` for use when calling `filterByDomains`. `"any"` = OR (card belongs to at least one of the given domains); `"all"` = AND (card belongs to every listed domain).

### `CardFilter`

```ts
type CardFilter = (cards: Card[]) => Card[];
```

Type alias for a function that takes a `Card[]` and returns a `Card[]`. Used as the unit of composition for `composeFilters`; export it in your own code for typed filter pipelines.

### `CardPage`

```ts
interface CardPage {
  items: Card[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

Return type of `paginateCards`. `page` and `pageSize` echo the inputs. `totalPages` is `Math.ceil(total / pageSize)`, or `0` when `total` is `0`.

### `CardFieldStats`

```ts
interface CardFieldStats {
  min: number;
  max: number;
  avg: number;
  count: number;
}
```

Aggregate statistics for one numeric field. `count` is the number of cards that actually have the field defined (not the total number of cards passed). Used as a component of `CardStats`.

### `CardStats`

```ts
interface CardStats {
  total: number;
  cost: CardFieldStats;
  energy: CardFieldStats;
  might: CardFieldStats;
}
```

Return type of `getCardStats`. `total` is the count of cards in the input. `cost` covers all cards (the derived field is always present). `energy` and `might` cover only cards where those fields are defined, so their `count` values will differ from `total` when the input is a mixed-type array.

## Data (`src/data/cards.ts`)

### `cards: Card[]`

The full static dataset (950 cards as of this writing), typed and ready to use. Backed by `src/data/cards.json`, which is generated — see [data-pipeline.md](./data-pipeline.md). Don't mutate this array in place; treat it as read-only and copy before sorting/reordering (the utility functions below already do this for you).

```ts
import { cards } from "riftbound-tools";

console.log(cards.length); // 950
```

### `setCodeMap: Record<string, CardSet>`

Maps lowercase set code prefixes to their `CardSet` name (e.g. `"ogn" → "Origins"`, `"sfd" → "Spiritforged"`). Exported for consumers who need to resolve a raw set code from an external source. This is the single source of truth used by the data-import scripts.

```ts
import { setCodeMap } from "riftbound-tools";
setCodeMap["sfd"]; // "Spiritforged"
setCodeMap["ogn"]; // "Origins"
```

## Utilities (`src/utils/card-utils.ts`)

All functions are pure — they take a `Card[]` (typically `cards` itself, or a previously filtered subset) and return a new array or object. None of them mutate their input.

### `filterByDomain(cards, domain: CardDomain): Card[]`

Keeps cards whose `domain` array includes the given domain. Cards with no `domain` at all are excluded.

```ts
filterByDomain(cards, "Fury");
```

### `filterByRarity(cards, rarity: CardRarity): Card[]`

Exact match on `rarity`.

### `filterByType(cards, type: CardType): Card[]`

Exact match on `type`.

### `filterBySet(cards, set: CardSet): Card[]`

Exact match on `set`. Remember `set` can be `undefined` for cards whose `setCode` prefix isn't in the known map (see [data-model.md](./data-model.md#id--setcode--set)) — those cards won't match any `filterBySet` call.

### `filterBySetCode(cards, setCode: string): Card[]`

Exact match on `setCode` (e.g. `"OGN"`). Prefer this over `filterBySet` if you're working from a raw set-code string (e.g. a URL param) rather than a validated `CardSet`.

### `filterBySetCodes(cards, setCodes: string[]): Card[]`

Filter cards whose `setCode` is in the provided list (OR). Case-sensitive — set codes in the data are always uppercase. Unlike `filterBySets`, this works even when a set code isn't in the known `CardSet` map. An empty array returns the input unchanged.

```ts
filterBySetCodes(cards, ["OGN", "SFD"]); // Origins + Spiritforged
```

### `filterByKeyword(cards, keyword: string): Card[]`

Case-insensitive, trims whitespace, matches if `keyword` exactly equals any entry in the card's `keywords` array (not a substring match). See the caveat in [data-model.md](./data-model.md#tags-vs-keywords) about what `keywords` actually contains in the real dataset.

### `filterByKeywords(cards, keywords: string[]): Card[]`

Filter cards whose `keywords` array contains at least one of the given values (OR). Case-insensitive exact match per keyword. An empty `keywords` array returns the input unchanged.

```ts
// Cards tagged with any of these regions
filterByKeywords(cards, ["Ionia", "Noxus", "Demacia"]);
```

### `filterByRarities(cards, rarities: CardRarity[]): Card[]`

Filter cards whose rarity is in the provided list (OR). An empty `rarities` array returns the input unchanged.

```ts
filterByRarities(cards, ["Common", "Uncommon"]); // common + uncommon cards only
filterByRarities(cards, ["Showcase", "Ultimate"]); // premium printings
```

### `filterByTypes(cards, types: CardType[]): Card[]`

Filter cards whose type is in the provided list (OR). An empty `types` array returns the input unchanged.

```ts
filterByTypes(cards, ["Unit", "Spell"]); // all non-permanent cards
```

### `filterBySets(cards, sets: CardSet[]): Card[]`

Filter cards from any of the given sets (OR). Cards where `set` is `undefined` are always excluded. An empty `sets` array returns the input unchanged.

```ts
filterBySets(cards, ["Origins", "Spiritforged"]); // launched sets only
```

### `filterByDomains(cards, domains: CardDomain[], mode?: DomainFilterMode): Card[]`

Filter by multiple domains at once. `mode` controls the logic:

- `"any"` (default) — card must belong to at least one of the given domains (OR). Equivalent to calling `filterByDomain` once for each and merging, but without duplicates.
- `"all"` — card must belong to every given domain (AND). Useful when building a deck that requires dual-domain cards.

An empty `domains` array returns the input unchanged.

```ts
// Cards that are Fury OR Mind
filterByDomains(cards, ["Fury", "Mind"]);

// Cards that are BOTH Fury AND Calm (dual-domain cards only)
filterByDomains(cards, ["Fury", "Calm"], "all");
```

### `filterByCollectible(cards, collectible?: boolean): Card[]`

Keeps cards whose `collectible` field matches the given value. Defaults to `true` (return only collectible cards). Cards where `collectible` is `undefined` are treated as collectible.

```ts
filterByCollectible(cards);        // collectible only
filterByCollectible(cards, false); // non-collectible only
```

### `filterByCostRange(cards, min: number, max: number): Card[]`

Keeps cards whose `cost` is within `[min, max]` inclusive.

```ts
filterByCostRange(cards, 1, 3); // cheap early-game cards
```

### `filterByMightRange(cards, min: number, max: number): Card[]`

Keeps cards whose `might` stat is within `[min, max]` inclusive. Cards with no `might` value (non-Unit types) are always excluded, making this useful for filtering combat-relevant units specifically.

```ts
filterByMightRange(cards, 4, 10); // high-attack units
```

### `filterByEnergyExists(cards): Card[]`

Keeps cards that have an `energy` value defined. In the current dataset this is equivalent to `filterByType(cards, "Unit")`, but is more semantically precise when you care about the field rather than the type.

### `filterByMightExists(cards): Card[]`

Keeps cards that have a `might` value defined. This includes Units (where `might` is a combat stat) and costed Spells/Gear (where `might` doubles as play cost). More ergonomic than `filterByMightRange(cards, 0, Infinity)`.

### `filterByImageUrl(cards, hasImage?: boolean): Card[]`

Keeps cards that have (or lack) an `imageUrl`. Defaults to `true` (keep only cards with art). Pass `false` to find cards missing art — useful for auditing incomplete data imports or spotting cards the API didn't return art for.

```ts
filterByImageUrl(cards);        // cards that have art
filterByImageUrl(cards, false); // cards missing art
```

### `filterByEnergyRange(cards, min: number, max: number): Card[]`

Keeps cards whose `energy` cost is within `[min, max]` inclusive. Cards with no `energy` value (Legends, Battlefields, Runes, and other cost-zero types) are always excluded — distinct from `filterByCostRange`, which uses the derived `cost` field and includes those types at `cost: 0`.

```ts
// Cheap-to-play spells and units only (excludes free Legends/Battlefields)
filterByEnergyRange(filterByType(cards, "Unit"), 1, 3);
```

### `composeFilters(...filters: CardFilter[]): CardFilter`

Composes multiple filter functions into a single reusable `CardFilter`. Filters are applied left-to-right; each receives the output of the previous. An empty argument list returns an identity filter (returns the input unchanged). The `CardFilter` type alias (`(cards: Card[]) => Card[]`) is also exported for use in your own typed pipelines.

```ts
import { composeFilters, filterByType, filterByDomain, filterByCostRange } from "riftbound-tools";

const aggroUnits = composeFilters(
  (c) => filterByType(c, "Unit"),
  (c) => filterByDomain(c, "Fury"),
  (c) => filterByCostRange(c, 1, 3),
);

aggroUnits(cards); // same result as the equivalent nested call, but reusable
aggroUnits(someSubset); // apply the same filter to any card array
```

### `sortByCost(cards, direction: "asc" | "desc" = "asc"): Card[]`

Sorts by the derived `cost` field (see [data-model.md](./data-model.md#cost-vs-energy-vs-might)). Ties broken alphabetically by `name` for deterministic output. Returns a new array; does not mutate the input.

### `sortByEnergy(cards, direction: "asc" | "desc" = "asc"): Card[]`

Sorts by the `energy` field, treating cards with no `energy` as `0`. Since only Units carry `energy`, apply `filterByType(cards, "Unit")` first when you want a pure Unit cost curve. Ties broken alphabetically by `name`.

### `sortByMight(cards, direction: "asc" | "desc" = "desc"): Card[]`

Sorts by `might`, treating missing `might` as `0`. Defaults to descending (biggest stat first), unlike `sortByCost`. Ties broken alphabetically by `name`.

### `sortByName(cards, direction: "asc" | "desc" = "asc"): Card[]`

Alphabetical sort using `localeCompare`. Returns a new array; does not mutate the input.

### `sortByRarity(cards, direction: "asc" | "desc" = "asc"): Card[]`

Sorts by rarity tier using `rarityOrder` (Common=0 → Uncommon=1 → Rare=2 → Epic=3 → Showcase=4 → Ultimate=5). Default `"asc"` puts commons first; `"desc"` puts rarest first. Ties (same rarity) broken alphabetically by `name`. Returns a new array; does not mutate the input.

```ts
sortByRarity(cards);          // Common first
sortByRarity(cards, "desc");  // Ultimate/Showcase first
```

### `rarityOrder: Record<CardRarity, number>`

The tier mapping used by `sortByRarity`. Exported so you can do your own numeric rarity comparisons without reimplementing the ordering.

```ts
import { rarityOrder } from "riftbound-tools";
rarityOrder.Epic; // 3
```

### `sortBySet(cards, direction: "asc" | "desc" = "asc"): Card[]`

Sorts by set in chronological release order (Origins → Spiritforged → Unleashed → Vendetta → Radiance). Default `"asc"` puts the oldest set first; `"desc"` puts the newest first. Cards with an unknown `set` sort last regardless of direction. Ties (same set) broken alphabetically by `name`. Returns a new array; does not mutate the input.

```ts
sortBySet(cards);          // Origins first, newest last
sortBySet(cards, "desc");  // Unleashed first, Origins last
```

### `setOrder: Partial<Record<CardSet, number>>`

The chronological release order mapping used by `sortBySet`. `Partial` because future sets not yet in this map will sort last. Exported for your own set-order comparisons.

```ts
import { setOrder } from "riftbound-tools";
setOrder.Origins;      // 0
setOrder.Spiritforged; // 1
setOrder.Unleashed;    // 2
```

### `filterByText(cards, query: string): Card[]`

Case-insensitive substring search within the `text` field only. Unlike `searchCards`, this does not search `name`, `domain`, `abilities`, or `keywords` — useful when you want to match rules text precisely.

```ts
filterByText(cards, "draw 2 cards");   // only cards whose text says "draw 2 cards"
filterByText(cards, "[Accelerate]");   // text contains the Accelerate notation
```

### `searchCards(cards, query: string): Card[]`

Case-insensitive substring search across `name`, `text`, `set`, `setCode`, all entries in `domain`, all `abilities`, and all `keywords`, joined into one haystack per card. An empty/whitespace-only query returns the input unchanged (not an empty array).

```ts
searchCards(cards, "draw"); // matches "Draw 2 cards.", "Card Draw" keyword, etc.
searchCards(cards, "Fury"); // matches domain, name, text, or keyword
```

### `getCardById(cards, id: string): Card | undefined`

Straightforward `Array.find` on `id`. Returns `undefined` if not found — always check before using the result.

### `filterByIds(cards, ids: string[]): Card[]`

Returns all cards whose `id` is in the given list, in the order they appear in `cards` (not the order of `ids`). Uses a `Set` internally for O(n) lookup. Useful for hydrating a saved deck or wishlisted set of card IDs back into typed `Card` objects.

```ts
const deck = filterByIds(cards, ["ogn-001", "ogn-007", "sfd-042"]);
```

### `getCardsByName(cards, name: string): Card[]`

Returns all cards whose `name` exactly matches the query (case-insensitive). Returns multiple results when a card has several printings — for example, Showcase reprints share a name with the original but have different `id`s and `rarity` values.

```ts
getCardsByName(cards, "Fury Rune");
// → [{ rarity: "Common", ... }, { rarity: "Showcase", ... }]
```

### `getCardReprintings(cards, cardOrId: Card | string): Card[]`

Returns all other printings of a card — cards that share the same `name` but have a different `id`. Accepts either a `Card` object or a raw id string. Returns `[]` if the card has no alternate printings (or if the id isn't found in `cards`). Useful for card-detail UIs that want to show alternate art/rarity versions.

```ts
getCardReprintings(cards, "ogn-007");
// → [{ id: "ogn-007a", rarity: "Showcase", name: "Fury Rune", ... }]

getCardReprintings(cards, getCardById(cards, "ogn-007")!);
// same result
```

### `filterByNameContains(cards, query: string): Card[]`

Case-insensitive substring match on the `name` field only. Fills the gap between `getCardsByName` (exact match) and `searchCards` (full haystack). Useful for typeahead/autocomplete where you want name-based partial matches without false positives from card text. An empty/whitespace-only query returns the input unchanged.

```ts
filterByNameContains(cards, "Drake");   // cards whose name contains "Drake"
filterByNameContains(cards, "Runeterra"); // partial name match
```

### `sampleCards(cards, n: number): Card[]`

Returns a random sample of `n` cards using a Fisher-Yates shuffle. If `n ≥ cards.length`, all cards are returned in shuffled order. The original array is not mutated.

```ts
sampleCards(cards, 1);  // random card of the day
sampleCards(cards, 8);  // simulate an 8-card booster draw
```

### `paginateCards(cards, page: number, pageSize: number): CardPage`

Returns a single page of cards from an already-sorted/filtered array. `page` is zero-indexed. `pageSize` must be ≥ 1 (values below 1 are clamped to 1). Sort and filter the array *before* paginating — this function only slices. `CardPage` (also exported) contains `items`, `total`, `page`, `pageSize`, and `totalPages`.

```ts
const result = paginateCards(sortByCost(filterByType(cards, "Unit")), 0, 20);
result.items;       // first 20 Units sorted by cost
result.totalPages;  // Math.ceil(491 / 20) = 25
result.total;       // 491
```

### `extractRulesKeywords(card: Card): string[]`

Parses rules keywords out of a card's `text` field. Rules keywords in Riftbound are wrapped in square brackets — `[Accelerate]`, `[Deflect]`, `[Reaction]`, etc. HTML entities in the bracket content are decoded (`&gt;` → `>`).

This is distinct from the `keywords` field on `Card`, which contains region/champion tags like `"Ionia"` or `"Dragon"` (see [data-model.md](./data-model.md#tags-vs-keywords)).

```ts
extractRulesKeywords(card);
// e.g. ["Reaction", ">", "Deflect"]
```

### `filterByRulesKeyword(cards, keyword: string): Card[]`

Filters cards that contain a given rules keyword in their `text` field. Case-insensitive, partial match — so `"Assault"` matches both `[Assault]` and `[Assault 2]`.

```ts
filterByRulesKeyword(cards, "Accelerate"); // cards with the Accelerate keyword
filterByRulesKeyword(cards, "Assault");    // also matches [Assault 2], [Assault 3], etc.
```

### `filterByRulesKeywords(cards, keywords: string[]): Card[]`

Filter cards containing at least one of the given rules keywords (OR). Each keyword is a case-insensitive partial match, consistent with `filterByRulesKeyword`. An empty `keywords` array returns the input unchanged.

```ts
filterByRulesKeywords(cards, ["Reaction", "Action"]); // either action type
```

### `getUniqueNames(cards): string[]`

Returns a sorted list of every distinct card name in the collection. Useful for building a name-based autocomplete vocabulary; deduplicated so Showcase reprints don't produce duplicate entries.

```ts
getUniqueNames(cards);
// → ["Abyssal Flamewing", "Arcane Resonance", "Blazing Scorcher", ...]
```

### `getUniqueDomains(cards): CardDomain[]`

Returns a sorted list of every distinct `CardDomain` present in the given cards. Multi-domain cards contribute each of their domains independently. Useful for building domain filter dropdowns from a live filtered subset.

```ts
getUniqueDomains(filterByType(cards, "Unit"));
// → ["Body", "Calm", "Chaos", "Colorless", "Fury", "Mind", "Order"]
```

### `getUniqueTypes(cards): CardType[]`

Returns a sorted list of every distinct `CardType` present in the given cards.

```ts
getUniqueTypes(cards); // → ["Battlefield", "Gear", "Legend", "Rune", "Spell", "Unit"]
```

### `getUniqueRarities(cards): CardRarity[]`

Returns a sorted list (alphabetical) of every distinct `CardRarity` present in the given cards. Use `rarityOrder` if you need tier order rather than alphabetical.

```ts
getUniqueRarities(cards); // → ["Common", "Epic", "Rare", "Showcase", "Uncommon"]
```

### `getUniqueSetCodes(cards): string[]`

Returns a sorted list of every distinct `setCode` present in the given cards (e.g. `["OGN", "SFD", "UNL"]`). Works with raw set code strings — unlike `filterBySets`, no `CardSet` knowledge required.

```ts
getUniqueSetCodes(cards); // → ["OGN", "OGS", "SFD", "UNL"]
```

### `getUniqueSets(cards): CardSet[]`

Returns a list of every distinct `CardSet` present in the given cards, sorted in chronological release order (Origins → Spiritforged → Unleashed → Vendetta → Radiance). Cards with `set: undefined` are excluded. Unlike `getUniqueSetCodes`, this collapses set codes that share a set (e.g. `"OGN"` and `"OGS"` both resolve to `"Origins"`).

```ts
getUniqueSets(cards); // → ["Origins", "Spiritforged", "Unleashed"]
```

### `getUniqueKeywords(cards): string[]`

Returns a sorted list of every distinct value in the `keywords` (region/champion tag) field across the given cards. Useful for populating a filter dropdown. Returns `[]` if no cards have keywords.

```ts
getUniqueKeywords(cards);
// → ["Bandle City", "Bilgewater", "Demacia", "Dragon", "Freljord", ...]
```

### `getUniqueRulesKeywords(cards): string[]`

Returns a sorted list of every distinct rules keyword found in the `text` fields of the given cards (via `extractRulesKeywords`). Useful for building a rules-keyword filter UI.

```ts
getUniqueRulesKeywords(cards);
// → [">", "Accelerate", "Action", "Ambush", "Assault", "Deathknell", ...]
```

### `groupByType(cards): Partial<Record<CardType, Card[]>>`

Returns an object keyed by `CardType`, where each value is the array of cards with that type. Types not present in the input are omitted (not present as empty arrays).

```ts
const groups = groupByType(cards);
groups.Unit;  // Card[]
groups.Gear;  // Card[] | undefined
```

### `groupByDomain(cards): Partial<Record<CardDomain, Card[]>>`

Returns an object keyed by `CardDomain`. Multi-domain cards appear in every domain group they belong to.

```ts
const groups = groupByDomain(cards);
groups.Fury; // all Fury-domain cards
```

### `groupByRarity(cards): Partial<Record<CardRarity, Card[]>>`

Returns an object keyed by `CardRarity`. Rarities not represented in the input are omitted rather than present as empty arrays.

```ts
const groups = groupByRarity(cards);
groups.Showcase; // all Showcase-rarity cards
```

### `groupBySet(cards): Partial<Record<CardSet | "__unknown__", Card[]>>`

Returns an object keyed by `CardSet`. Cards where `set` is `undefined` (unknown set code) are collected under the string key `"__unknown__"`.

```ts
const groups = groupBySet(cards);
groups.Origins?.length; // count of Origins cards
groups.__unknown__;     // cards whose set couldn't be determined
```

### `groupBySetCode(cards): Record<string, Card[]>`

Returns an object keyed by raw `setCode` string. Unlike `groupBySet`, this distinguishes set codes that map to the same `CardSet` — `"OGN"` and `"OGS"` both resolve to `Origins` in `groupBySet`, but get separate groups here.

```ts
const groups = groupBySetCode(cards);
groups.OGN; // core Origins cards
groups.OGS; // Origins store/promo variant cards
```

### `groupByCost(cards): Record<number, Card[]>`

Groups cards by their derived `cost` value. Keys are cost integers; cost values not present in the input are omitted. Use `countByCost` when you only need the counts.

```ts
const curve = groupByCost(filterByType(cards, "Unit"));
curve[2]; // all 2-cost Units
```

### `countByCost(cards): Record<number, number>`

The mana curve — counts how many cards exist at each cost value. Follows the same pattern as `countByType`/`countByRarity`/etc., but keyed by a number rather than an enum string. Use this to power cost-distribution charts.

```ts
countByCost(filterByType(cards, "Unit"));
// → { 0: 12, 1: 43, 2: 87, 3: 95, 4: 110, 5: 79, ... }
```

### `countByType(cards): Partial<Record<CardType, number>>`
### `countByDomain(cards): Partial<Record<CardDomain, number>>`
### `countByRarity(cards): Partial<Record<CardRarity, number>>`
### `countBySet(cards): Partial<Record<CardSet | "__unknown__", number>>`
### `countBySetCode(cards): Record<string, number>`

Aggregate count variants of the `groupBy*` functions — same grouping logic, but the values are counts rather than arrays. Multi-domain cards are counted once per domain in `countByDomain`. `countBySet` uses `"__unknown__"` for cards with no `set`. `countBySetCode` groups by raw set code string, distinguishing e.g. `"OGN"` from `"OGS"`.

```ts
countByType(cards);
// → { Unit: 403, Spell: 187, Gear: 143, Rune: 12, Battlefield: 56, Legend: 100 }

countByRarity(cards);
// → { Common: 220, Uncommon: 213, Rare: 212, Epic: 124, Showcase: 181 }
```

### `sumCost(cards: Card[]): number`

Returns the total cost across all cards (sum of `card.cost`). Useful for computing deck mana value or the average cost of a filtered subset.

```ts
sumCost(myDeck);                    // total mana value
sumCost(myDeck) / myDeck.length;   // same as getCardStats(myDeck).cost.avg
```

### `getCardStats(cards: Card[]): CardStats`

Returns aggregate statistics over a card array — useful for mana-curve analysis, deck analytics, or stat summaries without reimplementing the aggregation yourself. Returns a `CardStats` object with `total` plus `CardFieldStats` (`min`, `max`, `avg`, `count`) for the `cost`, `energy`, and `might` fields. When the input is empty, all stats return `0`.

`energy` and `might` stats include only cards where those fields are defined, so `energy.count` and `might.count` will differ from `total` in a mixed-type array (e.g. 491 out of 950 cards have `energy`).

```ts
import { getCardStats, filterByType } from "riftbound-tools";

const stats = getCardStats(cards);
stats.total;       // 950
stats.cost.avg;    // average cost across all cards
stats.energy.avg;  // average energy among the 491 Units
stats.might.max;   // highest might on any card

// Mana curve for a filtered subset
const unitStats = getCardStats(filterByType(cards, "Unit"));
unitStats.energy.min; // 0 (cheapest Unit)
unitStats.energy.max; // highest-cost Unit
unitStats.energy.avg; // average Unit play cost
```

## Validation (`src/utils/validate.ts`)

### `validateCard(card: unknown): card is Card`

Runtime type-guard that returns `true` if `card` satisfies the `Card` shape: required fields present, correct types, and recognized enum values for `type`, `rarity`, `set`, and `domain`. Useful when consuming card data from an external source before passing it to this package's utilities.

```ts
import { validateCard } from "riftbound-tools";

const raw: unknown = await fetchSomeCardData();
if (validateCard(raw)) {
  // raw is now typed as Card
}
```

### `validDomains`, `validTypes`, `validRarities`, `validSets`

`Set<T>` constants for the recognized values of each enum. Useful for building your own validators or UI filters.

```ts
import { validDomains } from "riftbound-tools";
// Set<CardDomain> { "Fury", "Calm", "Mind", "Body", "Chaos", "Order", "Colorless" }
```

## Typical usage patterns

**Inline nesting** — straightforward for one-off queries:

```ts
import { cards, filterByType, filterByDomain, filterByCostRange, sortByCost } from "riftbound-tools";

const aggro = sortByCost(
  filterByCostRange(filterByDomain(filterByType(cards, "Unit"), "Fury"), 1, 4)
);
```

**`composeFilters`** — builds a reusable filter pipeline; cleaner when the same combination is applied in multiple places:

```ts
import { cards, composeFilters, filterByType, filterByDomain, filterByCostRange, sortByCost } from "riftbound-tools";

const aggroFilter = composeFilters(
  (c) => filterByType(c, "Unit"),
  (c) => filterByDomain(c, "Fury"),
  (c) => filterByCostRange(c, 1, 4),
);

const aggro = sortByCost(aggroFilter(cards));
aggroFilter(someOtherSubset); // reuse the same filter elsewhere
```

Both patterns produce identical results; choose whichever reads more clearly for your use case.
