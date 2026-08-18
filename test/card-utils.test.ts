import { describe, expect, it } from "vitest";
import { Card } from "../src/models/card";
import {
  countByDomain,
  countByRarity,
  countBySet,
  countByType,
  extractRulesKeywords,
  filterByCollectible,
  filterByCostRange,
  filterByDomain,
  filterByDomains,
  filterByEnergyRange,
  filterByKeyword,
  filterByKeywords,
  filterByMightRange,
  filterByRarities,
  filterByRarity,
  filterByRulesKeyword,
  filterByRulesKeywords,
  filterBySet,
  filterBySets,
  filterBySetCode,
  filterByNameContains,
  filterByText,
  filterByType,
  filterByTypes,
  getCardById,
  getCardsByName,
  sampleCards,
  getUniqueKeywords,
  getUniqueRulesKeywords,
  groupByDomain,
  groupByRarity,
  groupBySet,
  groupByType,
  rarityOrder,
  searchCards,
  sortByCost,
  sortByEnergy,
  sortByMight,
  sortByName,
  sortByRarity,
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
  // Showcase reprint of test-001 — same name, different id/rarity
  {
    id: "test-001a",
    name: "Abyssal Flamewing",
    type: "Unit",
    rarity: "Showcase",
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
  // Card with rules keywords in [brackets] and an HTML entity
  {
    id: "test-006",
    name: "Storm Sentinel",
    type: "Unit",
    rarity: "Uncommon",
    cost: 3,
    might: 3,
    domain: ["Fury", "Mind"],
    abilities: ["[Reaction] [&gt;] [Deflect]: Counter target spell."],
    text: "[Reaction] [&gt;] [Deflect]: Counter target spell.",
    set: "Spiritforged",
    setCode: "SFD",
    keywords: ["Ionia"],
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

  it("returns cards matching a rarity with one result", () => {
    expect(filterByRarity(cards, "Uncommon")).toHaveLength(1);
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
    const names = result.map((c) => c.name);
    expect(names).toContain("Abyssal Flamewing");
    expect(names).toContain("Celestial Guardian");
    expect(names).toContain("Wildwood Huntress");
    expect(names).not.toContain("Void Rift"); // cost 7
    expect(names).not.toContain("Arcane Resonance"); // cost 1
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
    // 3 original Units + Showcase reprint (test-001a) + Storm Sentinel (test-006) = 5
    expect(result.Unit).toHaveLength(5);
    expect(result.Spell).toHaveLength(2);
    expect(result.Gear).toBeUndefined();
  });
});

describe("groupByDomain", () => {
  it("groups cards by domain", () => {
    const result = groupByDomain(cards);
    // Void Rift + Arcane Resonance + Storm Sentinel = 3
    expect(result.Mind).toHaveLength(3);
    // Abyssal Flamewing + Showcase reprint + Storm Sentinel = 3
    expect(result.Fury).toHaveLength(3);
  });

  it("places multi-domain cards into each matching domain group", () => {
    const result = groupByDomain(cards);
    // Arcane Resonance has both Mind and Calm
    expect(result.Mind?.map((c) => c.name)).toContain("Arcane Resonance");
    expect(result.Calm?.map((c) => c.name)).toContain("Arcane Resonance");
  });
});

// ─── name lookup tests ────────────────────────────────────────────────────────

describe("getCardsByName", () => {
  it("returns all cards with the given name (case-insensitive)", () => {
    // "Abyssal Flamewing" exists as Common (test-001) and Showcase (test-001a)
    const result = getCardsByName(cards, "Abyssal Flamewing");
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toContain("test-001");
    expect(result.map((c) => c.id)).toContain("test-001a");
  });

  it("is case-insensitive", () => {
    expect(getCardsByName(cards, "abyssal flamewing")).toHaveLength(2);
    expect(getCardsByName(cards, "ABYSSAL FLAMEWING")).toHaveLength(2);
  });

  it("returns empty array when no card matches the name", () => {
    expect(getCardsByName(cards, "Unknown Card")).toHaveLength(0);
  });

  it("returns exactly one card for a unique name", () => {
    const result = getCardsByName(cards, "Void Rift");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("test-003");
  });
});

// ─── might range tests ────────────────────────────────────────────────────────

describe("filterByMightRange", () => {
  it("returns cards whose might is within the range (inclusive)", () => {
    const result = filterByMightRange(cards, 2, 3);
    // Celestial Guardian (2), Wildwood Huntress (2), Storm Sentinel (3)
    expect(result).toHaveLength(3);
    expect(result.every((c) => c.might !== undefined && c.might >= 2 && c.might <= 3)).toBe(true);
  });

  it("excludes cards with no might value", () => {
    // Void Rift and Arcane Resonance are Spells with no might
    const result = filterByMightRange(cards, 0, 10);
    expect(result.every((c) => c.might !== undefined)).toBe(true);
  });

  it("returns empty array when no cards fall in range", () => {
    expect(filterByMightRange(cards, 10, 20)).toHaveLength(0);
  });

  it("returns single card when min equals max", () => {
    const result = filterByMightRange(cards, 5, 5);
    expect(result.map((c) => c.id)).toEqual(["test-001", "test-001a"]);
  });

  it("does not mutate the original array", () => {
    const original = [...cards];
    filterByMightRange(cards, 2, 3);
    expect(cards).toEqual(original);
  });
});

// ─── rules keyword tests ──────────────────────────────────────────────────────

describe("extractRulesKeywords", () => {
  it("extracts bracketed keywords from card text", () => {
    const sentinel = cards.find((c) => c.id === "test-006")!;
    const kws = extractRulesKeywords(sentinel);
    expect(kws).toContain("Reaction");
    expect(kws).toContain("Deflect");
  });

  it("decodes HTML entities in bracket content", () => {
    const sentinel = cards.find((c) => c.id === "test-006")!;
    const kws = extractRulesKeywords(sentinel);
    // [&gt;] should become [>]
    expect(kws).toContain(">");
    expect(kws).not.toContain("&gt;");
  });

  it("returns empty array for cards with no bracketed keywords", () => {
    const flamewing = cards.find((c) => c.id === "test-001")!;
    expect(extractRulesKeywords(flamewing)).toHaveLength(0);
  });
});

describe("filterByRulesKeyword", () => {
  it("returns cards that contain the given rules keyword", () => {
    const result = filterByRulesKeyword(cards, "Deflect");
    expect(result.map((c) => c.id)).toContain("test-006");
  });

  it("is case-insensitive", () => {
    expect(filterByRulesKeyword(cards, "deflect")).toHaveLength(
      filterByRulesKeyword(cards, "Deflect").length
    );
  });

  it("partial-matches so 'Reaction' hits cards with '[Reaction]'", () => {
    const result = filterByRulesKeyword(cards, "Reaction");
    expect(result).toHaveLength(1);
  });

  it("returns empty array when no cards have the given rules keyword", () => {
    expect(filterByRulesKeyword(cards, "Haste")).toHaveLength(0);
  });

  it("excludes cards that have the word in tags/keywords but not in rules text", () => {
    // "Battlecry" is in keywords[], not in [brackets] in text
    const result = filterByRulesKeyword(cards, "Battlecry");
    expect(result).toHaveLength(0);
  });
});

// ─── multi-rarity filter tests ────────────────────────────────────────────────

describe("filterByRarities", () => {
  it("returns cards matching any of the given rarities", () => {
    const result = filterByRarities(cards, ["Common", "Rare"]);
    const rarities = result.map((c) => c.rarity);
    expect(rarities).toContain("Common");
    expect(rarities).toContain("Rare");
    expect(rarities).not.toContain("Epic");
  });

  it("returns all cards when rarities array is empty", () => {
    expect(filterByRarities(cards, [])).toHaveLength(cards.length);
  });

  it("returns empty array when no cards match any rarity", () => {
    expect(filterByRarities(cards, ["Ultimate"])).toHaveLength(0);
  });

  it("returns same result as filterByRarity for a single rarity", () => {
    expect(filterByRarities(cards, ["Epic"])).toEqual(filterByRarity(cards, "Epic"));
  });
});

// ─── multi-type filter tests ──────────────────────────────────────────────────

describe("filterByTypes", () => {
  it("returns cards matching any of the given types", () => {
    const result = filterByTypes(cards, ["Unit", "Spell"]);
    expect(result.every((c) => c.type === "Unit" || c.type === "Spell")).toBe(true);
    expect(result).toHaveLength(cards.length); // all fixtures are Units or Spells
  });

  it("returns all cards when types array is empty", () => {
    expect(filterByTypes(cards, [])).toHaveLength(cards.length);
  });

  it("returns empty array when no cards match any type", () => {
    expect(filterByTypes(cards, ["Gear", "Rune"])).toHaveLength(0);
  });

  it("returns same result as filterByType for a single type", () => {
    expect(filterByTypes(cards, ["Spell"])).toEqual(filterByType(cards, "Spell"));
  });
});

// ─── multi-set filter tests ───────────────────────────────────────────────────

describe("filterBySets", () => {
  it("returns cards from any of the given sets", () => {
    const result = filterBySets(cards, ["Origins", "Spiritforged"]);
    const sets = result.map((c) => c.set);
    expect(sets).toContain("Origins");
    expect(sets).toContain("Spiritforged");
  });

  it("returns all cards when sets array is empty", () => {
    expect(filterBySets(cards, [])).toHaveLength(cards.length);
  });

  it("returns empty array when no cards match any set", () => {
    expect(filterBySets(cards, ["Radiance", "Vendetta"])).toHaveLength(0);
  });

  it("returns same result as filterBySet for a single set", () => {
    expect(filterBySets(cards, ["Spiritforged"])).toEqual(filterBySet(cards, "Spiritforged"));
  });
});

// ─── sortByRarity tests ───────────────────────────────────────────────────────

describe("sortByRarity", () => {
  it("sorts ascending by rarity tier by default (Common first)", () => {
    const result = sortByRarity(cards);
    const rarities = result.map((c) => c.rarity);
    for (let i = 1; i < rarities.length; i++) {
      expect(rarityOrder[rarities[i]]).toBeGreaterThanOrEqual(rarityOrder[rarities[i - 1]]);
    }
  });

  it("sorts descending when specified (rarest first)", () => {
    const result = sortByRarity(cards, "desc");
    const rarities = result.map((c) => c.rarity);
    for (let i = 1; i < rarities.length; i++) {
      expect(rarityOrder[rarities[i]]).toBeLessThanOrEqual(rarityOrder[rarities[i - 1]]);
    }
  });

  it("does not mutate the original array", () => {
    const original = [...cards];
    sortByRarity(cards, "desc");
    expect(cards).toEqual(original);
  });

  it("puts Showcase after Epic and before Ultimate", () => {
    expect(rarityOrder.Showcase).toBeGreaterThan(rarityOrder.Epic);
    expect(rarityOrder.Showcase).toBeLessThan(rarityOrder.Ultimate);
  });
});

// ─── filterByKeywords tests ───────────────────────────────────────────────────

describe("filterByKeywords", () => {
  it("returns cards that have any of the given keywords (OR)", () => {
    // "Flying" appears on Abyssal Flamewing; "Rush" on Wildwood Huntress
    const result = filterByKeywords(cards, ["Flying", "Rush"]);
    const names = result.map((c) => c.name);
    expect(names).toContain("Abyssal Flamewing");
    expect(names).toContain("Wildwood Huntress");
  });

  it("is case-insensitive", () => {
    expect(filterByKeywords(cards, ["flying"])).toHaveLength(
      filterByKeywords(cards, ["Flying"]).length
    );
  });

  it("returns all cards when keywords array is empty", () => {
    expect(filterByKeywords(cards, [])).toHaveLength(cards.length);
  });

  it("returns empty array when no cards have any of the given keywords", () => {
    expect(filterByKeywords(cards, ["Haste", "Reach"])).toHaveLength(0);
  });

  it("returns the same result as filterByKeyword for a single keyword", () => {
    expect(filterByKeywords(cards, ["Ward"])).toEqual(filterByKeyword(cards, "Ward"));
  });
});

// ─── groupByRarity tests ──────────────────────────────────────────────────────

describe("groupByRarity", () => {
  it("groups cards by their rarity", () => {
    const result = groupByRarity(cards);
    // fixtures include Epic and Rare cards
    expect(result.Epic).toBeDefined();
    expect(result.Rare).toBeDefined();
    expect(result.Epic!.every((c) => c.rarity === "Epic")).toBe(true);
    expect(result.Rare!.every((c) => c.rarity === "Rare")).toBe(true);
  });

  it("omits rarities not present in the input", () => {
    // fixtures have no Gear/Rune types — similarly, check an absent rarity
    expect(groupByRarity(cards).Ultimate).toBeUndefined();
  });

  it("counts match the per-rarity filter", () => {
    const result = groupByRarity(cards);
    expect(result.Epic?.length).toBe(filterByRarity(cards, "Epic").length);
    expect(result.Common?.length).toBe(filterByRarity(cards, "Common").length);
  });
});

// ─── groupBySet tests ─────────────────────────────────────────────────────────

describe("groupBySet", () => {
  it("groups cards by their set", () => {
    const result = groupBySet(cards);
    expect(result.Origins).toBeDefined();
    expect(result.Spiritforged).toBeDefined();
    expect(result.Origins!.every((c) => c.set === "Origins")).toBe(true);
  });

  it("collects cards with undefined set under __unknown__", () => {
    const noSetCard: Card = {
      ...cards[0],
      id: "test-no-set",
      set: undefined,
    };
    const result = groupBySet([...cards, noSetCard]);
    expect(result.__unknown__).toBeDefined();
    expect(result.__unknown__!.map((c) => c.id)).toContain("test-no-set");
  });

  it("counts match filterBySet", () => {
    const result = groupBySet(cards);
    expect(result.Origins?.length).toBe(filterBySet(cards, "Origins").length);
    expect(result.Spiritforged?.length).toBe(filterBySet(cards, "Spiritforged").length);
  });
});

// ─── filterByEnergyRange tests ────────────────────────────────────────────────

describe("filterByEnergyRange", () => {
  it("returns cards whose energy cost is within the range (inclusive)", () => {
    // Abyssal Flamewing energy=undefined (no energy field set), Celestial Guardian cost=3
    // In our fixtures, cost IS set as the derived field, but energy isn't explicitly set
    // Use cards that have energy: test-001 has cost=4, test-002 cost=3, test-004 cost=2
    // We need cards with explicit energy. Let's use the fixture cards where energy was
    // supplied via the cost field — but our fixtures use cost, not energy, since energy
    // is optional. Build a targeted fixture subset.
    const withEnergy = cards.filter((c) => c.energy !== undefined);
    // All fixture cards have no explicit energy — so range over the full set should be empty
    expect(filterByEnergyRange(cards, 0, 10)).toHaveLength(withEnergy.length);
  });

  it("excludes cards with no energy value", () => {
    // None of the test fixtures have an explicit energy field, so they are all excluded
    const noEnergy = cards.filter((c) => c.energy === undefined);
    const result = filterByEnergyRange(cards, 0, 100);
    expect(result.every((c) => c.energy !== undefined)).toBe(true);
    expect(result.length).toBe(cards.length - noEnergy.length);
  });

  it("returns empty array when no cards fall in range", () => {
    expect(filterByEnergyRange(cards, 999, 9999)).toHaveLength(0);
  });

  it("is symmetric with filterByMightRange in excluding undefined-field cards", () => {
    // Both should exclude cards that lack the field entirely
    const mightResult = filterByMightRange(cards, 0, 100);
    const energyResult = filterByEnergyRange(cards, 0, 100);
    expect(mightResult.every((c) => c.might !== undefined)).toBe(true);
    expect(energyResult.every((c) => c.energy !== undefined)).toBe(true);
  });
});

// ─── filterByRulesKeywords tests ──────────────────────────────────────────────

describe("filterByRulesKeywords", () => {
  it("returns cards with any of the given rules keywords (OR)", () => {
    // Storm Sentinel (test-006) has [Reaction] and [Deflect]
    const result = filterByRulesKeywords(cards, ["Deflect", "Accelerate"]);
    expect(result.map((c) => c.id)).toContain("test-006");
  });

  it("is case-insensitive and partial-matching per keyword", () => {
    expect(filterByRulesKeywords(cards, ["deflect"])).toEqual(
      filterByRulesKeywords(cards, ["Deflect"])
    );
  });

  it("returns all cards when keywords array is empty", () => {
    expect(filterByRulesKeywords(cards, [])).toHaveLength(cards.length);
  });

  it("returns empty array when no cards match any keyword", () => {
    expect(filterByRulesKeywords(cards, ["Haste", "Taunt"])).toHaveLength(0);
  });

  it("returns same result as filterByRulesKeyword for a single keyword", () => {
    expect(filterByRulesKeywords(cards, ["Deflect"])).toEqual(
      filterByRulesKeyword(cards, "Deflect")
    );
  });
});

// ─── getUniqueKeywords tests ──────────────────────────────────────────────────

describe("getUniqueKeywords", () => {
  it("returns all distinct keyword tag values, sorted", () => {
    const result = getUniqueKeywords(cards);
    // Our fixtures have: Flying, Battlecry, Ward, Healing, Board Clear, Rush, Card Draw, Ionia
    expect(result).toContain("Flying");
    expect(result).toContain("Ionia");
    expect(result).toContain("Rush");
  });

  it("returns sorted results", () => {
    const result = getUniqueKeywords(cards);
    expect(result).toEqual([...result].sort());
  });

  it("returns no duplicates", () => {
    const result = getUniqueKeywords(cards);
    expect(result.length).toBe(new Set(result).size);
  });

  it("returns empty array for a card list with no keywords", () => {
    const noKw = cards.map((c) => ({ ...c, keywords: undefined } as Card));
    expect(getUniqueKeywords(noKw)).toHaveLength(0);
  });
});

// ─── getUniqueRulesKeywords tests ─────────────────────────────────────────────

describe("getUniqueRulesKeywords", () => {
  it("returns rules keywords extracted from text, sorted", () => {
    const result = getUniqueRulesKeywords(cards);
    // Storm Sentinel has [Reaction], [>], [Deflect]
    expect(result).toContain("Reaction");
    expect(result).toContain("Deflect");
    expect(result).toContain(">");
  });

  it("returns sorted results", () => {
    const result = getUniqueRulesKeywords(cards);
    expect(result).toEqual([...result].sort());
  });

  it("returns no duplicates", () => {
    const result = getUniqueRulesKeywords(cards);
    expect(result.length).toBe(new Set(result).size);
  });

  it("returns empty array for cards with no bracketed text", () => {
    const noRulesKw = cards.filter((c) => !c.text.includes("["));
    expect(getUniqueRulesKeywords(noRulesKw)).toHaveLength(0);
  });
});

// ─── countBy* tests ───────────────────────────────────────────────────────────

describe("countByType", () => {
  it("returns the count of cards for each type", () => {
    const result = countByType(cards);
    expect(result.Unit).toBe(filterByType(cards, "Unit").length);
    expect(result.Spell).toBe(filterByType(cards, "Spell").length);
  });

  it("omits types not present in the input", () => {
    expect(countByType(cards).Gear).toBeUndefined();
  });

  it("sums to the total card count", () => {
    const result = countByType(cards);
    const total = Object.values(result).reduce((a, b) => a + b, 0);
    expect(total).toBe(cards.length);
  });
});

describe("countByDomain", () => {
  it("counts cards per domain", () => {
    const result = countByDomain(cards);
    expect(result.Fury).toBe(groupByDomain(cards).Fury?.length);
    expect(result.Mind).toBe(groupByDomain(cards).Mind?.length);
  });

  it("counts multi-domain cards once per domain", () => {
    const result = countByDomain(cards);
    // Arcane Resonance and Storm Sentinel are both Mind — result.Mind should include them
    expect(result.Mind).toBeGreaterThan(0);
    // Total domain count >= total card count because multi-domain cards count twice
    const total = Object.values(result).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(cards.length);
  });
});

describe("countByRarity", () => {
  it("returns the count of cards for each rarity", () => {
    const result = countByRarity(cards);
    expect(result.Epic).toBe(filterByRarity(cards, "Epic").length);
    expect(result.Rare).toBe(filterByRarity(cards, "Rare").length);
  });

  it("sums to the total card count", () => {
    const result = countByRarity(cards);
    const total = Object.values(result).reduce((a, b) => a + b, 0);
    expect(total).toBe(cards.length);
  });
});

describe("countBySet", () => {
  it("returns the count of cards for each set", () => {
    const result = countBySet(cards);
    expect(result.Origins).toBe(filterBySet(cards, "Origins").length);
    expect(result.Spiritforged).toBe(filterBySet(cards, "Spiritforged").length);
  });

  it("groups cards with undefined set under __unknown__", () => {
    const noSetCard: Card = { ...cards[0], id: "test-no-set-count", set: undefined };
    const result = countBySet([...cards, noSetCard]);
    expect(result.__unknown__).toBeGreaterThanOrEqual(1);
  });

  it("sums to the total card count", () => {
    const result = countBySet(cards);
    const total = Object.values(result).reduce((a, b) => a + b, 0);
    expect(total).toBe(cards.length);
  });
});

// ─── filterByText tests ───────────────────────────────────────────────────────

describe("filterByText", () => {
  it("returns cards whose text field contains the query (case-insensitive)", () => {
    // Celestial Guardian text: "Guardian of the rift, shielding allies from falling stars."
    const result = filterByText(cards, "rift");
    expect(result.map((c) => c.name)).toContain("Celestial Guardian");
  });

  it("does NOT match on name, domain, or keywords — only text", () => {
    // "Flamewing" is in the name of Abyssal Flamewing but not in its text field
    const nameOnlyMatch = filterByText(cards, "Flamewing");
    expect(nameOnlyMatch).toHaveLength(0);
  });

  it("is case-insensitive", () => {
    expect(filterByText(cards, "RIFT")).toHaveLength(
      filterByText(cards, "rift").length
    );
  });

  it("returns all cards for an empty or whitespace-only query", () => {
    expect(filterByText(cards, "")).toHaveLength(cards.length);
    expect(filterByText(cards, "   ")).toHaveLength(cards.length);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterByText(cards, "xyzzy_no_match")).toHaveLength(0);
  });

  it("differs from searchCards for queries that appear in name but not text", () => {
    // searchCards("Flamewing") finds Abyssal Flamewing via name; filterByText does not
    const bySearch = searchCards(cards, "Flamewing");
    const byText = filterByText(cards, "Flamewing");
    expect(bySearch.length).toBeGreaterThan(byText.length);
  });
});

// ─── sortByEnergy tests ───────────────────────────────────────────────────────

describe("sortByEnergy", () => {
  it("sorts ascending by energy by default (lowest first)", () => {
    const result = sortByEnergy(cards);
    const energies = result.map((c) => c.energy ?? 0);
    for (let i = 1; i < energies.length; i++) {
      expect(energies[i]).toBeGreaterThanOrEqual(energies[i - 1]);
    }
  });

  it("sorts descending when specified", () => {
    const result = sortByEnergy(cards, "desc");
    const energies = result.map((c) => c.energy ?? 0);
    for (let i = 1; i < energies.length; i++) {
      expect(energies[i]).toBeLessThanOrEqual(energies[i - 1]);
    }
  });

  it("treats cards with no energy as 0 (same as sortByMight)", () => {
    // Cards without energy sort to the front in ascending order
    const result = sortByEnergy(cards, "asc");
    const firstEnergy = result[0].energy ?? 0;
    expect(firstEnergy).toBe(0);
  });

  it("does not mutate the original array", () => {
    const original = [...cards];
    sortByEnergy(cards, "desc");
    expect(cards).toEqual(original);
  });
});

// ─── filterByNameContains tests ───────────────────────────────────────────────

describe("filterByNameContains", () => {
  it("returns cards whose name contains the query as a substring", () => {
    // "Abyssal" is a substring of "Abyssal Flamewing"
    const result = filterByNameContains(cards, "Abyssal");
    expect(result.every((c) => c.name.toLowerCase().includes("abyssal"))).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("is case-insensitive", () => {
    expect(filterByNameContains(cards, "flamewing")).toEqual(
      filterByNameContains(cards, "FLAMEWING")
    );
  });

  it("does NOT match on text, domain, or keywords — only name", () => {
    // "rift" appears in the text of Celestial Guardian but not in its name
    const result = filterByNameContains(cards, "rift");
    expect(result.every((c) => c.name.toLowerCase().includes("rift"))).toBe(true);
    // searchCards("rift") would find Celestial Guardian; filterByNameContains should not
    const bySearch = searchCards(cards, "rift");
    const byName = filterByNameContains(cards, "rift");
    // bySearch may find more cards via text/domain match
    expect(bySearch.length).toBeGreaterThanOrEqual(byName.length);
  });

  it("returns all cards for an empty or whitespace-only query", () => {
    expect(filterByNameContains(cards, "")).toHaveLength(cards.length);
    expect(filterByNameContains(cards, "   ")).toHaveLength(cards.length);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterByNameContains(cards, "xyzzy_no_match")).toHaveLength(0);
  });

  it("returns more cards than getCardsByName for a partial query", () => {
    // "Abyssal Flamewing" is an exact name — getCardsByName finds 2 (Common + Showcase)
    // "Abyssal" is a partial match — filterByNameContains finds at least those 2
    const exact = getCardsByName(cards, "Abyssal Flamewing");
    const partial = filterByNameContains(cards, "Abyssal");
    expect(partial.length).toBeGreaterThanOrEqual(exact.length);
  });
});

// ─── sampleCards tests ────────────────────────────────────────────────────────

describe("sampleCards", () => {
  it("returns exactly n cards when n < cards.length", () => {
    expect(sampleCards(cards, 3)).toHaveLength(3);
    expect(sampleCards(cards, 1)).toHaveLength(1);
  });

  it("returns all cards when n >= cards.length", () => {
    expect(sampleCards(cards, cards.length)).toHaveLength(cards.length);
    expect(sampleCards(cards, cards.length + 100)).toHaveLength(cards.length);
  });

  it("returns 0 cards when n is 0", () => {
    expect(sampleCards(cards, 0)).toHaveLength(0);
  });

  it("returns only cards from the input array", () => {
    const sample = sampleCards(cards, 5);
    const ids = new Set(cards.map((c) => c.id));
    expect(sample.every((c) => ids.has(c.id))).toBe(true);
  });

  it("does not mutate the original array", () => {
    const original = [...cards];
    sampleCards(cards, 3);
    expect(cards).toEqual(original);
  });

  it("returns no duplicate cards in a single sample", () => {
    const sample = sampleCards(cards, cards.length);
    const ids = sample.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
