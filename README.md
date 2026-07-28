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
import { cards, filterByDomain, searchCards, getCardById } from "riftbound-tools";

const furyCards = filterByDomain(cards, "Fury");
const drawCards = searchCards(cards, "draw");
const card = getCardById(cards, "ogn-001");
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
