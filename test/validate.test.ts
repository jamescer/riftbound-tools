import { describe, expect, it } from "vitest";
import { validateCard } from "../src/utils/validate";

// Minimal valid card object — used as the base for mutation tests below.
const validCard = {
  id: "ogn-001",
  name: "Blazing Scorcher",
  type: "Unit",
  rarity: "Common",
  cost: 5,
  text: "Some ability text.",
  setCode: "OGN",
  abilities: ["Some ability text."],
};

function withField(key: string, value: unknown): Record<string, unknown> {
  return { ...validCard, [key]: value };
}

function withoutField(key: string): Record<string, unknown> {
  const copy = { ...validCard } as Record<string, unknown>;
  delete copy[key];
  return copy;
}

// ─── passes for valid cards ───────────────────────────────────────────────────

describe("validateCard — valid inputs", () => {
  it("accepts a fully-populated minimal card", () => {
    expect(validateCard(validCard)).toBe(true);
  });

  it("accepts a card with all optional fields present", () => {
    const card = {
      ...validCard,
      energy: 5,
      might: 3,
      power: 1,
      domain: ["Fury", "Mind"],
      imageUrl: "https://example.com/card.png",
      set: "Origins",
      keywords: ["Dragon"],
      collectible: true,
      ability: "Some ability text.",
      tags: ["Dragon"],
    };
    expect(validateCard(card)).toBe(true);
  });

  it("accepts a card with no optional fields", () => {
    expect(validateCard(validCard)).toBe(true);
  });

  it("accepts all valid CardType values", () => {
    for (const type of ["Unit", "Spell", "Gear", "Rune", "Battlefield", "Legend"]) {
      expect(validateCard({ ...validCard, type }), `type: ${type}`).toBe(true);
    }
  });

  it("accepts all valid CardRarity values", () => {
    for (const rarity of ["Common", "Uncommon", "Rare", "Epic", "Showcase", "Ultimate"]) {
      expect(validateCard({ ...validCard, rarity }), `rarity: ${rarity}`).toBe(true);
    }
  });

  it("accepts all valid CardDomain values in domain array", () => {
    for (const domain of ["Fury", "Calm", "Mind", "Body", "Chaos", "Order", "Colorless"]) {
      expect(validateCard({ ...validCard, domain: [domain] }), `domain: ${domain}`).toBe(true);
    }
  });

  it("accepts all valid CardSet values", () => {
    for (const set of ["Origins", "Spiritforged", "Unleashed", "Vendetta", "Radiance"]) {
      expect(validateCard({ ...validCard, set }), `set: ${set}`).toBe(true);
    }
  });

  it("accepts cost of 0", () => {
    expect(validateCard({ ...validCard, cost: 0 })).toBe(true);
  });

  it("accepts empty abilities array", () => {
    expect(validateCard({ ...validCard, abilities: [] })).toBe(true);
  });

  it("accepts empty text string", () => {
    expect(validateCard({ ...validCard, text: "" })).toBe(true);
  });
});

// ─── rejects non-objects ──────────────────────────────────────────────────────

describe("validateCard — non-object inputs", () => {
  it("rejects null", () => expect(validateCard(null)).toBe(false));
  it("rejects undefined", () => expect(validateCard(undefined)).toBe(false));
  it("rejects a number", () => expect(validateCard(42)).toBe(false));
  it("rejects a string", () => expect(validateCard("card")).toBe(false));
  it("rejects an array", () => expect(validateCard([])).toBe(false));
});

// ─── rejects missing required fields ─────────────────────────────────────────

describe("validateCard — missing required fields", () => {
  it("rejects missing id", () => expect(validateCard(withoutField("id"))).toBe(false));
  it("rejects missing name", () => expect(validateCard(withoutField("name"))).toBe(false));
  it("rejects missing type", () => expect(validateCard(withoutField("type"))).toBe(false));
  it("rejects missing rarity", () => expect(validateCard(withoutField("rarity"))).toBe(false));
  it("rejects missing cost", () => expect(validateCard(withoutField("cost"))).toBe(false));
  it("rejects missing text", () => expect(validateCard(withoutField("text"))).toBe(false));
  it("rejects missing setCode", () => expect(validateCard(withoutField("setCode"))).toBe(false));
  it("rejects missing abilities", () => expect(validateCard(withoutField("abilities"))).toBe(false));
});

// ─── rejects empty required string fields ────────────────────────────────────

describe("validateCard — empty required strings", () => {
  it("rejects empty id", () => expect(validateCard(withField("id", ""))).toBe(false));
  it("rejects empty name", () => expect(validateCard(withField("name", ""))).toBe(false));
  it("rejects empty setCode", () => expect(validateCard(withField("setCode", ""))).toBe(false));
});

// ─── rejects wrong types for required fields ──────────────────────────────────

describe("validateCard — wrong types for required fields", () => {
  it("rejects non-string id", () => expect(validateCard(withField("id", 123))).toBe(false));
  it("rejects non-string name", () => expect(validateCard(withField("name", true))).toBe(false));
  it("rejects non-string type", () => expect(validateCard(withField("type", 1))).toBe(false));
  it("rejects non-string rarity", () => expect(validateCard(withField("rarity", null))).toBe(false));
  it("rejects non-number cost", () => expect(validateCard(withField("cost", "5"))).toBe(false));
  it("rejects non-string text", () => expect(validateCard(withField("text", 0))).toBe(false));
  it("rejects non-array abilities", () => expect(validateCard(withField("abilities", "ability"))).toBe(false));
  it("rejects abilities array containing a non-string", () =>
    expect(validateCard(withField("abilities", [1, "valid"]))).toBe(false));
});

// ─── rejects invalid enum values ─────────────────────────────────────────────

describe("validateCard — invalid enum values", () => {
  it("rejects unknown type", () => expect(validateCard(withField("type", "Minion"))).toBe(false));
  it("rejects unknown rarity", () => expect(validateCard(withField("rarity", "Legendary"))).toBe(false));
  it("rejects unknown set", () => expect(validateCard(withField("set", "Season2"))).toBe(false));
  it("rejects unknown domain value in domain array", () =>
    expect(validateCard(withField("domain", ["Fury", "Dark"]))).toBe(false));
});

// ─── validates optional fields strictly when present ─────────────────────────

describe("validateCard — optional field type checks", () => {
  it("rejects non-number energy", () => expect(validateCard(withField("energy", "5"))).toBe(false));
  it("rejects non-number might", () => expect(validateCard(withField("might", "3"))).toBe(false));
  it("rejects non-number power", () => expect(validateCard(withField("power", true))).toBe(false));
  it("rejects non-string imageUrl", () => expect(validateCard(withField("imageUrl", 123))).toBe(false));
  it("rejects non-array domain", () => expect(validateCard(withField("domain", "Fury"))).toBe(false));
  it("rejects non-array keywords", () => expect(validateCard(withField("keywords", "Dragon"))).toBe(false));
  it("rejects keywords array with non-string element", () =>
    expect(validateCard(withField("keywords", [42]))).toBe(false));
  it("rejects tags array with non-string element", () =>
    expect(validateCard(withField("tags", [null]))).toBe(false));

  // undefined means "absent" — must pass
  it("accepts undefined energy", () => expect(validateCard(withField("energy", undefined))).toBe(true));
  it("accepts undefined might", () => expect(validateCard(withField("might", undefined))).toBe(true));
  it("accepts undefined domain", () => expect(validateCard(withField("domain", undefined))).toBe(true));
  it("accepts undefined set", () => expect(validateCard(withField("set", undefined))).toBe(true));
  it("accepts undefined keywords", () => expect(validateCard(withField("keywords", undefined))).toBe(true));
  it("accepts undefined imageUrl", () => expect(validateCard(withField("imageUrl", undefined))).toBe(true));
});
