# riftbound-tools

export RIOT_API_KEY=RGAPI-your-new-key
npm run fetch:riot

export RIOT_API_KEY=RGAPI-c33ec1f9-4479-4c37-8a41-a0d2b548417f


TypeScript models, a full card dataset (~950 cards), and filter/sort/search utilities for the Riftbound TCG.

## Install

```bash
npm install riftbound-tools
```

Requires Node.js ≥ 14.

## Quick start

```ts
import { cards, filterByType, filterByDomain, filterByCostRange, sortByCost } from "riftbound-tools";

// Cheap Fury Units, sorted by cost
const aggro = sortByCost(
  filterByCostRange(
    filterByDomain(filterByType(cards, "Unit"), "Fury"),
    1, 3
  )
);
```

All utility functions are pure — they take a `Card[]` and return a new array. Compose them by nesting or with `composeFilters` for reusable pipelines.

## The dataset

```ts
import { cards } from "riftbound-tools";

cards.length; // 950
```

`cards` is a typed `Card[]` backed by a bundled JSON file — no network calls, zero runtime dependencies.

## Filter

### By type, domain, rarity, set

```ts
import {
  filterByType, filterByTypes,
  filterByDomain, filterByDomains,
  filterByRarity, filterByRarities,
  filterBySet, filterBySets, filterBySetCode,
  filterByKeyword, filterByKeywords,
  filterByCollectible,
} from "riftbound-tools";

filterByType(cards, "Unit");
filterByTypes(cards, ["Unit", "Spell"]);

filterByDomain(cards, "Fury");
filterByDomains(cards, ["Fury", "Calm"]);          // OR — either domain
filterByDomains(cards, ["Fury", "Calm"], "all");   // AND — both domains (dual-domain cards only)

filterByRarity(cards, "Epic");
filterByRarities(cards, ["Showcase", "Ultimate"]); // premium printings

filterBySet(cards, "Origins");
filterBySets(cards, ["Origins", "Spiritforged"]);
filterBySetCode(cards, "OGN");

filterByKeyword(cards, "Dragon");                  // exact region/champion tag match
filterByKeywords(cards, ["Ionia", "Noxus"]);       // any of these tags

filterByCollectible(cards);        // collectible only (default)
filterByCollectible(cards, false); // non-collectible only
```

### By stat range

```ts
import { filterByCostRange, filterByMightRange, filterByEnergyRange } from "riftbound-tools";

filterByCostRange(cards, 1, 4);   // cost 1–4 (derived field, works for all card types)
filterByMightRange(cards, 5, 12); // high-attack Units (cards with no might are excluded)
filterByEnergyRange(filterByType(cards, "Unit"), 1, 3); // Unit energy cost 1–3
```

### By rules keywords (text parsing)

Rules keywords live in `text` as `[Bracket]` notation — distinct from region/champion tags in `keywords`.

```ts
import { filterByRulesKeyword, filterByRulesKeywords, filterByText, extractRulesKeywords } from "riftbound-tools";

filterByRulesKeyword(cards, "Accelerate");          // case-insensitive partial match
filterByRulesKeyword(cards, "Assault");             // matches [Assault], [Assault 2], etc.
filterByRulesKeywords(cards, ["Reaction", "Action"]); // either keyword

filterByText(cards, "[Deflect]");                   // raw substring in text field
filterByText(cards, "draw 2");

extractRulesKeywords(card); // → ["Reaction", ">", "Deflect"]
```

### By name or ID

```ts
import { filterByNameContains, getCardById, getCardsByName, filterByIds } from "riftbound-tools";

filterByNameContains(cards, "Drake");           // partial name match (autocomplete)
getCardsByName(cards, "Fury Rune");             // exact name, all printings
// → [{ rarity: "Common", ... }, { rarity: "Showcase", ... }]
getCardById(cards, "ogn-001");                  // single lookup → Card | undefined
filterByIds(cards, ["ogn-001", "sfd-042"]);     // bulk ID lookup → Card[]
```

### Full-text search

```ts
import { searchCards } from "riftbound-tools";

// Searches name, text, set, setCode, domain, abilities, and keywords
searchCards(cards, "draw");
searchCards(cards, "Fury");
```

## Sort

```ts
import { sortByCost, sortByEnergy, sortByMight, sortByName, sortByRarity, sortBySet } from "riftbound-tools";

sortByCost(cards);             // cheapest first (default "asc")
sortByEnergy(cards, "desc");   // most expensive energy cost first
sortByMight(cards);            // highest might first (default "desc")
sortByName(cards);             // A → Z
sortByRarity(cards, "desc");   // rarest first (Ultimate → Common)
sortBySet(cards);              // Origins first → Unleashed last; unknown set sorts last
sortBySet(cards, "desc");      // newest set first
```

## Compose filters

```ts
import { composeFilters, filterByType, filterByDomain, filterByCostRange } from "riftbound-tools";

// Build a reusable filter pipeline instead of deep-nesting function calls
const aggroUnits = composeFilters(
  (c) => filterByType(c, "Unit"),
  (c) => filterByDomain(c, "Fury"),
  (c) => filterByCostRange(c, 1, 3),
);

aggroUnits(cards); // apply to the full dataset
aggroUnits(someSubset); // or any filtered subset
```

## Group and count

```ts
import { groupByType, groupByDomain, groupByRarity, groupBySet, groupBySetCode } from "riftbound-tools";
import { countByType, countByDomain, countByRarity, countBySet, countBySetCode } from "riftbound-tools";

const byType = groupByType(cards);
byType.Unit;   // Card[]
byType.Spell;  // Card[] | undefined

countByRarity(cards);
// → { Common: 220, Uncommon: 213, Rare: 212, Epic: 124, Showcase: 181 }

// groupBySet merges OGN + OGS under "Origins"; groupBySetCode keeps them separate
groupBySet(cards).Origins;        // all Origins cards (OGN + OGS combined)
groupBySetCode(cards).OGN;        // core Origins cards only
groupBySetCode(cards).OGS;        // Origins store/promo variant cards only
```

## Unique values

```ts
import {
  getUniqueNames, getUniqueDomains, getUniqueTypes, getUniqueRarities,
  getUniqueSetCodes, getUniqueKeywords, getUniqueRulesKeywords,
  rarityOrder,
} from "riftbound-tools";

getUniqueNames(cards);         // sorted distinct card names (deduplicates Showcase reprints)
getUniqueDomains(cards);       // → ["Body", "Calm", "Chaos", "Colorless", "Fury", "Mind", "Order"]
getUniqueTypes(cards);         // → ["Battlefield", "Gear", "Legend", "Rune", "Spell", "Unit"]
getUniqueRarities(cards);      // sorted distinct rarities present in the given cards
getUniqueSetCodes(cards);      // → ["OGN", "OGS", "SFD", "UNL"] (raw set code strings)
getUniqueKeywords(cards);      // sorted distinct region/champion tags
getUniqueRulesKeywords(cards); // sorted distinct rules keywords from text fields

rarityOrder.Epic; // 3  (Common=0 → Uncommon=1 → Rare=2 → Epic=3 → Showcase=4 → Ultimate=5)
```

## Sample and paginate

```ts
import { sampleCards, paginateCards } from "riftbound-tools";

sampleCards(cards, 1);  // random card of the day
sampleCards(cards, 8);  // simulate a booster pack draw

// Sort/filter first, then paginate
const page = paginateCards(sortByCost(filterByType(cards, "Unit")), 0, 20);
page.items;       // first 20 Units sorted by cost
page.total;       // 491
page.totalPages;  // 25
```

## Stats

```ts
import { getCardStats, filterByType } from "riftbound-tools";

const stats = getCardStats(cards);
stats.total;       // 950
stats.cost.avg;    // average cost across all card types
stats.energy.avg;  // average energy cost (only counts cards that have energy — i.e. Units)
stats.might.max;   // highest might on any card

// Mana curve for a filtered subset
const unitStats = getCardStats(filterByType(cards, "Unit"));
unitStats.energy.min; // cheapest Unit
unitStats.energy.max; // most expensive Unit
```

## Validation

```ts
import { validateCard, validDomains, validTypes, validRarities, validSets } from "riftbound-tools";

const raw: unknown = await fetchSomeApi();
if (validateCard(raw)) {
  // raw is now typed as Card
}

// Set<T> constants for building your own validators or filter UIs
validDomains; // Set<CardDomain>
validTypes;   // Set<CardType>
```

## Types

```ts
import type { Card, CardBase, UnitCard, SpellCard, GearCard, RuneCard } from "riftbound-tools";
import type { CardDomain, CardRarity, CardType, CardSet } from "riftbound-tools";

// Card is a discriminated union narrowed by `type`
function describeCard(card: Card) {
  if (card.type === "Unit") {
    console.log(card.energy); // number — Unit-only field
  }
}
```

Key model facts:
- `energy` is Unit-only (play cost for Units). For Spells/Gear, `might` is their play cost.
- `cost` is a derived field (`energy ?? might ?? 0`) — use it for cross-type cost comparisons.
- `keywords` holds region/champion tags (`"Ionia"`, `"Dragon"`). Rules keywords (`[Accelerate]`) live in `text`.

## Development

```bash
npm install
npm run import:cards  # regenerate cards.json from the source CSV
npm run build
npm test
```

Full docs — data model, API reference, data pipeline, architecture, and contributing guide — live in [`docs/`](./docs).

## License

MIT
