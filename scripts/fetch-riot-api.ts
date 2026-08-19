/**
 * fetch-riot-api.ts
 *
 * Fetches card data from the official Riot Games Riftbound API
 * (riftbound-content-v1) and regenerates src/data/cards.json.
 *
 * Usage:
 *   npx ts-node ./scripts/fetch-riot-api.ts
 *   npx ts-node ./scripts/fetch-riot-api.ts --region=europe
 *
 * Required env var:
 *   RIOT_API_KEY        — your Riot API key (NEVER commit this value)
 *
 * Optional env vars / flags:
 *   RIOT_API_REGION     — "americas" | "asia" | "europe"  (default: "americas")
 *   --region=<value>    — same as RIOT_API_REGION, flag takes precedence
 *
 * Get an API key at: https://developer.riotgames.com
 */

import fs from "fs";
import path from "path";
import { Card, CardDomain, CardRarity, CardSet, CardType } from "../src/models/card";
import { setCodeMap } from "../src/data/setCodeMap";
import { validateCard, validDomains } from "./utils";

const outputPath = path.resolve(__dirname, "..", "src", "data", "cards.json");

// ─────────────────────────────────────────────────────────────────────────────
// Riot API response types (riftbound-content-v1 GET /riftbound/content/v1/contents)
// ─────────────────────────────────────────────────────────────────────────────

interface CardArtDTO {
  thumbnailURL?: string;
  fullURL?: string;
  artist?: string;
}

interface CardStatsDTO {
  energy?: number;
  might?: number;
  cost?: number;
  /** Returned by the API but deprecated in our model — not stored. */
  power?: number;
}

interface CardDTO {
  id: string;
  collectorNumber?: number;
  /** Set name string, e.g. "Origins" */
  set?: string;
  name: string;
  /** Card rules text / ability text. */
  description?: string;
  type: string;
  rarity: string;
  /**
   * Domain(s) for the card. May be a single domain string or comma-separated
   * when the card belongs to multiple domains.
   */
  faction?: string;
  stats?: CardStatsDTO;
  /**
   * Rules keywords from the API (e.g. "Accelerate", "Deflect").
   * These appear in our model's `text` field as [Bracket] notation —
   * they are NOT stored in the `keywords` field (which holds region/champion tags).
   */
  keywords?: string[];
  art?: CardArtDTO;
  flavorText?: string;
  /**
   * Region/champion tags (e.g. "Ionia", "Dragon").
   * These map to the `keywords` field in our Card model.
   */
  tags?: string[];
}

interface SetDTO {
  id: string;
  name: string;
  cards: CardDTO[];
}

interface RiftboundContentDTO {
  game: string;
  version: string;
  lastUpdated: string;
  sets: SetDTO[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Config helpers
// ─────────────────────────────────────────────────────────────────────────────
const default_key = ""

function getApiKey(): string {
  const key = (process.env.RIOT_API_KEY ?? default_key).trim();
  if (!key) {
    throw new Error(
      "RIOT_API_KEY environment variable is not set.\n" +
      "  export RIOT_API_KEY=RGAPI-...\n" +
      "  (never commit your key to the repository)"
    );
  }
  return key;
}

function getRegion(): string {
  const args = process.argv.slice(2);
  const flag = args.find((a) => a.startsWith("--region="));
  if (flag) return flag.split("=", 2)[1].toLowerCase();
  return (process.env.RIOT_API_REGION ?? "americas").toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reverse lookup: CardSet name → uppercase set code (e.g. "Origins" → "OGN").
 * Built once at startup from setCodeMap (the single source of truth).
 */
const setNameToCode: Record<string, string> = Object.fromEntries(
  Object.entries(setCodeMap).map(([code, name]) => [name, code.toUpperCase()])
);

function deriveSetCode(dto: CardDTO, fallbackSetName: string): string {
  // Prefer deriving from the id prefix if it matches a known set code.
  const idPrefix = typeof dto.id === "string" ? dto.id.split("-")[0]?.toUpperCase() : "";
  if (idPrefix && setCodeMap[idPrefix.toLowerCase()]) return idPrefix;

  // Fall back to resolving the set name from the DTO or the parent SetDTO.
  const setName = (typeof dto.set === "string" && dto.set.trim())
    ? dto.set.trim()
    : fallbackSetName.trim();
  return setNameToCode[setName] ?? idPrefix ?? "";
}

/**
 * The API's `faction` field represents domain(s).
 * May be a single string ("Fury") or comma-separated ("Fury,Calm").
 */
function normalizeDomain(faction: unknown): CardDomain[] | undefined {
  if (!faction) return undefined;
  const raw = typeof faction === "string" ? faction : String(faction);
  const parts = raw
    .split(",")
    .map((d) => d.trim())
    .filter((d): d is CardDomain => validDomains.has(d as CardDomain));
  return parts.length > 0 ? parts : undefined;
}

/**
 * The API's `tags` field holds region/champion tags — these are what our model
 * calls `keywords` (e.g. "Ionia", "Dragon").
 */
function normalizeKeywords(tags: unknown): string[] | undefined {
  if (!Array.isArray(tags)) return undefined;
  const result = tags.map(String).filter(Boolean);
  return result.length > 0 ? result : undefined;
}

function toOptionalNumber(value: number | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function normalizeCard(dto: CardDTO, setCode: string): Card {
  const stats = dto.stats ?? {};
  const text = typeof dto.description === "string" ? dto.description : "";
  const abilities: string[] = text ? [text] : [];
  const set = (setCode ? setCodeMap[setCode.toLowerCase()] : undefined) as CardSet | undefined;

  const energy = toOptionalNumber(stats.energy);
  const might = toOptionalNumber(stats.might);
  // `cost` is a derived field in our model: energy ?? might ?? 0.
  // We recompute it here rather than blindly trusting stats.cost, so
  // the data stays consistent with how the rest of the library treats cost.
  const cost = energy ?? might ?? toOptionalNumber(stats.cost) ?? 0;

  return {
    id: String(dto.id ?? ""),
    name: String(dto.name ?? ""),
    type: dto.type as CardType,
    rarity: dto.rarity as CardRarity,
    cost,
    energy,
    might,
    domain: normalizeDomain(dto.faction),
    text,
    abilities,
    imageUrl: dto.art?.fullURL ?? dto.art?.thumbnailURL,
    set,
    setCode,
    keywords: normalizeKeywords(dto.tags),
  } as Card;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  const apiKey = getApiKey();
  const region = getRegion();
  const url = `https://${region}.api.riotgames.com/riftbound/content/v1/contents`;

  console.log(`Fetching Riftbound content from ${url} ...`);

  const response = await fetch(url, {
    headers: {
      // Send key as a header, not a query param, to avoid it appearing in logs.
      "X-Riot-Token": apiKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const hint =
      response.status === 401
        ? "\nHint: 401 = invalid or expired key. Regenerate at https://developer.riotgames.com"
        : response.status === 403
        ? "\nHint: 403 = key not authorized for riftbound-content-v1.\n" +
          "  Development keys do not include Riftbound content access by default.\n" +
          "  You need a production API key approved for Riftbound at:\n" +
          "  https://developer.riotgames.com  (apply under 'Riftbound' → 'riftbound-content-v1')"
        : response.status === 429
        ? "\nHint: 429 = rate limit hit. Wait a moment and retry."
        : "";
    throw new Error(
      `Riot API request failed: ${response.status} ${response.statusText}\n` +
      `URL: ${url}` +
      (body ? `\nBody: ${body.slice(0, 400)}` : "") +
      hint
    );
  }

  const data = (await response.json()) as RiftboundContentDTO;

  console.log(
    `Game: ${data.game}  |  version: ${data.version}  |  updated: ${data.lastUpdated}`
  );
  console.log(`Sets returned: ${data.sets.map((s) => s.name).join(", ")}`);

  const cards: Card[] = [];
  const skipped: string[] = [];

  for (const set of data.sets) {
    for (const dto of set.cards) {
      const setCode = deriveSetCode(dto, set.name);
      const card = normalizeCard(dto, setCode);

      if (!validateCard(card as unknown)) {
        // TypeScript narrows `card` to `never` here (Card & !Card), so we log
        // from `dto` which retains the raw API values — more useful for debugging.
        skipped.push(
          `  [SKIP] ${dto.id} "${dto.name}" type=${dto.type} rarity=${dto.rarity}`
        );
      } else {
        cards.push(card);
      }
    }
  }

  if (skipped.length > 0) {
    console.warn(`\n⚠  ${skipped.length} card(s) failed validation and were excluded:`);
    skipped.forEach((s) => console.warn(s));
    console.warn(
      "\nIf failures are due to an unrecognized type or rarity, add the new value to\n" +
      "src/models/card.ts and src/utils/validate.ts, then re-run this script.\n"
    );
  }

  if (cards.length === 0) {
    throw new Error(
      "No valid cards produced — refusing to overwrite cards.json with an empty dataset."
    );
  }

  fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2) + "\n", "utf-8");
  console.log(`\n✓ Wrote ${cards.length} cards to ${outputPath}`);
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
