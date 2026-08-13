import { describe, expect, it } from "vitest";
import { Card } from "../src/models/card";
import {
  extractRulesKeywords,
  filterByCollectible,
  filterByCostRange,
  filterByDomain,
  filterByDomains,
  filterByKeyword,
  filterByMightRange,
  filterByRarity,
  filterBySet,
  filterBySetCode,
  filterByType,
  filterByRulesKeyword,
  getCardById,
  getCardsByName,
  groupByDomain,
  groupByType,
  searchCards,
  sortByCost,
  sortByMight,
  sortByName,
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
    keywords: ["Flying", "Battlecry"],
    collectible: true,
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
    keywords: ["Ward", "Healing"],
    collectible: true,
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
    keywords: ["Board Clear"],
    collectible: true,
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
    keywords: ["Rush"],
    collectible: false,
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
    set: "Spiritforged",
    setCode: "SFD",
    keywords: ["Card Draw"],
    collectible: true,
  },
];

// ─── filter tests ────────────────────────────────────────────────────────────

describe("filterByDomain", () => {
  it("returns cards matching the given domain", () => {
    const result = filterByDomain(cards, "Mind");
    expect(result.map((c) => c.name)).toEqual(["Void Rift", "Arcane Resonance"]);
  });

  it("returns cards that belong to multiple domains", () => {
    const calmCards = filterByDomain(cards, "Calm");
    expect(calmCards.map((c) => c.name)).toContain("Arcane Resonance");
  });

  it("returns empty array when no cards match", () => {
    expect(filterByDomain(cards, "Chaos")).toHaveLength(0);
  });
});

describe("filterByDomains", () => {
  it("OR mode (default): returns cards matching at least one domain", () => {
    const result = filterByDomains(cards, ["Fury", "Mind"]);
    const names = result.map((c) => c.name);
    expect(names).toContain("Abyssal Flamewing"); // Fury
    expect(names).toContain("Void Rift");          // Mind
    expect(names).toContain("Arcane Resonance");   // Mind + Calm
  });

  it("AND mode: returns only cards that have ALL given domains", () => {
    // Arcane Resonance has both Mind and Calm; others do not
    const result = filterByDomains(cards, ["Mind", "Calm"], "all");
    expect(result.map((c) => c.name)).toEqual(["Arcane Resonance"]);
  });

  it("AND mode: returns empty array when no card has all domains", () => {
    expect(filterByDomains(cards, ["Fury", "Body"], "all")).toHaveLength(0);
  });

  it("returns all cards when domains array is empty", () => {
    expect(filterByDomains(cards, [])).toHaveLength(cards.length);
  });

  it("OR mode: returns empty array when no cards match any domain", () => {
    expect(filterByDomains(cards, ["Chaos", "Order"])).toHaveLength(0);
  });
});

describe("filterByRarity", () => {
  it("returns cards matching the given rarity", () => {
    const result = filterByRarity(cards, "Epic");
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.rarity === "Epic")).toBe(true);
  });

  it("returns empty array when rarity not present", () => {
    expect(filterByRarity(cards, "Uncommon")).toHaveLength(0);
  });
});

describe("filterByType", () => {
  it("returns cards of the given type", () => {
    const result = filterByType(cards, "Spell");
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.type === "Spell")).toBe(true);
  });

  it("returns empty array when type not present", () => {
    expect(filterByType(cards, "Gear")).toHaveLength(0);
  });
});

describe("filterBySet", () => {
  it("returns cards from the given set", () => {
    const result = filterBySet(cards, "Spiritforged");
    expect(result.map((c) => c.name)).toEqual(["Arcane Resonance"]);
  });

  it("returns empty array when set not present", () => {
    expect(filterBySet(cards, "Radiance")).toHaveLength(0);
  });
});

describe("filterBySetCode", () => {
  it("returns cards matching the given set code", () => {
    const result = filterBySetCode(cards, "OGN");
    expect(result).toHaveLength(4);
  });

  it("is case-sensitive", () => {
    expect(filterBySetCode(cards, "ogn")).toHaveLength(0);
  });
});

describe("filterByKeyword", () => {
  it("returns cards with matching keyword (case-insensitive)", () => {
    expect(filterByKeyword(cards, "flying")).toHaveLength(1);
    expect(filterByKeyword(cards, "Flying")).toHaveLength(1);
  });

  it("returns empty array when keyword not present", () => {
    expect(filterByKeyword(cards, "Haste")).toHaveLength(0);
  });

  it("trims whitespace from the keyword query", () => {
    expect(filterByKeyword(cards, "  Rush  ")).toHaveLength(1);
  });
});

describe("filterByCollectible", () => {
  it("returns collectible cards by default", () => {
    const result = filterByCollectible(cards);
    expect(result.every((c) => c.collectible === true)).toBe(true);
  });

  it("returns non-collectible cards when passed false", () => {
    const result = filterByCollectible(cards, false);
    expect(result.map((c) => c.name)).toEqual(["Wildwood Huntress"]);
  });
});

describe("filterByCostRange", () => {
  it("returns cards within the cost range (inclusive)", () => {
    const result = filterByCostRange(cards, 2, 4);
    expect(result.map((c) => c.name)).toEqual([
      "Abyssal Flamewing",
      "Celestial Guardian",
      "Wildwood Huntress",
    ]);
  });

  it("returns empty array when no cards fall in range", () => {
    expect(filterByCostRange(cards, 10, 20)).toHaveLength(0);
  });

  it("returns a single card when min equals max", () => {
    const result = filterByCostRange(cards, 7, 7);
    expect(result.map((c) => c.name)).toEqual(["Void Rift"]);
  });
});

// ─── sort tests ───────────────────────────────────────────────────────────────

describe("sortByCost", () => {
  it("sorts ascending by default", () => {
    const result = sortByCost(cards);
    const costs = result.map((c) => c.cost);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
  });

  it("sorts descending when specified", () => {
    const result = sortByCost(cards, "desc");
    const costs = result.map((c) => c.cost);
    expect(costs).toEqual([...costs].sort((a, b) => b - a));
  });

  it("does not mutate the original array", () => {
    const original = [...cards];
    sortByCost(cards, "desc");
    expect(cards).toEqual(original);
  });
});

describe("sortByMight", () => {
  it("sorts descending by default", () => {
    const result = sortByMight(cards);
    const mights = result.map((c) => c.might ?? 0);
    expect(mights).toEqual([...mights].sort((a, b) => b - a));
  });

  it("sorts ascending when specified", () => {
    const result = sortByMight(cards, "asc");
    const mights = result.map((c) => c.might ?? 0);
    expect(mights).toEqual([...mights].sort((a, b) => a - b));
  });

  it("does not mutate the original array", () => {
    const original = [...cards];
    sortByMight(cards);
    expect(cards).toEqual(original);
  });
});

describe("sortByName", () => {
  it("sorts alphabetically ascending by default", () => {
    const result = sortByName(cards);
    const names = result.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("sorts descending when specified", () => {
    const result = sortByName(cards, "desc");
    const names = result.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  it("does not mutate the original array", () => {
    const original = [...cards];
    sortByName(cards, "desc");
    expect(cards).toEqual(original);
  });
});

// ─── lookup tests ─────────────────────────────────────────────────────────────

describe("getCardById", () => {
  it("returns the card with the given id", () => {
    const card = getCardById(cards, "test-003");
    expect(card).toBeDefined();
    expect(card?.name).toBe("Void Rift");
  });

  it("returns undefined for an unknown id", () => {
    expect(getCardById(cards, "does-not-exist")).toBeUndefined();
  });
});

// ─── search tests ─────────────────────────────────────────────────────────────

describe("searchCards", () => {
  it("matches on card name", () => {
    const result = searchCards(cards, "Flamewing");
    expect(result.map((c) => c.name)).toContain("Abyssal Flamewing");
  });

  it("matches on card text", () => {
    const result = searchCards(cards, "draw");
    expect(result.map((c) => c.name)).toContain("Arcane Resonance");
  });

  it("matches on domain", () => {
    const result = searchCards(cards, "Fury");
    expect(result.map((c) => c.name)).toContain("Abyssal Flamewing");
  });

  it("matches on keyword", () => {
    const result = searchCards(cards, "Battlecry");
    expect(result.map((c) => c.name)).toContain("Abyssal Flamewing");
  });

  it("is case-insensitive", () => {
    expect(searchCards(cards, "VOID RIFT")).toHaveLength(1);
  });

  it("returns all cards for an empty query", () => {
    expect(searchCards(cards, "")).toHaveLength(cards.length);
    expect(searchCards(cards, "   ")).toHaveLength(cards.length);
  });

  it("returns empty array when nothing matches", () => {
    expect(searchCards(cards, "xyzzy")).toHaveLength(0);
  });
});

// ─── group tests ──────────────────────────────────────────────────────────────

describe("groupByType", () => {
  it("groups cards by their type", () => {
    const result = groupByType(cards);
    expect(result.Unit).toHaveLength(3);
    expect(result.Spell).toHaveLength(2);
    expect(result.Gear).toBeUndefined();
  });
});

describe("groupByDomain", () => {
  it("groups cards by domain", () => {
    const result = groupByDomain(cards);
    expect(result.Mind).toHaveLength(2);
    expect(result.Fury).toHaveLength(1);
  });

  it("places multi-domain cards into each matching domain group", () => {
    const result = groupByDomain(cards);
    // Arcane Resonance has both Mind and Calm
    expect(result.Mind?.map((c) => c.name)).toContain("Arcane Resonance");
    expect(result.Calm?.map((c) => c.name)).toContain("Arcane Resonance");
  });
});
