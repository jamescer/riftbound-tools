import fs from "fs";
import path from "path";
import { Card } from "../src/models/card";

const dataPath = path.resolve(__dirname, "..", "src", "data", "cards.json");

const exampleCards: Card[] = [
  {
    id: "riftbound-001",
    name: "Abyssal Flamewing",
    faction: "Infernal",
    type: "Unit",
    rarity: "Epic",
    cost: 4,
    might: 5,
    abilities: ["Flying", "Battlecry: Deal 2 damage to a random enemy."],
    text: "Abyssal Flamewing rules the sky with fire and fury.",
    set: "Origins",
    setCode: "OGN",
    keywords: ["Flying", "Battlecry"],
    collectible: true
  },
  {
    id: "riftbound-002",
    name: "Celestial Guardian",
    faction: "Celestial",
    type: "Unit",
    rarity: "Rare",
    cost: 3,
    might: 2,
    abilities: ["Ward", "When this card is healed, draw a card."],
    text: "Guardian of the rift, shielding allies from falling stars.",
    set: "Origins",
    setCode: "OGN",
    keywords: ["Ward", "Healing"],
    collectible: true
  },
  {
    id: "riftbound-003",
    name: "Void Rift",
    faction: "Void",
    type: "Spell",
    rarity: "Legendary",
    cost: 7,
    abilities: ["Destroy all enemy units."],
    text: "Tear open the rift and consume everything in the enemy camp.",
    set: "Origins",
    setCode: "OGN",
    keywords: ["Board Clear"],
    collectible: true
  },
  {
    id: "riftbound-004",
    name: "Wildwood Huntress",
    faction: "Wild",
    type: "Unit",
    rarity: "Common",
    cost: 2,
    might: 2,
    abilities: ["Rush"],
    text: "A silent hunter whose arrows strike before the target can react.",
    set: "Origins",
    setCode: "OGN",
    keywords: ["Rush"],
    collectible: true
  },
  {
    id: "riftbound-005",
    name: "Arcane Resonance",
    faction: "Arcane",
    type: "Spell",
    rarity: "Rare",
    cost: 1,
    abilities: ["Draw 2 cards."],
    text: "The rift hums with potential, and knowledge pours out.",
    set: "Origins",
    setCode: "OGN",
    keywords: ["Card Draw"],
    collectible: true
  }
];

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
    typeof c.setCode === "string" &&
    Array.isArray(c.abilities) &&
    c.abilities.every((a) => typeof a === "string") &&
    (c.might === undefined || typeof c.might === "number") &&
    (c.keywords === undefined || (Array.isArray(c.keywords) && c.keywords.every((k) => typeof k === "string")))
  );
}

function run() {
  const finalCards = exampleCards.filter(validateCard);

  if (finalCards.length !== exampleCards.length) {
    throw new Error("Card validation failed for one or more cards.");
  }

  fs.writeFileSync(dataPath, JSON.stringify(finalCards, null, 2) + "\n", "utf-8");
  console.log(`Generated ${finalCards.length} cards at ${dataPath}`);
}

run();
