import { Card, CardDomain, CardRarity, CardSet, CardType } from "../models/card";

export const filterByDomain = (cards: Card[], domain: CardDomain): Card[] =>
  cards.filter((card) => (card.domain ?? []).includes(domain));

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
  return cards.filter((card) => (card.keywords ?? []).some((keyword) => keyword.toLowerCase() === normalized));
};

export const sortByCost = (cards: Card[], direction: "asc" | "desc" = "asc"): Card[] =>
  [...cards].sort((a, b) => (direction === "asc" ? a.cost - b.cost : b.cost - a.cost));

export const sortByMight = (cards: Card[], direction: "asc" | "desc" = "desc"): Card[] =>
  [...cards].sort((a, b) => {
    const aValue = a.might ?? 0;
    const bValue = b.might ?? 0;
    return direction === "asc" ? aValue - bValue : bValue - aValue;
  });

export const searchCards = (cards: Card[], query: string): Card[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return cards;

  return cards.filter((card) => {
    const haystack = [card.name, card.text, card.set, card.setCode, ...card.abilities, ...(card.keywords ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
};

export const getCardById = (cards: Card[], id: string): Card | undefined =>
  cards.find((card) => card.id === id);
