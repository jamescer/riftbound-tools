# Data model

Source: [`src/models/card.ts`](../src/models/card.ts)

## Enums

```ts
type CardDomain = "Fury" | "Calm" | "Mind" | "Body" | "Chaos" | "Order" | "Colorless";
type CardRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Showcase" | "Ultimate";
type CardType   = "Unit" | "Spell" | "Gear" | "Rune" | "Battlefield" | "Legend";
type CardSet    = "Origins" | "Spiritforged" | "Unleashed" | "Vendetta" | "Radiance";
```

These are hand-maintained to track the real game as closely as possible, but they are **aspirational** — a member existing in the type doesn't mean cards with that value exist in `cards.json` yet. As of the current dataset (950 rows, generated from the source CSV):

| Enum | Values actually present in `cards.json` |
| --- | --- |
| `CardType` | `Unit`, `Spell`, `Rune`, `Gear`, `Legend`, `Battlefield` (all of them) |
| `CardRarity` | `Common`, `Uncommon`, `Rare`, `Epic`, `Showcase` — **`Ultimate` is in the type but not yet in the data** (Unleashed introduces it per game docs, but those cards aren't in the current CSV) |
| `CardDomain` | `Fury`, `Calm`, `Mind`, `Body`, `Chaos`, `Order`, `Colorless` (all of them) |
| `CardSet` | `Origins`, `Spiritforged`, `Unleashed` — **`Vendetta` and `Radiance` are not in the data yet** (unreleased sets; see [game-background.md](./game-background.md)) |

## `CardBase` fields

```ts
interface CardBase {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  energy?: number;
  might?: number;
  power?: number;
  domain?: CardDomain[];
  tags?: string[];
  ability?: string;
  abilities: string[];
  text: string;
  imageUrl?: string;
  set?: CardSet;
  setCode: string;
  keywords?: string[];
  collectible?: boolean;
}
```

`Card` is a discriminated union (`UnitCard | SpellCard | GearCard | RuneCard | BattlefieldCard | LegendCard`) that narrows purely on `type`; every variant has the identical field set today. The union exists so future card-type-specific fields (e.g. something only `Battlefield` cards have) can be added without a breaking change to the others.

### `id` / `setCode` / `set`

- `id` is the card's unique key, formatted `<set-code-lowercase>-<number>`, e.g. `"ogn-001"`.
- `setCode` is the uppercased prefix of `id` (`"OGN"`), derived at import time — not a CSV column.
- `set` is looked up from `setCode` via a fixed map in [`scripts/import-csv.ts`](../scripts/import-csv.ts):

  ```ts
  const setCodeMap: Record<string, CardSet> = {
    ogn: "Origins",
    ogs: "Origins",   // store/promo variant prefix, still maps to the Origins set
    sfd: "Spiritforged",
    unl: "Unleashed",
    vnd: "Vendetta",
    rdn: "Radiance",
  };
  ```

  If a new set code shows up in the CSV that isn't in this map, `set` will be `undefined` for those cards even though `setCode` is populated — that's a signal the map needs a new entry, not a bug in consuming code.

### `cost` vs `energy` vs `might`

**`cost` is not a CSV column.** The import script computes it as:

```ts
cost: parseNumber(energy) ?? parseNumber(might) ?? 0
```

i.e. "energy cost if the card has one, otherwise fall back to might, otherwise 0." This exists so `sortByCost` / generic cost-curve UIs have one numeric field to sort on regardless of card type (a Rune has no energy cost the way a Unit does). If you need the *actual* energy cost specifically, read `energy`, not `cost`.

- `energy` — the card's play cost in energy, when applicable (mostly Units/Spells/Gear).
- `might` — a Unit's combat stat. **Only ~403 of 950 cards (~42%) have a defined `might`** — non-Unit types generally don't.
- `power` — defined in the schema but **currently unused**: 0 cards in the dataset have a `power` value. It's reserved for a stat the CSV doesn't populate yet.

### `ability` vs `abilities` vs `text`

These three fields are currently redundant by construction. The import script does:

```ts
ability: parsedAbility || undefined,
abilities: parsedAbility ? [parsedAbility] : [],
text: parsedAbility || "",
```

All three come from the single `Ability` column in the source CSV. `abilities` is an array because the model anticipates cards with multiple discrete ability lines, but the current importer only ever produces zero or one element. Prefer `text` for display and `abilities`/`searchCards` (which already includes `abilities` in its search haystack) for search; don't assume `abilities` will always be length ≤ 1 going forward.

### `tags` vs `keywords`

Also currently identical by construction — the importer sets `keywords: parsedTags` from the same CSV `Tags` column. In the raw data these are things like champion/region tags (`"Dragon"`, `"Noxus"`), not necessarily rules keywords like "Flying" or "Ward" (those are folded into `ability`/`text` instead, e.g. `"[Accelerate] (...)"`). Don't assume `keywords` means "rules keyword" — check `filterByKeyword`'s actual usage before relying on that assumption in a new feature.

### `domain`

An array, not a single value — cards can span multiple domains (e.g. a card tagged `["Mind", "Calm"]`). `filterByDomain` checks "does this card's domain array include X," so a two-domain card matches both filters.

### `collectible` and `imageUrl`

- `collectible` is defined in the schema (and used by the example/synthetic cards in `generate-cards.ts` and the remote-fetch normalizer in `fetch-cards.ts`) but **the CSV importer never sets it**, so it's `undefined` for all 950 real cards today.
- `imageUrl` **is** populated from the CSV for real cards and points at Riot's CMS asset host (`cmsassets.rgpub.io`).

## Example record (real data)

```json
{
  "id": "ogn-001",
  "name": "Blazing Scorcher",
  "type": "Unit",
  "rarity": "Common",
  "cost": 5,
  "energy": 5,
  "domain": ["Fury"],
  "tags": ["Dragon", "Noxus"],
  "ability": "[Accelerate] (You may pay 1 energy and 1 fury rune as an additional cost to have me enter ready.)",
  "abilities": ["[Accelerate] (You may pay 1 energy and 1 fury rune as an additional cost to have me enter ready.)"],
  "text": "[Accelerate] (You may pay 1 energy and 1 fury rune as an additional cost to have me enter ready.)",
  "imageUrl": "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/....png",
  "setCode": "OGN",
  "set": "Origins",
  "keywords": ["Dragon", "Noxus"]
}
```
