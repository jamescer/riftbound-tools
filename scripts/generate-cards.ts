import fs from "fs";
import path from "path";
import { Card } from "../src/models/card";
import { validateCard } from "./utils";

const dataPath = path.resolve(__dirname, "..", "src", "data", "cards.json");

const exampleCards: Card[] = [
  {
    id: "riftbound-001",
    name: "Abyssal Flamewing",
    type: "Unit",
    rarity: "Epic",
    cost: 4,
    might: 5,
    domain: ["Fury"],
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
    type: "Unit",
    rarity: "Rare",
    cost: 3,
    might: 2,
    domain: ["Calm"],
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
    type: "Spell",
    rarity: "Epic",
    cost: 7,
    domain: ["Mind"],
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
    type: "Unit",
    rarity: "Common",
    cost: 2,
    might: 2,
    domain: ["Body"],
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
    type: "Spell",
    rarity: "Rare",
    cost: 1,
    domain: ["Mind", "Calm"],
    abilities: ["Draw 2 cards."],
    text: "The rift hums with potential, and knowledge pours out.",
    set: "Origins",
    setCode: "OGN",
    keywords: ["Card Draw"],
    collectible: true
  }
];

function run() {
  const finalCards = exampleCards.filter(validateCard);

  if (finalCards.length !== exampleCards.length) {
    throw new Error("Card validation failed for one or more cards.");
  }

  fs.writeFileSync(dataPath, JSON.stringify(finalCards, null, 2) + "\n", "utf-8");
  console.log(`Generated ${finalCards.length} cards at ${dataPath}`);
}

run();
