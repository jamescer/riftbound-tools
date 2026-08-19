#!/usr/bin/env python3
"""
patch-stats.py

Fetches all card data from the Riftcodex API and patches energy/might/cost
in src/data/cards.json.

Usage:
    python scripts/patch-stats.py
    python scripts/patch-stats.py --dry-run

Field mapping (Riftcodex → our model):
    Unit:          energy = rc["attributes"]["energy"]  (play cost)
                   might  = rc["attributes"]["might"]   (combat stat)
                   cost   = energy ?? might ?? 0
    Spell / Gear:  might  = rc["attributes"]["energy"]  (play cost stored as might)
                   cost   = might ?? 0
    Rune / Battlefield / Legend: unchanged (cost stays 0)
"""

import json
import math
import sys
import time
from pathlib import Path

try:
    import cloudscraper
except ImportError:
    sys.exit("Missing dependency: pip install cloudscraper")

# ── Config ───────────────────────────────────────────────────────────────────

CARDS_JSON = Path(__file__).parent.parent / "src" / "data" / "cards.json"
API_BASE   = "https://api.riftcodex.com"
PAGE_SIZE  = 100
DRY_RUN    = "--dry-run" in sys.argv

HEADERS = {
    "Accept": "application/json",
}

# ── Fetch ────────────────────────────────────────────────────────────────────

def fetch_page(session, page: int) -> dict:
    url = f"{API_BASE}/cards?dir=1&page={page}&size={PAGE_SIZE}"
    r = session.get(url, headers=HEADERS, timeout=30)
    if not r.ok:
        snippet = r.text[:200] if r.text else ""
        raise RuntimeError(
            f"Riftcodex request failed: {r.status_code} {r.reason}\n"
            f"URL: {url}\n"
            f"Body: {snippet}"
        )
    return r.json()


def fetch_all_cards() -> list[dict]:
    # cloudscraper handles Cloudflare's JS challenge automatically
    session = cloudscraper.create_scraper()

    print("Fetching page 1…", end=" ", flush=True)
    first = fetch_page(session, 1)
    items = list(first.get("items") or first.get("data") or [])
    total = first.get("total") or first.get("count") or len(items)
    total_pages = math.ceil(total / PAGE_SIZE)
    print(f"{len(items)} cards  (total: {total}, pages: {total_pages})")

    for page in range(2, total_pages + 1):
        print(f"Fetching page {page}/{total_pages}…", end=" ", flush=True)
        time.sleep(0.15)  # be polite
        data = fetch_page(session, page)
        page_items = list(data.get("items") or data.get("data") or [])
        items.extend(page_items)
        print(f"{len(page_items)} cards")

    print(f"\nFetched {len(items)} Riftcodex cards total.\n")
    return items


# ── Patch logic ──────────────────────────────────────────────────────────────

def to_num(val) -> int | None:
    if val is None:
        return None
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


def patch_card(card: dict, rc: dict) -> dict:
    attrs    = rc.get("attributes") or {}
    rc_energy = to_num(attrs.get("energy"))  # play cost in Riftcodex
    rc_might  = to_num(attrs.get("might"))   # combat stat in Riftcodex

    card_type = card.get("type", "")

    if card_type == "Unit":
        energy = rc_energy if rc_energy is not None else card.get("energy")
        might  = rc_might   # None if Riftcodex has null
        cost   = energy if energy is not None else (might if might is not None else 0)
        updated = {**card, "energy": energy, "cost": cost}
        if might is not None:
            updated["might"] = might
        else:
            updated.pop("might", None)
        return updated

    if card_type in ("Spell", "Gear"):
        # Our model stores Spell/Gear play cost in `might`, not `energy`
        might = rc_energy  # Riftcodex energy = play cost
        cost  = might if might is not None else 0
        updated = {**card}
        updated.pop("energy", None)
        if might is not None:
            updated["might"] = might
        else:
            updated.pop("might", None)
        updated["cost"] = cost
        return updated

    # Rune, Battlefield, Legend — no change
    return card


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    if DRY_RUN:
        print("DRY RUN — cards.json will not be modified\n")

    cards: list[dict] = json.loads(CARDS_JSON.read_text(encoding="utf-8"))
    print(f"Loaded {len(cards)} cards from {CARDS_JSON.name}\n")

    rc_cards = fetch_all_cards()

    # Build name → rc card lookup (case-insensitive, first occurrence wins)
    lookup: dict[str, dict] = {}
    for rc in rc_cards:
        name = (rc.get("name") or "").lower().strip()
        if name and name not in lookup:
            lookup[name] = rc

    print(f"Lookup table: {len(lookup)} unique Riftcodex cards\n")

    patched_count = 0
    unchanged_count = 0
    unmatched: list[str] = []

    result = []
    for card in cards:
        name_key = (card.get("name") or "").lower().strip()
        rc = lookup.get(name_key)

        if not rc:
            unmatched.append(f"  {card.get('id')} \"{card.get('name')}\" ({card.get('type')})")
            result.append(card)
            continue

        card_type = card.get("type", "")
        if card_type in ("Rune", "Battlefield", "Legend"):
            unchanged_count += 1
            result.append(card)
            continue

        updated = patch_card(card, rc)
        changed = (
            updated.get("energy") != card.get("energy") or
            updated.get("might")  != card.get("might")  or
            updated.get("cost")   != card.get("cost")
        )
        if changed:
            patched_count += 1
        else:
            unchanged_count += 1
        result.append(updated)

    # ── Report ────────────────────────────────────────────────────────────────
    print("─" * 60)
    print(f"Patched   : {patched_count}")
    print(f"Unchanged : {unchanged_count}")
    print(f"Unmatched : {len(unmatched)}")

    if unmatched:
        print("\nCards with no Riftcodex match (stats not updated):")
        for line in unmatched:
            print(line)

    if DRY_RUN:
        print("\n(Dry run — cards.json was NOT modified)")
        return

    if patched_count == 0:
        print("\nAll patchable cards already have correct values — nothing to write.")
        return

    CARDS_JSON.write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8"
    )
    print(f"\nWrote {len(result)} cards to {CARDS_JSON}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        sys.exit(1)
