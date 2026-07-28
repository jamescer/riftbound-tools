import { describe, expect, it } from "vitest";
import { Card } from "../src/models/card";
import {
  filterByDomain,
  filterByRarity,
  filterByType,
  getCardById,
  searchCards
} from "../src/utils/card-utils";

const cards: Card[] = [
  {
    id: "test-001",
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
    keywords: ["Flying", "Battlecry"]
  },
  {
    id: "test-002",
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
    keywords: ["Ward", "Healing"]
  },
  {
    id: "test-003",
    name: "Void Rift",
    type: "Spell",
    rarity: "Epic",
    cost: 7,
    domain: ["Mind"],
    abilities: ["Destroy all enemy units."],
    text: "Tear open the rift and consume everything in the enemy camp.",
    set: "Origins",
    setCode: "OGN",
    keywords: ["Board Clear"]
  },
  {
    id: "test-004",
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
    keywords: ["Rush"]
  },
  {
    id: "test-005",
    name: "Arcane Resonance",
    type: "Spell",
    rarity: "Rare",
    cost: 1,
    domain: ["Mind", "Calm"],
    abilities: ["Draw 2 cards."],
    text: "The rift hums with potential, and knowledge pours out.",
    set: "Origins",
    setCode: "OGN",
    keywords: ["Card Draw"]
  }
];

describe("card-utils", () => {
  it("filters cards by domain", () => {
    const result = filterByDomain(cards, "Mind");
    expect(result.map((card) => card.name)).toEqual(["Void Rift", "Arcane Resonance"]);
  });

  it("filters cards by rarity", () => {
    const result = filterByRarity(cards, "Epic");
    expect(result).toHaveLength(2);
  });

  it("filters cards by type", () => {
    const result = filterByType(cards, "Spell");
    expect(result).toHaveLength(2);
  });

  it("gets card by id", () => {
    const card = getCardById(cards, "test-003");
    expect(card).toBeDefined();
    expect(card?.name).toBe("Void Rift");
  });

  it("searches cards by text", () => {
    const result = searchCards(cards, "draw");
    expect(result.map((card) => card.name)).toContain("Arcane Resonance");
  });
});
