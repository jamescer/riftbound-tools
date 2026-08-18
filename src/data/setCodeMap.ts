import { CardSet } from "../models/card";

/**
 * Maps lowercased set code prefixes (from card `id` fields) to their `CardSet` name.
 *
 * - `ogn` — Origins (core set)
 * - `ogs` — Origins store/promo variant; still maps to `Origins`
 * - `sfd` — Spiritforged
 * - `unl` — Unleashed
 * - `vnd` — Vendetta (released 2026-07-31; CSV not yet imported)
 * - `rdn` — Radiance (unreleased as of 2026-08-16)
 *
 * This map is the single source of truth used by both `scripts/import-csv.ts` and
 * `scripts/fetch-cards.ts`. When a new set ships, add its entry here and to
 * `CardSet` / `validSets` in `src/models/card.ts` / `src/utils/validate.ts`.
 */
export const setCodeMap: Record<string, CardSet> = {
  ogn: "Origins",
  ogs: "Origins",
  sfd: "Spiritforged",
  unl: "Unleashed",
  vnd: "Vendetta",
  rdn: "Radiance",
};
