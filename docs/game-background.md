# Game background

This is real-world context about **Riftbound: League of Legends Trading Card Game** (the physical/digital card game this package models) — publisher, release history, rules primer, and set schedule. It's migrated and condensed from a Wikipedia snapshot (`riftbound-wiki-readme.md`, previously at repo root) so future work on this package has the game's context without needing to re-fetch it. Treat dates for unreleased sets as subject to change; verify against official sources before relying on them for anything user-facing.

## Overview

- **Publisher (English/global):** UVS Games
- **Publisher (China):** Shining Soul
- **Developer:** Riot Games, set in the League of Legends universe
- **Players:** 2+
- **Website:** riftbound.com
- **Game director:** Dave Guskin (previously director of Legends of Runeterra)
- **Executive producer:** Chengran Chai

## Development and release history

Development began in 2023. A September 2024 trailer leak (under the working title "Rune Battlegrounds") preceded Riot's official announcement in December 2024 under the codename "Project K," confirming an early-2025 China release with a global release unconfirmed pending a publishing partner. UVS Games was announced as the English-language publisher in February 2025; the final title, "Riftbound: League of Legends Trading Card Game," was revealed in March 2025 alongside Shining Soul as the China publisher.

The first set, **Origins**, released in China in August 2025 and in English on **October 31, 2025**. The English launch had three notable problems, per contemporary press coverage:

1. Supply didn't meet demand.
2. Some cards had burred/rough edges.
3. A collation error meant some booster packs contained fewer rare cards than intended (also affected the second set); Riot offered replacement cards (limited to 3 per person / 6 per household).

## Gameplay primer

Each player brings a **main deck** and a **rune deck**, plus a **Champion Legend** and a number of **Battlefields** (count depends on game mode). The rune deck has 12 rune cards, which serve as the resource for playing cards from the main deck (this package's `energy`/`cost` fields on cards correspond to this resource). The main deck has at least 40 cards spanning **Spells**, **Units**, and **Gear** — matching the `CardType` values `Unit`, `Spell`, `Gear` in this package's model (plus `Rune`, `Battlefield`, `Legend` for the other deck/board pieces). Players score by capturing and holding battlefields; first to the mode's target score wins.

## Set schedule

| # | Set | Code | Release date | Size | Notes |
| - | --- | --- | --- | --- | --- |
| 1 | Origins | OGN | 2025-10-31 | 298 | First English release |
| 2 | Spiritforged | SFD | 2026-02-13 | 221 | |
| 3 | Unleashed | UNL | 2026-05-08 | 219 | Introduces keywords Ambush, Level, Hunt, and the **Ultimate** rarity tier |
| 4 | Vendetta | VND | 2026-07-31 | — | Released; set code `VND` (mapped in `setCodeMap` as `vnd`). CSV data not yet imported. |
| 5 | Radiance | (TBD) | 2026-10-23 | — | Unreleased as of 2026-08-16 |

Cross-check against [data-model.md](./data-model.md) — the `CardSet` enum in this package already has literals for all five sets, but as of the current `cards.json`, only `Origins`, `Spiritforged`, and `Unleashed` data actually exists. Vendetta has released (2026-07-31) but its cards have not yet been imported from a CSV; run `npm run import:cards` once a Vendetta CSV is available. Radiance is still unreleased. The `Ultimate` rarity from Unleashed is already in the `CardRarity` type and `validRarities` set; it just doesn't appear in the current dataset because no Ultimate cards from the CSV have been imported yet.

## Reception (as of initial coverage)

Early press (TechRadar, PCGamesN) praised the game's approachability for TCG newcomers and the distinctiveness of different champions, while raising longevity concerns given competition from Magic: The Gathering, Pokémon TCG, and Disney Lorcana in an already-saturated market.

## Sourcing note

The original content this page was distilled from was a raw Wikipedia article dump (with UI chrome like "Contents hide," sidebar text, and a numbered reference list) saved as `riftbound-wiki-readme.md`. That raw file has been removed in favor of this condensed version; if you need the original citations, they're recoverable from the file's git history.
