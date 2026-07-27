# riftbound-tools

Riftbound trading card game data utilities for deckbuilding, lookup, and search.

## Overview

`riftbound-tools` provides TypeScript models, sample card data, and utility functions for building Riftbound TCG tools.

## Packages

- `Card` model and enums
- sample `cards` dataset
- filtering and search utilities

## Install

```bash
npm install riftbound-tools
```

## Usage

```ts
import { cards, filterByFaction, searchCards, getCardById } from "riftbound-tools";

const infernalCards = filterByFaction(cards, "Infernal");
const drawCards = searchCards(cards, "draw");
const card = getCardById(cards, "riftbound-003");
```

## Development

```bash
npm install
npm run generate:cards
npm run build
npm test
```

## Data generation

Card data is stored in `src/data/cards.json` and imported from `src/data/cards.ts`.
Run `npm run generate:cards` to regenerate the JSON from the source script.

## License

MIT
