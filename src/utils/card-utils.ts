import { Card, CardDomain, CardRarity, CardSet, CardType } from "../models/card";

export type DomainFilterMode = "any" | "all";

export const filterByDomain = (cards: Card[], domain: CardDomain): Card[] =>
  cards.filter((card) => (card.domain ?? []).includes(domain));

/**
 * Filter by multiple domains at once.
 * - `mode: "any"` (default) — card must belong to at least one of the given domains (OR).
 * - `mode: "all"` — card must belong to every given domain (AND), useful for deckbuilding
 *   constraints where you want cards that span specific domain combinations.
 */
export const filterByDomains = (
  cards: Card[],
  domains: CardDomain[],
  mode: DomainFilterMode = "any"
): Card[] => {
  if (domains.length === 0) return cards;
  const domainSet = new Set(domains);
  return cards.filter((card) => {
    const cardDomains = card.domain ?? [];
    return mode === "all"
      ? domains.every((d) => cardDomains.includes(d))
      : cardDomains.some((d) => domainSet.has(d));
  });
};

export const filterByRarity = (cards: Card[], rarity: CardRarity): Card[] =>
  cards.filter((card) => card.rarity === rarity);

export const filterByType = (cards: Card[], type: CardType): Card[] =>
  cards.filter((card) => card.type === type);

export const filterBySet = (cards: Card[], set: CardSet): Card[] =>
  cards.filter((card) => card.set === set);

export const filterBySetCode = (cards: Card[], setCode: string): Card[] =>
  cards.filter((card) => card.setCode === setCode);

export const filterByKeyword = (cards: Card[], keyword: string): Card[] => {
  const normalized = keyword.trim().toLowerCase();
  return cards.filter((card) => (card.keywords ?? []).some((kw) => kw.toLowerCase() === normalized));
};

export const filterByCollectible = (cards: Card[], collectible = true): Card[] =>
  cards.filter((card) => (card.collectible ?? true) === collectible);

export const filterByCostRange = (cards: Card[], min: number, max: number): Card[] =>
  cards.filter((card) => card.cost >= min && card.cost <= max);

/**
 * Filter cards whose `might` stat falls within [min, max] inclusive.
 * Cards with no `might` value (non-Unit types) are excluded.
 */
export const filterByMightRange = (cards: Card[], min: number, max: number): Card[] =>
  cards.filter((card) => card.might !== undefined && card.might >= min && card.might <= max);

export const sortByCost = (cards: Card[], direction: "asc" | "desc" = "asc"): Card[] =>
  [...cards].sort((a, b) => (direction === "asc" ? a.cost - b.cost : b.cost - a.cost));

export const sortByMight = (cards: Card[], direction: "asc" | "desc" = "desc"): Card[] =>
  [...cards].sort((a, b) => {
    const aValue = a.might ?? 0;
    const bValue = b.might ?? 0;
    return direction === "asc" ? aValue - bValue : bValue - aValue;
  });

export const sortByName = (cards: Card[], direction: "asc" | "desc" = "asc"): Card[] =>
  [...cards].sort((a, b) => {
    const cmp = a.name.localeCompare(b.name);
    return direction === "asc" ? cmp : -cmp;
  });

export const searchCards = (cards: Card[], query: string): Card[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return cards;

  return cards.filter((card) => {
    const haystack = [
      card.name,
      card.text,
      card.set,         // optional — filtered below so it never becomes the string "undefined"
      card.setCode,
      ...(card.domain ?? []),
      ...card.abilities,
      ...(card.keywords ?? []),
    ]
      .filter((s): s is string => typeof s === "string")
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
};

export const getCardById = (cards: Card[], id: string): Card | undefined =>
  cards.find((card) => card.id === id);

/**
 * Return all cards whose name matches the query (case-insensitive, exact match).
 * Multiple results occur when a card has several printings (e.g. Common + Showcase).
 */
export const getCardsByName = (cards: Card[], name: string): Card[] => {
  const normalized = name.trim().toLowerCase();
  return cards.filter((card) => card.name.toLowerCase() === normalized);
};

/**
 * Extract rules keywords from a card's `text` field.
 * Rules keywords are wrapped in square brackets in the card text, e.g. `[Accelerate]`,
 * `[Deflect]`, `[Reaction]`. This is distinct from the `keywords` field on the card,
 * which contains region/champion tags like `"Ionia"` or `"Dragon"`.
 *
 * HTML entities in the bracket content are decoded (`&gt;` → `>`, `&lt;` → `<`, `&amp;` → `&`).
 */
export const extractRulesKeywords = (card: Card): string[] => {
  const matches = card.text.match(/\[([^\]]+)\]/g) ?? [];
  return matches
    .map((m) => m.slice(1, -1)) // strip [ ]
    .map((kw) =>
      kw
        .replace(/&gt;/g, ">")
        .replace(/&lt;/g, "<")
        .replace(/&amp;/g, "&")
    );
};

/**
 * Filter cards that contain a given rules keyword in their `text` field.
 * Case-insensitive, partial match — so `"Assault"` matches both `[Assault]` and `[Assault 2]`.
 */
export const filterByRulesKeyword = (cards: Card[], keyword: string): Card[] => {
  const normalized = keyword.trim().toLowerCase();
  return cards.filter((card) =>
    extractRulesKeywords(card).some((kw) => kw.toLowerCase().includes(normalized))
  );
};

export const groupByType = (cards: Card[]): Partial<Record<CardType, Card[]>> =>
  cards.reduce<Partial<Record<CardType, Card[]>>>((acc, card) => {
    (acc[card.type] ??= []).push(card);
    return acc;
  }, {});

export const groupByDomain = (cards: Card[]): Partial<Record<CardDomain, Card[]>> =>
  cards.reduce<Partial<Record<CardDomain, Card[]>>>((acc, card) => {
    for (const domain of card.domain ?? []) {
      (acc[domain] ??= []).push(card);
    }
    return acc;
  }, {});
