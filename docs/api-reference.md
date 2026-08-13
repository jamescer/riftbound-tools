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

## Data (`src/data/cards.ts`)

### `cards: Card[]`

The full static dataset (950 cards as of this writing), typed and ready to use. Backed by `src/data/cards.json`, which is generated — see [data-pipeline.md](./data-pipeline.md). Don't mutate this array in place; treat it as read-only and copy before sorting/reordering (the utility functions below already do this for you).

```ts
import { cards } from "riftbound-tools";

console.log(cards.length); // 950
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

### `filterByKeyword(cards, keyword: string): Card[]`

Case-insensitive, trims whitespace, matches if `keyword` exactly equals any entry in the card's `keywords` array (not a substring match). See the caveat in [data-model.md](./data-model.md#tags-vs-keywords) about what `keywords` actually contains in the real dataset.

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

### `sortByCost(cards, direction: "asc" | "desc" = "asc"): Card[]`

Sorts by the derived `cost` field (see [data-model.md](./data-model.md#cost-vs-energy-vs-might)). Returns a new array; does not mutate the input.

### `sortByMight(cards, direction: "asc" | "desc" = "desc"): Card[]`

Sorts by `might`, treating missing `might` as `0`. Defaults to descending (biggest stat first), unlike `sortByCost`.

### `sortByName(cards, direction: "asc" | "desc" = "asc"): Card[]`

Alphabetical sort using `localeCompare`. Returns a new array; does not mutate the input.

### `searchCards(cards, query: string): Card[]`

Case-insensitive substring search across `name`, `text`, `set`, `setCode`, all entries in `domain`, all `abilities`, and all `keywords`, joined into one haystack per card. An empty/whitespace-only query returns the input unchanged (not an empty array).

```ts
searchCards(cards, "draw"); // matches "Draw 2 cards.", "Card Draw" keyword, etc.
searchCards(cards, "Fury"); // matches domain, name, text, or keyword
```

### `getCardById(cards, id: string): Card | undefined`

Straightforward `Array.find` on `id`. Returns `undefined` if not found — always check before using the result.

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

## Typical usage pattern

```ts
import { cards, filterByType, filterByDomain, filterByCostRange, sortByCost } from "riftbound-tools";

// Cheap Fury Units, sorted by cost
const aggro = sortByCost(
  filterByCostRange(
    filterByDomain(filterByType(cards, "Unit"), "Fury"),
    1, 4
  )
);
```

Functions compose left-to-right by nesting since each takes/returns `Card[]`; there's no built-in chaining/fluent API.
