import { Card, CardDomain, CardRarity, CardSet, CardType } from "../models/card";

export const validDomains = new Set<CardDomain>(["Fury", "Calm", "Mind", "Body", "Chaos", "Order", "Colorless"]);
export const validTypes = new Set<CardType>(["Unit", "Spell", "Gear", "Rune", "Battlefield", "Legend"]);
export const validRarities = new Set<CardRarity>(["Common", "Uncommon", "Rare", "Epic", "Showcase", "Ultimate"]);
export const validSets = new Set<CardSet>(["Origins", "Spiritforged", "Unleashed", "Vendetta", "Radiance"]);

/**
 * Runtime type-guard for the `Card` shape. Returns `true` if `card` has all
 * required fields with the right types and recognized enum values.
 *
 * Useful for validating card data received from external sources before
 * passing it to the utility functions in this package.
 */
export function validateCard(card: unknown): card is Card {
  if (typeof card !== "object" || card === null) return false;
  const c = card as Record<string, unknown>;
  return (
    typeof c.id === "string" && c.id !== "" &&
    typeof c.name === "string" && c.name !== "" &&
    typeof c.type === "string" && validTypes.has(c.type as CardType) &&
    typeof c.rarity === "string" && validRarities.has(c.rarity as CardRarity) &&
    typeof c.cost === "number" &&
    typeof c.text === "string" &&
    typeof c.setCode === "string" && c.setCode !== "" &&
    Array.isArray(c.abilities) && c.abilities.every((item) => typeof item === "string") &&
    (c.set === undefined || validSets.has(c.set as CardSet)) &&
    (c.energy === undefined || typeof c.energy === "number") &&
    (c.might === undefined || typeof c.might === "number") &&
    (c.power === undefined || typeof c.power === "number") &&
    (c.imageUrl === undefined || typeof c.imageUrl === "string") &&
    (c.domain === undefined || (Array.isArray(c.domain) && c.domain.every((item) => validDomains.has(item as CardDomain)))) &&
    (c.tags === undefined || (Array.isArray(c.tags) && c.tags.every((item) => typeof item === "string"))) &&
    (c.keywords === undefined || (Array.isArray(c.keywords) && c.keywords.every((item) => typeof item === "string")))
  );
}
