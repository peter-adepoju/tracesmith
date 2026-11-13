"""
Ledger — a sync between two systems that can run twice and never duplicate.

Standard library only. Run it with:

    python -I ledger.py --source source.example.json

Five functions are left for you. They are marked TODO and currently raise
NotImplementedError, so `python -I verify.py` fails until you write them.
Loading, the run loop and the log are done, because plumbing is not what this
project is teaching.

The idea the whole project turns on: a sync is not a transfer, it is an
agreement about identity. Once two systems agree on what makes a record *the
same record*, running twice becomes boring. Until they do, every retry is a
duplicate waiting to happen — and retries are not optional, because networks
fail halfway.

The destination here is a dict rather than a database, for the same reason
Watchman injects `fetch`: it makes the interesting behaviour testable in
milliseconds. The rules you write transfer unchanged to a real table.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

LOG_PATH = Path("sync-log.jsonl")


@dataclass
class Row:
    """A record as the destination holds it.

    `active` is how a leaver is recorded. There is no delete in this project;
    see the constraints on the project page.
    """

    key: str
    data: dict[str, Any]
    updated_at: str
    active: bool = True
    history: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class SyncCounts:
    added: int = 0
    updated: int = 0
    unchanged: int = 0
    marked_inactive: int = 0


# ---------------------------------------------------------------------------
# Milestone 2 — make it idempotent
# ---------------------------------------------------------------------------

def natural_key(record: dict[str, Any]) -> str:
    """Derive a stable identifier from the record's own content.

    TODO (milestone 2)

    The rules you are implementing:
      - the same record must always produce the same key, in any process, on
        any day, in any order
      - a different record must produce a different key
      - the key must come from the data, never from a counter, a row number or
        the order the records arrived in

    Prefer a real identifier when the source gives you one (`id`, `email`,
    an invoice number). Fall back to hashing the fields that together mean
    "this is the same thing" — `hashlib` is imported for you.

    Write down in the README which fields you chose and why. That choice is
    the whole design: pick wrong and you will either merge two real records or
    duplicate one.
    """
    raise NotImplementedError("natural_key")


def upsert(store: dict[str, Row], records: Iterable[dict[str, Any]], now: str) -> SyncCounts:
    """Insert or update each record in the destination, keyed by natural_key.

    TODO (milestone 2)

    What this must do:
      - a record the store has never seen is added
      - a record whose data changed is updated in place, not inserted again
      - a record that is byte-for-byte identical counts as unchanged, and must
        not bump `updated_at` — a sync that rewrites everything every run makes
        "what changed?" unanswerable
      - a record that reappears after being marked inactive becomes active again
      - every update appends the previous data to `history`, because the
        constraints say history stays readable

    Return the counts. They are what the run log reports, and what tells you
    at a glance whether the second run really did nothing.
    """
    raise NotImplementedError("upsert")


# ---------------------------------------------------------------------------
# Milestone 3 — reconcile the leavers
# ---------------------------------------------------------------------------

def reconcile(store: dict[str, Row], seen_keys: set[str], now: str) -> int:
    """Mark rows the source stopped sending, and return how many were marked.

    TODO (milestone 3)

    Upsert alone never removes anything, so without this a deleted customer
    lives in your destination for ever.

      - a row whose key is missing from `seen_keys` becomes inactive
      - a row that is already inactive is not marked again, and must not be
        counted twice
      - nothing is deleted, ever — the row and its history stay
      - a row that is still present stays active

    One caution worth thinking about before you write it: if the source fails
    halfway and hands you only three of three thousand records, this function
    will happily mark the other 2,997 as leavers. Decide what guard you want
    and justify it in the README.
    """
    raise NotImplementedError("reconcile")


# ---------------------------------------------------------------------------
# Milestone 4 — move only what changed
# ---------------------------------------------------------------------------

def select_changed(
    records: Iterable[dict[str, Any]], watermark: str | None, stamp_field: str = "updated_at"
) -> list[dict[str, Any]]:
    """Return only the records modified at or after the watermark.

    TODO (milestone 4)

    A full scan every run is fine with a thousand rows and impossible with a
    million.

      - no watermark yet means everything is new, so return all of them
      - a record without a timestamp must be included rather than silently
        skipped: unknown is not the same as unchanged
      - use >= rather than >, and think about why. Two records can share a
        timestamp, and > will drop the second one for ever.
    """
    raise NotImplementedError("select_changed")


def advance_watermark(
    records: Iterable[dict[str, Any]], previous: str | None, stamp_field: str = "updated_at"
) -> str | None:
    """The watermark to store for next time.

    TODO (milestone 4)

    - the newest timestamp seen in this batch, if it is newer than `previous`
    - never move backwards: a batch of old records must not rewind the mark
    - an empty batch leaves the watermark exactly where it was
    """
    raise NotImplementedError("advance_watermark")


# ---------------------------------------------------------------------------
# Given to you below this line
# ---------------------------------------------------------------------------

def load_source(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return data["records"] if isinstance(data, dict) else data


def append_log(counts: SyncCounts, watermark: str | None) -> None:
    """One JSON object per run. Append only."""
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(
            json.dumps(
                {
                    "added": counts.added,
                    "updated": counts.updated,
                    "unchanged": counts.unchanged,
                    "marked_inactive": counts.marked_inactive,
                    "watermark": watermark,
                }
            )
            + "\n"
        )
        handle.flush()


def sync(
    store: dict[str, Row],
    records: list[dict[str, Any]],
    now: str,
    watermark: str | None = None,
) -> tuple[SyncCounts, str | None]:
    """One run: select what changed, upsert it, then reconcile the leavers.

    Reconcile uses the keys of *every* source record, not only the changed
    ones — otherwise a watermark would make every unchanged record look like a
    leaver, which is the classic way this goes wrong.
    """
    changed = select_changed(records, watermark)
    counts = upsert(store, changed, now)
    all_keys = {natural_key(record) for record in records}
    counts.marked_inactive = reconcile(store, all_keys, now)
    return counts, advance_watermark(records, watermark)


def main() -> int:
    parser = argparse.ArgumentParser(description="Ledger")
    parser.add_argument("--source", default="source.example.json")
    parser.add_argument("--state", default="state.json")
    args = parser.parse_args()

    state_path = Path(args.state)
    store: dict[str, Row] = {}
    watermark: str | None = None
    if state_path.exists():
        raw = json.loads(state_path.read_text(encoding="utf-8"))
        store = {key: Row(**row) for key, row in raw["rows"].items()}
        watermark = raw.get("watermark")

    records = load_source(Path(args.source))
    now = "2026-01-01T00:00:00Z"
    counts, watermark = sync(store, records, now, watermark)

    state_path.write_text(
        json.dumps(
            {
                "rows": {key: row.__dict__ for key, row in store.items()},
                "watermark": watermark,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    append_log(counts, watermark)

    print(
        f"added={counts.added} updated={counts.updated} "
        f"unchanged={counts.unchanged} marked_inactive={counts.marked_inactive}"
    )
    print(f"watermark={watermark}")
    print("Run it again. If anything but unchanged moves, it is not idempotent yet.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
