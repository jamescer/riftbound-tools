# riftbound-tools

Riftbound trading card game data utilities for deckbuilding, lookup, and search.

`riftbound-tools` provides TypeScript models, a full card dataset (~950 cards), and filter/search/sort utility functions for building Riftbound TCG tools.

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
npm run import:cards
npm run build
npm test
```

## Documentation

Full docs — data model, API reference, the CSV-to-JSON data pipeline, architecture, contributing guide, and real-world Riftbound game background — live in [`docs/`](./docs/README.md).

## License

MIT
