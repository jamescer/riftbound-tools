import fs from "fs";
import path from "path";
import { Card } from "../src/models/card";

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

const validSets = ["Origins", "Spiritforged", "Unleashed", "Vendetta", "Radiance"] as const;
const validSetCodes = ["OGN", "SFD", "UNL", "VND", "RDN"] as const;

function validateCard(card: unknown): card is Card {
  if (typeof card !== "object" || card === null) return false;
  const c = card as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.faction === "string" &&
    typeof c.type === "string" &&
    typeof c.rarity === "string" &&
    typeof c.cost === "number" &&
    typeof c.text === "string" &&
    typeof c.set === "string" &&
    validSets.includes(c.set as typeof validSets[number]) &&
    typeof c.setCode === "string" &&
    validSetCodes.includes(c.setCode as typeof validSetCodes[number]) &&
    Array.isArray(c.abilities) &&
    c.abilities.every((ability) => typeof ability === "string") &&
    (c.might === undefined || typeof c.might === "number") &&
    (c.keywords === undefined || (Array.isArray(c.keywords) && c.keywords.every((keyword) => typeof keyword === "string")))
  );
}

function normalizeRemoteCard(raw: unknown): Card {
  const card = raw as Record<string, unknown>;
  const mightValue = card.might ?? (typeof card.attack === "number" ? card.attack : undefined);

  return {
    id: String(card.id ?? ""),
    name: String(card.name ?? ""),
    faction: String(card.faction ?? ""),
    type: String(card.type ?? ""),
    rarity: String(card.rarity ?? ""),
    cost: Number(card.cost ?? 0),
    might: mightValue === undefined ? undefined : Number(mightValue),
    abilities: Array.isArray(card.abilities) ? card.abilities.map(String) : [],
    text: String(card.text ?? ""),
    set: String(card.set ?? ""),
    setCode: String(card.setCode ?? ""),
    keywords: Array.isArray(card.keywords) ? card.keywords.map(String) : undefined,
    collectible: card.collectible === undefined ? undefined : Boolean(card.collectible)
  };
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
