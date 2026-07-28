export type CardDomain = "Fury" | "Calm" | "Mind" | "Body" | "Chaos" | "Order" | "Colorless";
export type CardRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Showcase";
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
  power?: number;
  domain?: CardDomain[];
  tags?: string[];
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
