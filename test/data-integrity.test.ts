import { describe, expect, it } from "vitest";
import { cards } from "../src/data/cards";
import { validateCard, validDomains, validRarities, validSets, validTypes } from "../src/utils/validate";

/**
 * These tests validate the shape and consistency of the real src/data/cards.json
 * dataset, not the utility functions. They exist to catch schema drift — e.g.
 * a CSV update introduces an unrecognized type or rarity — before it ships.
 */
describe("cards.json data integrity", () => {
  it("has a non-empty dataset", () => {
    expect(cards.length).toBeGreaterThan(0);
  });

  it("every card passes validateCard", () => {
    const invalid = cards.filter((c) => !validateCard(c));
    expect(invalid).toHaveLength(0);
  });

  it("every card id is a non-empty string", () => {
    const bad = cards.filter((c) => typeof c.id !== "string" || c.id === "");
    expect(bad).toHaveLength(0);
  });

  it("every card name is a non-empty string", () => {
    const bad = cards.filter((c) => typeof c.name !== "string" || c.name === "");
    expect(bad).toHaveLength(0);
  });

  it("all card ids are unique", () => {
    const ids = cards.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all types are recognized CardType values", () => {
    const unknown = cards.filter((c) => !validTypes.has(c.type));
    expect(unknown.map((c) => `${c.id}: "${c.type}"`)).toHaveLength(0);
  });

  it("all rarities are recognized CardRarity values", () => {
    const unknown = cards.filter((c) => !validRarities.has(c.rarity));
    expect(unknown.map((c) => `${c.id}: "${c.rarity}"`)).toHaveLength(0);
  });

  it("all set values are recognized CardSet values (where present)", () => {
    const unknown = cards.filter((c) => c.set !== undefined && !validSets.has(c.set));
    expect(unknown.map((c) => `${c.id}: "${c.set}"`)).toHaveLength(0);
  });

  it("all domain values are recognized CardDomain values", () => {
    const unknown = cards.flatMap((c) =>
      (c.domain ?? []).filter((d) => !validDomains.has(d)).map((d) => `${c.id}: "${d}"`)
    );
    expect(unknown).toHaveLength(0);
  });

  it("every card has a non-empty setCode", () => {
    const bad = cards.filter((c) => typeof c.setCode !== "string" || c.setCode === "");
    expect(bad).toHaveLength(0);
  });

  it("setCode is consistent with the id prefix", () => {
    const mismatched = cards.filter((c) => {
      const expectedCode = c.id.split("-")[0]?.toUpperCase();
      return c.setCode !== expectedCode;
    });
    expect(mismatched.map((c) => `${c.id} → setCode "${c.setCode}"`)).toHaveLength(0);
  });

  it("every card cost is a finite number", () => {
    const bad = cards.filter((c) => typeof c.cost !== "number" || !Number.isFinite(c.cost));
    expect(bad).toHaveLength(0);
  });

  it("every card abilities field is an array of strings", () => {
    const bad = cards.filter(
      (c) =>
        !Array.isArray(c.abilities) || c.abilities.some((a) => typeof a !== "string")
    );
    expect(bad).toHaveLength(0);
  });

  // ── per-type field relationship invariants ──────────────────────────────────
  // These encode observed facts about the CSV schema. If any of these fail after
  // a CSV update, it means the data model or import logic needs revisiting.

  it("every Unit has an energy value set", () => {
    const bad = cards.filter((c) => c.type === "Unit" && c.energy === undefined);
    expect(bad.map((c) => c.id)).toHaveLength(0);
  });

  it("no Spell has an energy value set", () => {
    const bad = cards.filter((c) => c.type === "Spell" && c.energy !== undefined);
    expect(bad.map((c) => c.id)).toHaveLength(0);
  });

  it("no Gear has an energy value set", () => {
    const bad = cards.filter((c) => c.type === "Gear" && c.energy !== undefined);
    expect(bad.map((c) => c.id)).toHaveLength(0);
  });

  it("no Rune, Battlefield, or Legend has an energy value set", () => {
    const bad = cards.filter(
      (c) =>
        (c.type === "Rune" || c.type === "Battlefield" || c.type === "Legend") &&
        c.energy !== undefined
    );
    expect(bad.map((c) => c.id)).toHaveLength(0);
  });

  it("every Rune, Battlefield, and Legend has cost 0", () => {
    const bad = cards.filter(
      (c) =>
        (c.type === "Rune" || c.type === "Battlefield" || c.type === "Legend") &&
        c.cost !== 0
    );
    expect(bad.map((c) => `${c.id}: cost ${c.cost}`)).toHaveLength(0);
  });

  it("for Units, cost equals energy", () => {
    // cost = energy ?? might ?? 0; since all Units have energy, cost must equal energy
    const bad = cards.filter(
      (c) => c.type === "Unit" && c.energy !== undefined && c.cost !== c.energy
    );
    expect(bad.map((c) => `${c.id}: cost ${c.cost} energy ${c.energy}`)).toHaveLength(0);
  });

  it("no card has a tags field (deprecated field was removed from cards.json)", () => {
    const withTags = cards.filter((c) => (c as Record<string, unknown>).tags !== undefined);
    expect(withTags.map((c) => c.id)).toHaveLength(0);
  });
});
