export type CardDomain = "Fury" | "Calm" | "Mind" | "Body" | "Chaos" | "Order" | "Colorless";
export type CardRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Showcase" | "Ultimate";
export type CardType = "Unit" | "Spell" | "Gear" | "Rune" | "Battlefield" | "Legend";
export type CardSet = "Origins" | "Spiritforged" | "Unleashed" | "Vendetta" | "Radiance";

export interface CardBase {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  energy?: number;
  might?: number;
  /**
   * @deprecated Defined in the schema but currently unused — 0 cards in the dataset
   * have a `power` value. Reserved for a future stat that the CSV does not yet populate.
   * Do not read or filter on this field in new code.
   */
  power?: number;
  domain?: CardDomain[];
  /**
   * @deprecated Always identical to `keywords` — use `keywords` instead.
   * This field will be removed from generated card data in a future import run.
   */
  tags?: string[];
  /** @deprecated Use `abilities[0]` or `text` instead. */
  ability?: string;
  abilities: string[];
  text: string;
  imageUrl?: string;
  set?: CardSet;
  setCode: string;
  keywords?: string[];
  collectible?: boolean;
}

export interface UnitCard extends CardBase {
  type: "Unit";
}

export interface SpellCard extends CardBase {
  type: "Spell";
}

export interface GearCard extends CardBase {
  type: "Gear";
}

export interface RuneCard extends CardBase {
  type: "Rune";
}

export interface BattlefieldCard extends CardBase {
  type: "Battlefield";
}

export interface LegendCard extends CardBase {
  type: "Legend";
}

export type Card = UnitCard | SpellCard | GearCard | RuneCard | BattlefieldCard | LegendCard;
