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
| `CardSet` | `Origins`, `Spiritforged`, `Unleashed` — **`Vendetta` released 2026-07-31 but its CSV hasn't been imported yet; `Radiance` is still unreleased** (see [game-background.md](./game-background.md)) |

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

i.e. "energy cost if the card has one, otherwise fall back to might, otherwise 0." This exists so `sortByCost` / generic cost-curve UIs have one numeric field to sort on regardless of card type. If you need the *actual* play cost for a specific card type, read `energy` (Units) or `might` (Spells/Gear) directly, not `cost`.

The per-type field picture from the real dataset:

| Type | `energy` | `might` | Notes |
| --- | --- | --- | --- |
| Unit | always set (491/491) | set on ~53% (259/491) | `energy` = play cost; `might` = separate combat stat |
| Spell | never set (0/192) | set on ~58% (112/192) | `might` = play cost for costed spells; free spells omit it |
| Gear | never set (0/99) | set on ~32% (32/99) | `might` = play cost for costed gear |
| Rune | never set | never set | always free (cost: 0) |
| Battlefield | never set | never set | always free (cost: 0) |
| Legend | never set | never set | always free (cost: 0) |

Key takeaways:
- **`energy` is Unit-only** in the current dataset. Do not expect Spells or Gears to have it.
- **`might` plays double duty**: for Units it is a combat stat *independent* of `energy`; for Spells/Gears it is the play cost. Use `filterByEnergyRange` or `filterByMightRange` rather than `filterByCostRange` when you care about this distinction.
- **`power`** — **deprecated**: defined in the schema but unused. 0 cards in the dataset have a `power` value. Do not read or filter on this field in new code.

### `ability` vs `abilities` vs `text`

`ability` is **deprecated** and no longer emitted by the import or fetch scripts — 0 cards in `cards.json` have this field. Use `text` or `abilities[0]` instead.

`abilities` and `text` both come from the single `Ability` column in the source CSV:

```ts
text,
abilities: text ? [text] : [],
```

`abilities` is an array because the model anticipates cards with multiple discrete ability lines, but the current importer only ever produces zero or one element. Prefer `text` for display and `searchCards` (which includes `abilities` in its search haystack) for search; don't assume `abilities` will always be length ≤ 1 going forward.

**20 cards in the current dataset have an empty `text` field.** This is expected, not a data error — they are cards that legitimately have no ability text:

- The 6 basic Rune cards (`Fury Rune`, `Calm Rune`, etc.), each in two printings (`ogn-007`/`ogn-007a`, etc.) — 12 cards total.
- A small number of generated/token Unit cards that appear in play but are not standalone cards with text (`Recruit (DE)`, `Recruit (NX)`, `Recruit (ZN)`, `Mountain Drake`, `Mega-Mech`, `Playful Phantom`, `Shipyard Skulker`, `Vanguard Sergeant`) — 8 cards total.

If you use `extractRulesKeywords` on these cards it returns `[]`, which is correct.

### `tags` vs `keywords`

**`tags` is deprecated** — it has always been identical to `keywords` by construction (both come from the same CSV `Tags` column). The import script no longer sets `tags`; existing records in `cards.json` still have it until the next `import:cards` regeneration, but new code should read `keywords` only.

`keywords` contains region/champion tags like `"Dragon"`, `"Noxus"`, `"Ionia"` — not rules keywords like "Flying" or "Rush". Those are embedded in `text` as `[Keyword]` notation and are accessible via `extractRulesKeywords(card)` / `filterByRulesKeyword(cards, kw)`. Don't conflate the two.

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
  "ability": "[Accelerate] (You may pay 1 energy and 1 fury rune as an additional cost to have me enter ready.)",
  "abilities": ["[Accelerate] (You may pay 1 energy and 1 fury rune as an additional cost to have me enter ready.)"],
  "text": "[Accelerate] (You may pay 1 energy and 1 fury rune as an additional cost to have me enter ready.)",
  "imageUrl": "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/....png",
  "setCode": "OGN",
  "set": "Origins",
  "keywords": ["Dragon", "Noxus"]
}
```
