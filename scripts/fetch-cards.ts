import fs from "fs";
import path from "path";
import { Card, CardDomain, CardSet } from "../src/models/card";
import { setCodeMap } from "../src/data/setCodeMap";
import { validateCard, validDomains, validSets } from "./utils";

const outputPath = path.resolve(__dirname, "..", "src", "data", "cards.json");

function getSource(): string {
  const args = process.argv.slice(2);
  const urlArg = args.find((arg) => arg.startsWith("--url=")) || args.find((arg) => arg.startsWith("--source="));
  if (urlArg) {
    return urlArg.split("=", 2)[1];
  }

  const valueIndex = args.findIndex((arg) => arg === "--url" || arg === "--source");
  if (valueIndex !== -1 && args[valueIndex + 1]) {
    return args[valueIndex + 1];
  }

  return process.env.RIFTBOUND_CARDS_SOURCE_URL ?? "";
}

function isHttpSource(source: string): boolean {
  return source.startsWith("http://") || source.startsWith("https://");
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function toOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result = value.map(String).filter(Boolean);
  return result.length > 0 ? result : undefined;
}

function normalizeDomain(value: unknown): CardDomain[] | undefined {
  const arr = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const parts = arr
    .map((d) => String(d).trim())
    .filter((d): d is CardDomain => validDomains.has(d as CardDomain));
  return parts.length > 0 ? parts : undefined;
}

function normalizeSet(value: unknown): CardSet | undefined {
  const s = typeof value === "string" ? value.trim() : "";
  return validSets.has(s as CardSet) ? (s as CardSet) : undefined;
}

function normalizeSetCode(raw: Record<string, unknown>): string {
  // Prefer an explicit setCode field; fall back to deriving from the id prefix.
  if (typeof raw.setCode === "string" && raw.setCode.trim()) {
    return raw.setCode.trim().toUpperCase();
  }
  const id = typeof raw.id === "string" ? raw.id : "";
  return id.split("-")[0]?.toUpperCase() ?? "";
}

function normalizeRemoteCard(raw: unknown): Card {
  const card = raw as Record<string, unknown>;

  // Support remote sources that use `attack` as an alias for `might`.
  const mightRaw = card.might ?? (typeof card.attack === "number" ? card.attack : undefined);
  const setCode = normalizeSetCode(card);
  const setFromCode = setCodeMap[setCode.toLowerCase()];
  const set = setFromCode ?? normalizeSet(card.set);
  // Support remote sources that may still carry the deprecated `ability` field as a
  // fallback for `text`/`abilities` when those fields are absent.
  const legacyAbility = typeof card.ability === "string" ? card.ability.trim() : "";
  const text = typeof card.text === "string" ? card.text : legacyAbility;
  const abilities = Array.isArray(card.abilities)
    ? toStringArray(card.abilities)
    : legacyAbility ? [legacyAbility] : [];

  return {
    id: String(card.id ?? ""),
    name: String(card.name ?? ""),
    type: String(card.type ?? ""),
    rarity: String(card.rarity ?? ""),
    cost: Number(card.cost ?? 0),
    energy: toOptionalNumber(card.energy),
    might: toOptionalNumber(mightRaw),
    domain: normalizeDomain(card.domain),
    abilities,
    text,
    imageUrl: typeof card.imageUrl === "string" && card.imageUrl ? card.imageUrl : undefined,
    set,
    setCode,
    keywords: toOptionalStringArray(card.keywords),
    collectible: card.collectible === undefined ? undefined : Boolean(card.collectible),
  } as Card;
}

async function loadCardData(source: string): Promise<unknown> {
  if (isHttpSource(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch card data from ${source}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  const filePath = path.isAbsolute(source) ? source : path.resolve(process.cwd(), source);
  const fileContents = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContents);
}

async function run() {
  const source = getSource();
  if (!source) {
    throw new Error("Provide a JSON source with --url, --source, or RIFTBOUND_CARDS_SOURCE_URL.");
  }

  const raw = await loadCardData(source);
  if (!Array.isArray(raw)) {
    throw new Error("Fetched card data must be an array.");
  }

  const cards = raw.map(normalizeRemoteCard);
  const invalid = cards.filter((card) => !validateCard(card));
  if (invalid.length > 0) {
    throw new Error(`Validation failed for ${invalid.length} cards after normalization.`);
  }

  fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2) + "\n", "utf-8");
  console.log(`Fetched and saved ${cards.length} cards to ${outputPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
