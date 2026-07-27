export type CardFaction = "Arcane" | "Celestial" | "Infernal" | "Void" | "Wild";
export type CardDomain = "Fury" | "Calm" | "Mind" | "Colorless" | "Any";
export type CardRarity = "Common" | "Rare" | "Epic" | "Legendary";
export type CardType = "Unit" | "Spell" | "Gear" | "Rune" | "Battlefield" | "Champion" | "Artifact";
export type CardSet = "Origins" | "Spiritforged" | "Unleashed" | "Vendetta" | "Radiance";

export interface CardBase {
  id: string;
  name: string;
  faction?: CardFaction;
  domain?: CardDomain;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  energy?: number;
  might?: number;
  power?: number;
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
  type: "Unit" | "Champion";
}

export interface SpellCard extends CardBase {
  type: "Spell";
}

export interface ArtifactCard extends CardBase {
  type: "Artifact" | "Gear";
}

export interface RuneCard extends CardBase {
  type: "Rune";
}

export interface BattlefieldCard extends CardBase {
  type: "Battlefield";
}

export type Card = UnitCard | SpellCard | ArtifactCard | RuneCard | BattlefieldCard;
