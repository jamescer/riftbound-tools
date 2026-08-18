# Data pipeline

The card dataset flows through three stages: **source → `src/data/cards.json` → `dist/data/cards.json`**. There are four interchangeable ways to produce `cards.json`, and one script to publish it into `dist`. They are not run automatically as a chain — each is a separate, manually-invoked npm script (or automated via the GitHub Actions workflow described below).

## The scripts

| Script | npm command | Purpose |
| --- | --- | --- |
| [`scripts/fetch-riot-api.ts`](../scripts/fetch-riot-api.ts) | `npm run fetch:riot` | **The canonical sync path.** Hits the official Riot `riftbound-content-v1` API and writes `src/data/cards.json`. Requires `RIOT_API_KEY` env var. See [Riot API sync](#riot-api-sync) below. |
| [`scripts/import-csv.ts`](../scripts/import-csv.ts) | `npm run import:cards` | Parses the maintainer-provided CSV at repo root into `src/data/cards.json`. Useful when you have a fresh export from the card spreadsheet. |
| [`scripts/generate-cards.ts`](../scripts/generate-cards.ts) | `npm run generate:cards` | Writes a small **hardcoded example dataset** (5 flavor cards like "Abyssal Flamewing") to `src/data/cards.json`. Useful for resetting to a known-good sample or for testing the pipeline itself — **do not run this if you want the real dataset**, it will overwrite it. |
| [`scripts/fetch-cards.ts`](../scripts/fetch-cards.ts) | `npm run fetch:cards` | Fetches card JSON from an arbitrary remote URL or local file (`--url=`, `--source=`, or `RIFTBOUND_CARDS_SOURCE_URL` env var). Generic scaffold for any JSON source; prefer `fetch:riot` for the official Riot endpoint. |
| [`scripts/copy-assets.ts`](../scripts/copy-assets.ts) | (runs as part of `npm run build`) | Copies `src/data/cards.json` → `dist/data/cards.json` after `tsc` compiles. Needed because TypeScript's `outDir` compilation doesn't copy non-`.ts` assets on its own. |

All three data-generation scripts share the same shape: parse/normalize input → **validate** every record against the `Card` shape → throw on any invalid record → write the whole array as pretty-printed JSON. None of them do a partial write — it's all-or-nothing.

## Riot API sync

`scripts/fetch-riot-api.ts` calls the `riftbound-content-v1` endpoint:

```
GET https://{region}.api.riotgames.com/riftbound/content/v1/contents
```

The API returns a `RiftboundContentDTO` — a list of sets, each with a list of `CardDTO` objects. The script normalizes `CardDTO` → `Card` and writes `cards.json`. Key field mappings:

| API field | Our model field | Notes |
| --- | --- | --- |
| `id` | `id` | Used as-is; prefix before `-` derives `setCode` |
| `name` | `name` | |
| `description` | `text`, `abilities` | `abilities` is `[description]` when non-empty |
| `type` | `type` | Cast to `CardType`; must be in `validTypes` |
| `rarity` | `rarity` | Cast to `CardRarity`; must be in `validRarities` |
| `faction` | `domain` | Split on comma for dual-domain cards; filtered to `validDomains` |
| `stats.energy` | `energy` | Unit-only in practice |
| `stats.might` | `might` | |
| `stats.cost` | `cost` | Recomputed as `energy ?? might ?? stats.cost ?? 0` |
| `stats.power` | (dropped) | Deprecated in our model |
| `tags` | `keywords` | Region/champion tags — "Ionia", "Dragon", etc. |
| `keywords` | (not stored) | API rules keywords; they already appear in `description` as `[Bracket]` text |
| `art.fullURL` | `imageUrl` | Falls back to `art.thumbnailURL` |
| `set` + `id` prefix | `setCode`, `set` | Resolved via `setCodeMap` |

### Running it locally

```bash
export RIOT_API_KEY=RGAPI-your-key-here
npm run fetch:riot

# optional: pick a regional cluster
npm run fetch:riot -- --region=europe
```

The key is sent as an `X-Riot-Token` header (not a query param) to avoid it appearing in server logs. The response is validated card-by-card using `validateCard`; invalid cards are logged and skipped rather than aborting the whole import, so a single malformed card from the API doesn't block the rest.

**If cards are skipped due to an unrecognized `type` or `rarity`**, that means the API returned a new value that isn't in our TypeScript enums yet. The fix is: add the string to the union in `src/models/card.ts`, add it to the matching `valid*` Set in `src/utils/validate.ts`, then re-run `fetch:riot`.

### Quarterly automated sync (GitHub Actions)

`.github/workflows/sync-cards.yml` runs `npm run fetch:riot` on a quarterly cron schedule (1 Jan, 1 Apr, 1 Jul, 1 Oct at 08:00 UTC). It also has a `workflow_dispatch` trigger so you can kick it off manually from the Actions tab whenever a new set releases.

When `cards.json` changes, the workflow opens a pull request on the `sync/riot-api-cards` branch rather than pushing directly to `main`. This gives you a diff review and a place to verify the data before merging.

**One-time setup in your GitHub repository:**

1. Go to **Settings → Secrets and variables → Actions → New repository secret**.
2. Name: `RIOT_API_KEY` — Value: your Riot API key.
3. That's it. The `GITHUB_TOKEN` (needed for PR creation) is provided automatically by GitHub Actions; no extra setup required.

To regenerate outside the quarterly cadence (e.g. a set releases mid-quarter), use the **Run workflow** button in the Actions tab, or run `npm run fetch:riot` locally and commit the updated `cards.json`.

## `npm run import:cards` in detail

This is the script that matters for real data changes. Source: `Riftbound - All Card Info - All Card Data.csv` at the repo root.

**CSV columns** (header row, some columns are unnamed/unused spacers):

```
ID, Name, , , , , , Energy, Might, Power, Card Type, Rarity, Domain, Tags, Ability, Image URL
```

Column-to-field mapping:

- `ID` → `id` (also derives `setCode` from the prefix before `-`, e.g. `ogn-001` → `OGN`, and `set` via the `setCodeMap` lookup — see [data-model.md](./data-model.md#id--setcode--set))
- `Name` → `name`
- `Energy` → `energy`, and also feeds `cost` (see [data-model.md](./data-model.md#cost-vs-energy-vs-might))
- `Might` → `might`, fallback for `cost` if `Energy` is blank
- `Power` → ignored (field is deprecated; always blank in the current CSV)
- `Card Type` → `type` — validated by `normalizeType()` against `validTypes`; **throws immediately** if the value isn't a recognized `CardType`. This is the earliest validation point, before `validateCard` runs.
- `Rarity` → `rarity` — validated by `normalizeRarity()` against `validRarities`; likewise throws immediately on an unknown value.
- `Domain` → `domain` (comma-split, filtered to only recognized `CardDomain` values — unrecognized values are silently dropped, not errored)
- `Tags` → `keywords` (the `tags` field is deprecated and no longer emitted — see [data-model.md](./data-model.md#tags-vs-keywords))
- `Ability` → `abilities` (single-element array) and `text` (the deprecated `ability` field is no longer emitted)
- `Image URL` → `imageUrl`

The CSV parser (`parseCsvLine`) is a minimal hand-rolled quoted-field parser (handles `"..."` and escaped `""` inside quotes) — it is not a general-purpose CSV library, so if the source CSV format changes (e.g. new columns, different quoting), check this function before assuming the parser will just handle it.

After parsing, `validateCard` (from `src/utils/validate.ts`, shared via `scripts/utils.ts`) checks every row has a non-empty `id`/`name`, a `type` in the known `CardType` set, a `rarity` in the known `CardRarity` set, numeric `cost`, non-empty `setCode`, and correctly-typed optional fields. **A single invalid row throws and aborts the entire import** — nothing is written. The thrown error includes the CSV row number (1-indexed from the header) and the parsed record, which is usually enough to spot the bad cell.

Note that `type` and `rarity` are validated twice: once eagerly by `normalizeType`/`normalizeRarity` during parsing (which gives a clearer error message with the raw string value), and once by `validateCard` afterward (which checks the fully-assembled card). The earlier check is the one you'll normally see in an error if the CSV gains a new type or rarity string.

## Regenerating after a CSV update

```bash
npm run import:cards   # rewrites src/data/cards.json from the CSV
npm run build           # compiles TS + copies cards.json into dist/
npm test                 # sanity check nothing broke
```

`src/data/cards.json` is checked into the repo (not gitignored), so a regeneration shows up as a diff — review it like any other change before committing, since a bad CSV edit or a `setCodeMap` gap will show up as unexpected `undefined`s or wrong `set` values in the diff.

## Why `cards.json` exists as a separate file from `cards.ts`

`src/data/cards.ts` is trivial by design:

```ts
import { Card } from "../models/card";
import cardsJson from "./cards.json";

export const cards: Card[] = cardsJson as unknown as Card[];
```

Keeping the actual data in `.json` (rather than inlining a big TS array literal) means the import/fetch scripts can regenerate it with plain `fs.writeFileSync` + `JSON.stringify`, without needing to emit valid TypeScript syntax, and `tsconfig.json` has `resolveJsonModule: true` specifically to allow this import.
