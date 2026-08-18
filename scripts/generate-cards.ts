import fs from "fs";
import path from "path";
import { Card } from "../src/models/card";
import { validateCard } from "./utils";

const dataPath = path.resolve(__dirname, "..", "src", "data", "cards.json");

/**
 * Five example cards that accurately reflect the real Riftbound data model:
 *
 * - Units have `energy` (their play cost) and may have `might` (a separate combat stat).
 *   `cost` equals `energy` for Units.
 * - Spells/Gear use `might` as their play cost; they never have `energy`.
 *   `cost` equals `might` for costed Spells/Gear, or 0 if free.
 * - Runes always have `cost: 0`, no `might`, no `energy`, and empty `text`/`abilities`.
 * - `abilities` always has 0 or 1 element — the same value as `text`.
 * - `keywords` holds region/champion tags ("Noxus", "Dragon"), not rules keywords.
 * - Rules keywords ("Accelerate", "Reaction") appear in `text` as `[Bracket]` notation.
 *
 * Do NOT run `npm run generate:cards` if you want to keep the real 950-card dataset —
 * this script overwrites `src/data/cards.json` with these 5 examples only.
 */
const exampleCards: Card[] = [
  // Unit — has energy (play cost) and might (combat stat)
  {
    id: "ogn-001",
    name: "Blazing Scorcher",
    type: "Unit",
    rarity: "Common",
    cost: 5,
    energy: 5,
    might: 4,
    domain: ["Fury"],
    abilities: [
      "[Accelerate] (You may pay 1 energy and 1 fury rune as an additional cost to have me enter ready.)",
    ],
    text: "[Accelerate] (You may pay 1 energy and 1 fury rune as an additional cost to have me enter ready.)",
    imageUrl: "https://cmsassets.rgpub.io/sanity/images/placeholder.png",
    setCode: "OGN",
    set: "Origins",
    keywords: ["Noxus", "Dragon"],
    collectible: true,
  },
  // Unit — no keywords, no might (some Units only have energy)
  {
    id: "ogn-002",
    name: "Calm Watcher",
    type: "Unit",
    rarity: "Uncommon",
    cost: 3,
    energy: 3,
    domain: ["Calm"],
    abilities: ["[Deflect] (Redirect the first spell targeting me each turn to me.)"],
    text: "[Deflect] (Redirect the first spell targeting me each turn to me.)",
    imageUrl: "https://cmsassets.rgpub.io/sanity/images/placeholder.png",
    setCode: "OGN",
    set: "Origins",
    collectible: true,
  },
  // Spell — uses might as play cost, never has energy
  {
    id: "ogn-003",
    name: "Mind Surge",
    type: "Spell",
    rarity: "Rare",
    cost: 2,
    might: 2,
    domain: ["Mind"],
    abilities: ["[Action] Draw 2 cards."],
    text: "[Action] Draw 2 cards.",
    imageUrl: "https://cmsassets.rgpub.io/sanity/images/placeholder.png",
    setCode: "OGN",
    set: "Origins",
    collectible: true,
  },
  // Gear — uses might as play cost, never has energy
  {
    id: "ogn-004",
    name: "Iron Mantle",
    type: "Gear",
    rarity: "Common",
    cost: 3,
    might: 3,
    domain: ["Body"],
    abilities: ["Equipped unit has +2 might."],
    text: "Equipped unit has +2 might.",
    imageUrl: "https://cmsassets.rgpub.io/sanity/images/placeholder.png",
    setCode: "OGN",
    set: "Origins",
    collectible: true,
  },
  // Rune — always cost 0, no energy, no might, empty text and abilities
  {
    id: "ogn-005",
    name: "Fury Rune",
    type: "Rune",
    rarity: "Common",
    cost: 0,
    domain: ["Fury"],
    abilities: [],
    text: "",
    imageUrl: "https://cmsassets.rgpub.io/sanity/images/placeholder.png",
    setCode: "OGN",
    set: "Origins",
    collectible: true,
  },
];

function run() {
  const finalCards = exampleCards.filter(validateCard);

  if (finalCards.length !== exampleCards.length) {
    throw new Error("Card validation failed for one or more example cards.");
  }

  fs.writeFileSync(dataPath, JSON.stringify(finalCards, null, 2) + "\n", "utf-8");
  console.log(`Generated ${finalCards.length} example cards at ${dataPath}`);
}

run();
