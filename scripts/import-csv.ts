import fs from "fs";
import path from "path";
import { Card, CardDomain, CardRarity, CardSet, CardType } from "../src/models/card";
import { validateCard, validDomains, validTypes, validRarities } from "./utils";

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

function normalizeType(raw: string): CardType {
  const trimmed = raw.trim();
  if (!validTypes.has(trimmed as CardType)) {
    throw new Error(`Unknown card type: "${trimmed}"`);
  }
  return trimmed as CardType;
}

function normalizeRarity(raw: string): CardRarity {
  const trimmed = raw.trim();
  if (!validRarities.has(trimmed as CardRarity)) {
    throw new Error(`Unknown card rarity: "${trimmed}"`);
  }
  return trimmed as CardRarity;
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
    rarity: normalizeRarity(rarity ?? ""),
    cost: parseNumber(energy) ?? parseNumber(might) ?? 0,
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
