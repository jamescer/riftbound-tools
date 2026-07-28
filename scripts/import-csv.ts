import fs from "fs";
import path from "path";
import { Card, CardDomain, CardSet, CardType } from "../src/models/card";

const csvPath = path.resolve(__dirname, "..", "Riftbound - All Card Info - All Card Data.csv");
const outputPath = path.resolve(__dirname, "..", "src", "data", "cards.json");

const setCodeMap: Record<string, CardSet> = {
  ogn: "Origins",
  ogs: "Origins",
  sfd: "Spiritforged",
  unl: "Unleashed",
  vnd: "Vendetta",
  rdn: "Radiance"
};

const validDomains = new Set<CardDomain>(["Fury", "Calm", "Mind", "Body", "Chaos", "Order", "Colorless"]);
const validTypes = new Set<CardType>(["Unit", "Spell", "Gear", "Rune", "Battlefield", "Legend"]);
const validRarities = new Set(["Common", "Uncommon", "Rare", "Epic", "Showcase"]);

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields.map((field) => field.trim());
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseTags(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  return normalized
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeType(type: string): CardType {
  return type.trim() as CardType;
}

function normalizeDomain(value: string | undefined): CardDomain[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is CardDomain => validDomains.has(part as CardDomain));
  return parts.length > 0 ? parts : undefined;
}

function parseCardLine(fields: string[]): Card {
  const [id, name, , , , , , energy, might, power, cardType, rarity, domain, tags, ability, imageUrl] = fields;

  const prefix = id?.split("-")[0]?.toLowerCase() ?? "";
  const setCode = prefix.toUpperCase();
  const set = setCodeMap[prefix];
  const parsedAbility = ability?.trim() ?? "";
  const parsedTags = parseTags(tags);

  return {
    id: id?.trim() ?? "",
    name: name?.trim() ?? "",
    type: normalizeType(cardType ?? ""),
    rarity: (rarity?.trim() ?? "") as any,
    cost: parseNumber(energy) ?? 0,
    energy: parseNumber(energy),
    might: parseNumber(might),
    power: parseNumber(power),
    domain: normalizeDomain(domain),
    tags: parsedTags,
    ability: parsedAbility || undefined,
    abilities: parsedAbility ? [parsedAbility] : [],
    text: parsedAbility || "",
    imageUrl: imageUrl?.trim() || undefined,
    setCode,
    set,
    keywords: parsedTags,
  } as Card;
}

function validateCard(card: unknown): card is Card {
  if (typeof card !== "object" || card === null) return false;
  const c = card as Record<string, unknown>;
  return (
    typeof c.id === "string" && c.id !== "" &&
    typeof c.name === "string" && c.name !== "" &&
    typeof c.type === "string" && validTypes.has(c.type as CardType) &&
    typeof c.rarity === "string" && validRarities.has(c.rarity as string) &&
    typeof c.cost === "number" &&
    typeof c.text === "string" &&
    typeof c.setCode === "string" && c.setCode !== "" &&
    Array.isArray(c.abilities) && c.abilities.every((item) => typeof item === "string") &&
    (c.energy === undefined || typeof c.energy === "number") &&
    (c.might === undefined || typeof c.might === "number") &&
    (c.power === undefined || typeof c.power === "number") &&
    (c.imageUrl === undefined || typeof c.imageUrl === "string") &&
    (c.domain === undefined || (Array.isArray(c.domain) && c.domain.every((item) => validDomains.has(item as CardDomain)))) &&
    (c.tags === undefined || (Array.isArray(c.tags) && c.tags.every((item) => typeof item === "string"))) &&
    (c.keywords === undefined || (Array.isArray(c.keywords) && c.keywords.every((item) => typeof item === "string")))
  );
}

function run() {
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length <= 1) {
    throw new Error("CSV file does not contain any card rows.");
  }

  const cards = lines.slice(1).map((line, index) => {
    const fields = parseCsvLine(line);
    const card = parseCardLine(fields);
    if (!validateCard(card)) {
      throw new Error(`Invalid card data on CSV row ${index + 2}: ${JSON.stringify(card)}`);
    }
    return card;
  });

  fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2) + "\n", "utf-8");
  console.log(`Generated ${cards.length} cards from CSV at ${outputPath}`);
}

run();
