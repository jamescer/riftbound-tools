import { Card, CardDomain, CardRarity, CardSet, CardType } from "../models/card";

export type DomainFilterMode = "any" | "all";

/**
 * A function that takes a `Card[]` and returns a filtered `Card[]`.
 * Used as the unit of composition for `composeFilters`.
 */
export type CardFilter = (cards: Card[]) => Card[];

/**
 * The result of a `paginateCards` call.
 * `page` and `pageSize` echo the inputs for easy pass-through to UI components.
 * `totalPages` is `Math.ceil(total / pageSize)`, or `0` when `total` is `0`.
 */
export interface CardPage {
  items: Card[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Numeric aggregate stats for a single field across a set of cards. */
export interface CardFieldStats {
  min: number;
  max: number;
  avg: number;
  /** Number of cards in the input that actually have this field defined. */
  count: number;
}

/**
 * Aggregate statistics returned by `getCardStats`.
 * `cost` covers all cards (it's always defined). `energy` and `might` only count
 * cards where the field is present (`count` tells you how many that is).
 */
export interface CardStats {
  total: number;
  cost: CardFieldStats;
  energy: CardFieldStats;
  might: CardFieldStats;
}

/**
 * Numeric ordering for rarities, used by `sortByRarity`.
 * Common (0) → Uncommon (1) → Rare (2) → Epic (3) → Showcase (4) → Ultimate (5).
 */
export const rarityOrder: Record<CardRarity, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Showcase: 4,
  Ultimate: 5,
};

/**
 * Chronological release ordering for sets, used by `sortBySet`.
 * Origins (0) → Spiritforged (1) → Unleashed (2) → Vendetta (3) → Radiance (4).
 * Cards with an unknown `set` (`undefined`) sort last regardless of direction.
 */
export const setOrder: Partial<Record<CardSet, number>> = {
  Origins: 0,
  Spiritforged: 1,
  Unleashed: 2,
  Vendetta: 3,
  Radiance: 4,
};

// ─── filter by single field ───────────────────────────────────────────────────

/**
 * Keep cards whose `domain` array includes the given domain.
 * Cards with no `domain` field are always excluded.
 */
export const filterByDomain = (cards: Card[], domain: CardDomain): Card[] =>
  cards.filter((card) => (card.domain ?? []).includes(domain));

/**
 * Filter by multiple domains at once.
 * - `mode: "any"` (default) — card must belong to at least one of the given domains (OR).
 * - `mode: "all"` — card must belong to every given domain (AND), useful for deckbuilding
 *   constraints where you want cards that span specific domain combinations.
 *
 * An empty `domains` array returns the input unchanged.
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

/** Keep cards with the given rarity. */
export const filterByRarity = (cards: Card[], rarity: CardRarity): Card[] =>
  cards.filter((card) => card.rarity === rarity);

/**
 * Keep cards whose rarity is in the provided list (OR).
 * An empty `rarities` array returns the input unchanged.
 */
export const filterByRarities = (cards: Card[], rarities: CardRarity[]): Card[] => {
  if (rarities.length === 0) return cards;
  const set = new Set(rarities);
  return cards.filter((card) => set.has(card.rarity));
};

/** Keep cards with the given type. */
export const filterByType = (cards: Card[], type: CardType): Card[] =>
  cards.filter((card) => card.type === type);

/**
 * Keep cards whose type is in the provided list (OR).
 * An empty `types` array returns the input unchanged.
 */
export const filterByTypes = (cards: Card[], types: CardType[]): Card[] => {
  if (types.length === 0) return cards;
  const set = new Set(types);
  return cards.filter((card) => set.has(card.type));
};

/**
 * Keep cards from the given set.
 * Cards where `set` is `undefined` (unknown set code) are always excluded.
 */
export const filterBySet = (cards: Card[], set: CardSet): Card[] =>
  cards.filter((card) => card.set === set);

/**
 * Keep cards whose set is in the provided list (OR).
 * Cards where `set` is `undefined` (unknown set code) are always excluded.
 * An empty `sets` array returns the input unchanged.
 */
export const filterBySets = (cards: Card[], sets: CardSet[]): Card[] => {
  if (sets.length === 0) return cards;
  const setValues = new Set(sets);
  return cards.filter((card) => card.set !== undefined && setValues.has(card.set));
};

/**
 * Keep cards whose `setCode` exactly matches the given string (e.g. `"OGN"`).
 * Unlike `filterBySet`, this works even when the set code isn't in the known `CardSet` map,
 * and it's case-sensitive — set codes in the data are always uppercase.
 */
export const filterBySetCode = (cards: Card[], setCode: string): Card[] =>
  cards.filter((card) => card.setCode === setCode);

/**
 * Keep cards whose `setCode` is in the provided list (OR).
 * Case-sensitive — set codes in the data are always uppercase.
 * Unlike `filterBySets`, this works even when a set code isn't in the known `CardSet` map.
 * An empty `setCodes` array returns the input unchanged.
 */
export const filterBySetCodes = (cards: Card[], setCodes: string[]): Card[] => {
  if (setCodes.length === 0) return cards;
  const setCodeSet = new Set(setCodes);
  return cards.filter((card) => setCodeSet.has(card.setCode));
};

/**
 * Keep cards whose `keywords` array contains an exact match for `keyword`.
 * Case-insensitive, trims whitespace. Note: `keywords` holds region/champion tags
 * (e.g. `"Ionia"`, `"Dragon"`) — not rules keywords like `[Deflect]`. For rules
 * keywords, use `filterByRulesKeyword`.
 */
export const filterByKeyword = (cards: Card[], keyword: string): Card[] => {
  const normalized = keyword.trim().toLowerCase();
  return cards.filter((card) => (card.keywords ?? []).some((kw) => kw.toLowerCase() === normalized));
};

/**
 * Keep cards whose `keywords` array contains at least one of the given values (OR).
 * Case-insensitive exact match per keyword. An empty `keywords` array returns the
 * input unchanged.
 */
export const filterByKeywords = (cards: Card[], keywords: string[]): Card[] => {
  if (keywords.length === 0) return cards;
  const normalized = new Set(keywords.map((k) => k.trim().toLowerCase()));
  return cards.filter((card) =>
    (card.keywords ?? []).some((kw) => normalized.has(kw.toLowerCase()))
  );
};

/**
 * Keep cards whose `collectible` value matches the argument.
 * Defaults to `true` (return only collectible cards). Cards where `collectible` is
 * `undefined` are treated as collectible — in the current dataset all real cards
 * have `collectible: undefined` because the CSV importer never sets it.
 */
export const filterByCollectible = (cards: Card[], collectible = true): Card[] =>
  cards.filter((card) => (card.collectible ?? true) === collectible);

/**
 * Keep cards whose derived `cost` field falls within `[min, max]` inclusive.
 * `cost` = `energy ?? might ?? 0` — see data-model.md for the exact derivation.
 * Prefer `filterByEnergyRange` (Units) or `filterByMightRange` (Spells/Gear) when
 * you care about the underlying play-cost field rather than the derived value.
 */
export const filterByCostRange = (cards: Card[], min: number, max: number): Card[] =>
  cards.filter((card) => card.cost >= min && card.cost <= max);

/**
 * Keep cards whose `might` stat falls within `[min, max]` inclusive.
 * Cards with no `might` value are always excluded. For Units, `might` is a combat
 * stat separate from `energy`; for Spells/Gear, `might` is the play cost.
 */
export const filterByMightRange = (cards: Card[], min: number, max: number): Card[] =>
  cards.filter((card) => card.might !== undefined && card.might >= min && card.might <= max);

/**
 * Keep cards whose `energy` cost falls within `[min, max]` inclusive.
 * Cards with no `energy` value (Legends, Battlefields, Runes, Spells, Gear) are
 * always excluded — `energy` is Unit-only in the current dataset.
 * Use `filterByCostRange` if you want to include non-Unit types via the derived `cost` field.
 */
export const filterByEnergyRange = (cards: Card[], min: number, max: number): Card[] =>
  cards.filter((card) => card.energy !== undefined && card.energy >= min && card.energy <= max);

/**
 * Keep cards that have an `energy` value defined (i.e. Units in the current dataset).
 * More ergonomic than `filterByType(cards, "Unit")` when you care about the field
 * rather than the type, and correctly handles any future card type that also gains energy.
 */
export const filterByEnergyExists = (cards: Card[]): Card[] =>
  cards.filter((card) => card.energy !== undefined);

/**
 * Keep cards that have a `might` value defined.
 * Includes Units (where `might` is a combat stat) and costed Spells/Gear (where
 * `might` doubles as play cost). More ergonomic than `filterByMightRange(cards, 0, Infinity)`.
 */
export const filterByMightExists = (cards: Card[]): Card[] =>
  cards.filter((card) => card.might !== undefined);

/**
 * Keep cards that have (or lack) an `imageUrl`.
 * Defaults to `true` (keep only cards that have an image URL set).
 * Pass `false` to find cards missing art — useful for auditing incomplete data.
 *
 * @example
 * filterByImageUrl(cards);        // cards with art
 * filterByImageUrl(cards, false); // cards missing art
 */
export const filterByImageUrl = (cards: Card[], hasImage = true): Card[] =>
  cards.filter(
    (card) => (card.imageUrl !== undefined && card.imageUrl !== "") === hasImage
  );

// ─── filter composition ───────────────────────────────────────────────────────

/**
 * Compose multiple `CardFilter` functions into a single reusable filter.
 * Filters are applied left-to-right; each receives the output of the previous.
 * An empty argument list returns an identity filter (returns the input unchanged).
 *
 * @example
 * const aggroUnits = composeFilters(
 *   (c) => filterByType(c, "Unit"),
 *   (c) => filterByDomain(c, "Fury"),
 *   (c) => filterByCostRange(c, 1, 3),
 * );
 * aggroUnits(cards); // equivalent to the nested call, but reusable
 */
export const composeFilters = (...filters: CardFilter[]): CardFilter =>
  (cards: Card[]) => filters.reduce((acc, fn) => fn(acc), cards);

// ─── text search ──────────────────────────────────────────────────────────────

/**
 * Case-insensitive substring search within the `text` field only.
 * Unlike `searchCards`, this does not search `name`, `domain`, `abilities`, or `keywords` —
 * useful when you want to match rules text specifically (e.g. `"draw 2 cards"`).
 * An empty/whitespace-only query returns the input unchanged.
 */
export const filterByText = (cards: Card[], query: string): Card[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return cards;
  return cards.filter((card) => card.text.toLowerCase().includes(normalized));
};

/**
 * Full-text search across `name`, `text`, `set`, `setCode`, `domain`, `abilities`,
 * and `keywords`. Case-insensitive substring match on the joined haystack.
 * An empty/whitespace-only query returns the input unchanged.
 *
 * For narrower searches, prefer the focused variants:
 * - `filterByNameContains` — name only
 * - `filterByText` — text/rules only
 * - `filterByRulesKeyword` — bracketed keyword in text
 */
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

// ─── sort ─────────────────────────────────────────────────────────────────────

/**
 * Sort by the derived `cost` field (`energy ?? might ?? 0`) ascending by default.
 * Ties are broken alphabetically by `name` for stable, deterministic output.
 * Returns a new array; does not mutate the input.
 */
export const sortByCost = (cards: Card[], direction: "asc" | "desc" = "asc"): Card[] =>
  [...cards].sort((a, b) => {
    const diff = direction === "asc" ? a.cost - b.cost : b.cost - a.cost;
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

/**
 * Sort by `might`, treating cards with no `might` as `0`.
 * Defaults to descending (highest combat stat first) — pass `"asc"` to reverse.
 * Ties are broken alphabetically by `name` for stable, deterministic output.
 * Returns a new array; does not mutate the input.
 */
export const sortByMight = (cards: Card[], direction: "asc" | "desc" = "desc"): Card[] =>
  [...cards].sort((a, b) => {
    const diff = direction === "asc"
      ? (a.might ?? 0) - (b.might ?? 0)
      : (b.might ?? 0) - (a.might ?? 0);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

/**
 * Sort alphabetically by `name` using `localeCompare`, ascending by default.
 * Returns a new array; does not mutate the input.
 */
export const sortByName = (cards: Card[], direction: "asc" | "desc" = "asc"): Card[] =>
  [...cards].sort((a, b) => {
    const cmp = a.name.localeCompare(b.name);
    return direction === "asc" ? cmp : -cmp;
  });

/**
 * Sort by rarity tier using `rarityOrder` (Common → Uncommon → Rare → Epic → Showcase → Ultimate).
 * Default `"asc"` puts commons first; `"desc"` puts rarest first.
 * Ties (same rarity) are broken alphabetically by `name` for stable, deterministic output.
 * Returns a new array; does not mutate the input.
 */
export const sortByRarity = (cards: Card[], direction: "asc" | "desc" = "asc"): Card[] =>
  [...cards].sort((a, b) => {
    const diff = direction === "asc"
      ? rarityOrder[a.rarity] - rarityOrder[b.rarity]
      : rarityOrder[b.rarity] - rarityOrder[a.rarity];
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

/**
 * Sort by `energy` cost, treating cards with no `energy` as `0`, ascending by default.
 * Since only Units carry `energy` in the current dataset, consider applying
 * `filterByType(cards, "Unit")` first for a pure Unit cost-curve sort.
 * Ties are broken alphabetically by `name` for stable, deterministic output.
 * Returns a new array; does not mutate the input.
 */
export const sortByEnergy = (cards: Card[], direction: "asc" | "desc" = "asc"): Card[] =>
  [...cards].sort((a, b) => {
    const diff = direction === "asc"
      ? (a.energy ?? 0) - (b.energy ?? 0)
      : (b.energy ?? 0) - (a.energy ?? 0);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

/**
 * Sort by set in chronological release order using `setOrder`
 * (Origins → Spiritforged → Unleashed → Vendetta → Radiance).
 * Default `"asc"` puts oldest set first; `"desc"` puts newest first.
 * Cards with an unknown `set` sort last regardless of direction.
 * Ties (same set) are broken alphabetically by `name` for stable, deterministic output.
 * Returns a new array; does not mutate the input.
 */
export const sortBySet = (cards: Card[], direction: "asc" | "desc" = "asc"): Card[] => {
  const unknownOrder = direction === "asc" ? Infinity : -Infinity;
  return [...cards].sort((a, b) => {
    const aOrder = a.set !== undefined ? (setOrder[a.set] ?? unknownOrder) : unknownOrder;
    const bOrder = b.set !== undefined ? (setOrder[b.set] ?? unknownOrder) : unknownOrder;
    const diff = direction === "asc" ? aOrder - bOrder : bOrder - aOrder;
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
};

// ─── lookup ───────────────────────────────────────────────────────────────────

/**
 * Return the card with the given `id`, or `undefined` if not found.
 * IDs are formatted `<set-code-lowercase>-<number>`, e.g. `"ogn-001"`.
 */
export const getCardById = (cards: Card[], id: string): Card | undefined =>
  cards.find((card) => card.id === id);

/**
 * Return all cards whose `id` is in the given list. Preserves the order of the
 * `cards` array (not the order of `ids`). Uses a `Set` for O(n) lookup rather
 * than an O(n²) nested loop.
 *
 * Useful for hydrating a saved deck or wishlisted set of card IDs back into
 * typed `Card` objects.
 *
 * @example
 * const deck = filterByIds(cards, ["ogn-001", "ogn-007", "sfd-042"]);
 */
export const filterByIds = (cards: Card[], ids: string[]): Card[] => {
  const idSet = new Set(ids);
  return cards.filter((card) => idSet.has(card.id));
};

/**
 * Return all cards whose `name` exactly matches the query (case-insensitive).
 * Returns multiple results when a card has several printings — Showcase reprints
 * share a name with the original but have different `id`s and `rarity` values.
 */
export const getCardsByName = (cards: Card[], name: string): Card[] => {
  const normalized = name.trim().toLowerCase();
  return cards.filter((card) => card.name.toLowerCase() === normalized);
};

/**
 * Return all other printings of a card — that is, all cards in `cards` that share
 * the same `name` but have a different `id`. Accepts either a `Card` object or a
 * raw card `id` string.
 *
 * Returns an empty array if the card has no alternate printings.
 *
 * @example
 * const base = getCardById(cards, "ogn-007");  // Fury Rune (Common)
 * getCardReprintings(cards, base);              // → [{ id: "ogn-007a", rarity: "Showcase", ... }]
 * getCardReprintings(cards, "ogn-007");         // same result, accepts id string directly
 */
export const getCardReprintings = (cards: Card[], cardOrId: Card | string): Card[] => {
  const id = typeof cardOrId === "string" ? cardOrId : cardOrId.id;
  const source = cards.find((c) => c.id === id);
  if (!source) return [];
  const nameLower = source.name.toLowerCase();
  return cards.filter((c) => c.name.toLowerCase() === nameLower && c.id !== id);
};

/**
 * Filter cards whose `name` contains the query as a substring (case-insensitive).
 * Fills the gap between `getCardsByName` (exact match) and `searchCards` (full haystack).
 * Useful for name-based typeahead/autocomplete where you want partial matches on name only.
 * An empty/whitespace-only query returns the input unchanged.
 */
export const filterByNameContains = (cards: Card[], query: string): Card[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return cards;
  return cards.filter((card) => card.name.toLowerCase().includes(normalized));
};

/**
 * Return a random sample of `n` cards using a Fisher-Yates shuffle.
 * If `n >= cards.length`, all cards are returned in shuffled order.
 * The original array is not mutated.
 *
 * @example
 * sampleCards(cards, 1);  // random card of the day
 * sampleCards(cards, 8);  // simulate an 8-card booster pack draw
 */
export const sampleCards = (cards: Card[], n: number): Card[] => {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.max(0, Math.min(n, shuffled.length)));
};

/**
 * Return a single page of cards from an already-sorted/filtered array.
 * `page` is zero-indexed (page 0 = first page). `pageSize` must be ≥ 1.
 *
 * Sort and filter the array first, then paginate — this function only slices,
 * it does not reorder.
 *
 * @example
 * const result = paginateCards(sortByCost(filterByType(cards, "Unit")), 0, 20);
 * result.items;       // first 20 Units sorted by cost
 * result.totalPages;  // e.g. 25 for 491 Units
 */
export const paginateCards = (cards: Card[], page: number, pageSize: number): CardPage => {
  const safePage = Math.max(0, Math.floor(page));
  const safeSize = Math.max(1, Math.floor(pageSize));
  const total = cards.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeSize);
  const start = safePage * safeSize;
  return {
    items: cards.slice(start, start + safeSize),
    total,
    page: safePage,
    pageSize: safeSize,
    totalPages,
  };
};

// ─── rules keywords ───────────────────────────────────────────────────────────

/**
 * Extract rules keywords from a card's `text` field.
 * Rules keywords are wrapped in square brackets — `[Accelerate]`, `[Deflect]`, `[Reaction]`.
 * This is distinct from the `keywords` field, which holds region/champion tags like
 * `"Ionia"` or `"Dragon"`.
 *
 * HTML entities in bracket content are decoded (`&gt;` → `>`, `&lt;` → `<`, `&amp;` → `&`).
 * Cards with empty `text` return `[]`.
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
 * Keep cards that contain a given rules keyword in their `text` field.
 * Case-insensitive partial match — `"Assault"` matches both `[Assault]` and `[Assault 2]`.
 */
export const filterByRulesKeyword = (cards: Card[], keyword: string): Card[] => {
  const normalized = keyword.trim().toLowerCase();
  return cards.filter((card) =>
    extractRulesKeywords(card).some((kw) => kw.toLowerCase().includes(normalized))
  );
};

/**
 * Keep cards containing at least one of the given rules keywords (OR).
 * Each keyword is a case-insensitive partial match, consistent with `filterByRulesKeyword`.
 * An empty `keywords` array returns the input unchanged.
 */
export const filterByRulesKeywords = (cards: Card[], keywords: string[]): Card[] => {
  if (keywords.length === 0) return cards;
  const needles = keywords.map((k) => k.trim().toLowerCase());
  return cards.filter((card) => {
    const cardKws = extractRulesKeywords(card).map((kw) => kw.toLowerCase());
    return needles.some((needle) => cardKws.some((kw) => kw.includes(needle)));
  });
};

// ─── unique value helpers ─────────────────────────────────────────────────────

/**
 * Return a sorted list of every distinct card name in the collection.
 * Useful for building a name-based autocomplete vocabulary.
 */
export const getUniqueNames = (cards: Card[]): string[] =>
  [...new Set(cards.map((card) => card.name))].sort();

/**
 * Return a sorted list of every distinct `CardDomain` present in the given cards.
 * Multi-domain cards contribute each domain they belong to independently.
 * Useful for building domain filter dropdowns from a live filtered subset.
 */
export const getUniqueDomains = (cards: Card[]): CardDomain[] =>
  [...new Set(cards.flatMap((card) => card.domain ?? []))].sort() as CardDomain[];

/**
 * Return a sorted list of every distinct `CardType` present in the given cards.
 * Useful for building a type filter dropdown from a live filtered subset.
 */
export const getUniqueTypes = (cards: Card[]): CardType[] =>
  [...new Set(cards.map((card) => card.type))].sort() as CardType[];

/**
 * Return a sorted list of every distinct `CardRarity` present in the given cards,
 * ordered alphabetically. Use `rarityOrder` if you need tier order instead of
 * alphabetical order.
 */
export const getUniqueRarities = (cards: Card[]): CardRarity[] =>
  [...new Set(cards.map((card) => card.rarity))].sort() as CardRarity[];

/**
 * Return a sorted list of every distinct `setCode` present in the given cards
 * (e.g. `["OGN", "SFD", "UNL"]`). Unlike `filterBySets`, this works with raw set code
 * strings rather than the typed `CardSet` union.
 */
export const getUniqueSetCodes = (cards: Card[]): string[] =>
  [...new Set(cards.map((card) => card.setCode))].sort();

/**
 * Return a list of every distinct `CardSet` present in the given cards,
 * sorted in chronological release order (Origins → Spiritforged → Unleashed → …).
 * Cards with `set: undefined` are excluded.
 *
 * Unlike `getUniqueSetCodes`, this returns typed `CardSet` values and collapses
 * set codes that share a set (e.g. `"OGN"` and `"OGS"` both return `"Origins"`).
 *
 * @example
 * getUniqueSets(cards); // → ["Origins", "Spiritforged", "Unleashed"]
 */
export const getUniqueSets = (cards: Card[]): CardSet[] => {
  const seen = new Set(
    cards.map((c) => c.set).filter((s): s is CardSet => s !== undefined)
  );
  return [...seen].sort(
    (a, b) => (setOrder[a] ?? Infinity) - (setOrder[b] ?? Infinity)
  );
};

/**
 * Return a sorted list of every distinct value in the `keywords` (region/champion tag)
 * field across the given cards. Useful for building filter dropdowns.
 */
export const getUniqueKeywords = (cards: Card[]): string[] =>
  [...new Set(cards.flatMap((card) => card.keywords ?? []))].sort();

/**
 * Return a sorted list of every distinct rules keyword that appears in the `text` field
 * of the given cards (extracted via `extractRulesKeywords`).
 * Useful for building a rules-keyword filter UI.
 */
export const getUniqueRulesKeywords = (cards: Card[]): string[] =>
  [...new Set(cards.flatMap((card) => extractRulesKeywords(card)))].sort();

// ─── group ────────────────────────────────────────────────────────────────────

/**
 * Group cards by `type`. Returns a `Partial<Record<CardType, Card[]>>` — types not
 * present in the input are omitted (not present as empty arrays).
 */
export const groupByType = (cards: Card[]): Partial<Record<CardType, Card[]>> =>
  cards.reduce<Partial<Record<CardType, Card[]>>>((acc, card) => {
    (acc[card.type] ??= []).push(card);
    return acc;
  }, {});

/**
 * Group cards by domain. Multi-domain cards appear in every matching domain group.
 * Domains not present in the input are omitted.
 */
export const groupByDomain = (cards: Card[]): Partial<Record<CardDomain, Card[]>> =>
  cards.reduce<Partial<Record<CardDomain, Card[]>>>((acc, card) => {
    for (const domain of card.domain ?? []) {
      (acc[domain] ??= []).push(card);
    }
    return acc;
  }, {});

/**
 * Group cards by rarity. Rarities not present in the input are omitted.
 */
export const groupByRarity = (cards: Card[]): Partial<Record<CardRarity, Card[]>> =>
  cards.reduce<Partial<Record<CardRarity, Card[]>>>((acc, card) => {
    (acc[card.rarity] ??= []).push(card);
    return acc;
  }, {});

/**
 * Group cards by `set`. Cards where `set` is `undefined` (unknown set code) are
 * collected under the key `"__unknown__"`.
 */
export const groupBySet = (cards: Card[]): Partial<Record<CardSet | "__unknown__", Card[]>> =>
  cards.reduce<Partial<Record<CardSet | "__unknown__", Card[]>>>((acc, card) => {
    const key: CardSet | "__unknown__" = card.set ?? "__unknown__";
    (acc[key] ??= []).push(card);
    return acc;
  }, {});

/**
 * Group cards by raw `setCode` string (e.g. `"OGN"`, `"OGS"`, `"SFD"`).
 * Unlike `groupBySet`, this distinguishes set codes that map to the same `CardSet` —
 * for example `"OGN"` and `"OGS"` both belong to `Origins` but get separate groups here.
 */
export const groupBySetCode = (cards: Card[]): Record<string, Card[]> =>
  cards.reduce<Record<string, Card[]>>((acc, card) => {
    (acc[card.setCode] ??= []).push(card);
    return acc;
  }, {});

// ─── count ────────────────────────────────────────────────────────────────────

/** Count how many cards belong to each `CardType`. Omits types with zero cards. */
export const countByType = (cards: Card[]): Partial<Record<CardType, number>> =>
  cards.reduce<Partial<Record<CardType, number>>>((acc, card) => {
    acc[card.type] = (acc[card.type] ?? 0) + 1;
    return acc;
  }, {});

/**
 * Count how many cards belong to each `CardDomain`.
 * Multi-domain cards are counted once per domain they belong to.
 * Omits domains with zero cards.
 */
export const countByDomain = (cards: Card[]): Partial<Record<CardDomain, number>> =>
  cards.reduce<Partial<Record<CardDomain, number>>>((acc, card) => {
    for (const domain of card.domain ?? []) {
      acc[domain] = (acc[domain] ?? 0) + 1;
    }
    return acc;
  }, {});

/** Count how many cards have each `CardRarity`. Omits rarities with zero cards. */
export const countByRarity = (cards: Card[]): Partial<Record<CardRarity, number>> =>
  cards.reduce<Partial<Record<CardRarity, number>>>((acc, card) => {
    acc[card.rarity] = (acc[card.rarity] ?? 0) + 1;
    return acc;
  }, {});

/**
 * Count how many cards belong to each `CardSet`.
 * Cards with `set: undefined` are counted under `"__unknown__"`.
 * Omits sets with zero cards.
 */
export const countBySet = (cards: Card[]): Partial<Record<CardSet | "__unknown__", number>> =>
  cards.reduce<Partial<Record<CardSet | "__unknown__", number>>>((acc, card) => {
    const key: CardSet | "__unknown__" = card.set ?? "__unknown__";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

/**
 * Count how many cards belong to each raw `setCode` string.
 * Unlike `countBySet`, this distinguishes set codes that map to the same `CardSet` —
 * for example `"OGN"` and `"OGS"` both belong to `Origins` but are counted separately.
 */
export const countBySetCode = (cards: Card[]): Record<string, number> =>
  cards.reduce<Record<string, number>>((acc, card) => {
    acc[card.setCode] = (acc[card.setCode] ?? 0) + 1;
    return acc;
  }, {});

// ─── cost grouping (mana curve) ──────────────────────────────────────────────

/**
 * Group cards by their derived `cost` value.
 * Returns a plain `Record<number, Card[]>` where each key is a cost integer.
 * Keys not present in the input are omitted.
 *
 * Use `countByCost` when you only need the counts (mana curve chart data).
 * Use `getCardStats` when you need min/max/avg rather than a breakdown.
 *
 * @example
 * const curve = groupByCost(filterByType(cards, "Unit"));
 * curve[2]; // all 2-cost Units
 */
export const groupByCost = (cards: Card[]): Record<number, Card[]> =>
  cards.reduce<Record<number, Card[]>>((acc, card) => {
    (acc[card.cost] ??= []).push(card);
    return acc;
  }, {});

/**
 * Count how many cards have each cost value (the mana curve).
 * Returns a `Record<number, number>` where each key is a cost integer and the value
 * is the number of cards at that cost. Keys with zero cards are omitted.
 *
 * @example
 * countByCost(filterByType(cards, "Unit"));
 * // → { 0: 12, 1: 43, 2: 87, 3: 95, 4: 110, 5: 79, 6: 43, 7: 22 }
 */
export const countByCost = (cards: Card[]): Record<number, number> =>
  cards.reduce<Record<number, number>>((acc, card) => {
    acc[card.cost] = (acc[card.cost] ?? 0) + 1;
    return acc;
  }, {});

// ─── stats ────────────────────────────────────────────────────────────────────

/**
 * Compute aggregate statistics (min, max, avg, count) for `cost`, `energy`, and
 * `might` across the given cards. `cost` is always defined on every card; `energy`
 * and `might` are optional — their `count` reflects how many cards in the input
 * actually carry that field.
 *
 * Returns zeroed stats for an empty array (`total: 0`, all fields `{ min: 0, max: 0, avg: 0, count: 0 }`).
 *
 * @example
 * const stats = getCardStats(filterByType(cards, "Unit"));
 * stats.energy.avg;  // average energy cost of all Units
 * stats.might.max;   // highest might value among Units with a might stat
 * stats.total;       // 491
 */
/**
 * Return the total cost across all cards in the array (sum of `card.cost`).
 * Useful for computing the total mana value of a deck or a filtered subset.
 * Returns `0` for an empty array.
 *
 * @example
 * sumCost(myDeck);                              // total mana value
 * sumCost(myDeck) / myDeck.length;             // average cost (same as getCardStats().cost.avg)
 */
export const sumCost = (cards: Card[]): number =>
  cards.reduce((total, card) => total + card.cost, 0);

export const getCardStats = (cards: Card[]): CardStats => {
  const zero: CardFieldStats = { min: 0, max: 0, avg: 0, count: 0 };
  if (cards.length === 0) {
    return { total: 0, cost: zero, energy: { ...zero }, might: { ...zero } };
  }

  const fieldStats = (values: number[]): CardFieldStats => {
    if (values.length === 0) return { ...zero };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    return { min, max, avg, count: values.length };
  };

  const costs = cards.map((c) => c.cost);
  const energies = cards.filter((c) => c.energy !== undefined).map((c) => c.energy as number);
  const mights = cards.filter((c) => c.might !== undefined).map((c) => c.might as number);

  return {
    total: cards.length,
    cost: fieldStats(costs),
    energy: fieldStats(energies),
    might: fieldStats(mights),
  };
};
