import { describe, expect, it } from "vitest";
import { cards } from "../src/data/cards";
import { filterByFaction, filterByRarity, filterByType, getCardById, searchCards } from "../src/utils/card-utils";

describe("card-utils", () => {
  it("filters cards by faction", () => {
    const result = filterByFaction(cards, "Infernal");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Abyssal Flamewing");
  });

  it("filters cards by rarity", () => {
    const result = filterByRarity(cards, "Rare");
    expect(result).toHaveLength(2);
  });

  it("filters cards by type", () => {
    const result = filterByType(cards, "Spell");
    expect(result).toHaveLength(2);
  });

  it("gets card by id", () => {
    const card = getCardById(cards, "riftbound-003");
    expect(card).toBeDefined();
    expect(card?.name).toBe("Void Rift");
  });

  it("searches cards by text", () => {
    const result = searchCards(cards, "draw");
    expect(result.map((card) => card.name)).toContain("Arcane Resonance");
  });
});
