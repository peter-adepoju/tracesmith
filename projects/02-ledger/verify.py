"""
Verifier for Ledger.

    python -I verify.py

Checks behaviour against the acceptance criteria on the project page. It never
touches a database: the destination is a plain dict, which is why the whole run
takes well under a second.

It checks that your code works, not that it is good. Passing is necessary and
not sufficient; the definition of done on the project page is the rest.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Windows consoles default to cp1252 and will mangle anything outside it.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

sys.path.insert(0, str(Path(__file__).parent))

import ledger as L  # noqa: E402

PASSED: list[str] = []
FAILED: list[tuple[str, str]] = []
SKIPPED: list[str] = []


def check(milestone: int, name: str):
    """Decorator registering one acceptance criterion."""

    def wrap(fn):
        label = f"M{milestone}  {name}"
        try:
            fn()
        except NotImplementedError as exc:
            SKIPPED.append(f"{label}  (not implemented: {exc})")
        except AssertionError as exc:
            FAILED.append((label, str(exc) or "assertion failed"))
        except Exception as exc:  # noqa: BLE001
            FAILED.append((label, f"{type(exc).__name__}: {exc}"))
        else:
            PASSED.append(label)
        return fn

    return wrap


T0 = "2026-01-01T00:00:00Z"
T1 = "2026-01-02T00:00:00Z"
T2 = "2026-01-03T00:00:00Z"

ADA = {"id": "c-1", "name": "Ada", "email": "ada@example.test", "updated_at": T0}
GRACE = {"id": "c-2", "name": "Grace", "email": "grace@example.test", "updated_at": T0}


def fresh() -> dict[str, L.Row]:
    return {}


# --- Milestone 2: idempotency ---------------------------------------------

@check(2, "the same record always produces the same key")
def _() -> None:
    assert L.natural_key(dict(ADA)) == L.natural_key(dict(ADA))


@check(2, "different records produce different keys")
def _() -> None:
    assert L.natural_key(ADA) != L.natural_key(GRACE)


@check(2, "the key comes from the data, not the arrival order")
def _() -> None:
    first = [L.natural_key(r) for r in (ADA, GRACE)]
    second = [L.natural_key(r) for r in (GRACE, ADA)]
    assert set(first) == set(second), "keys changed when the order did"
    assert first[0] == second[1], "the key depends on position, not content"


@check(2, "a first run adds every record")
def _() -> None:
    store = fresh()
    counts = L.upsert(store, [ADA, GRACE], T0)
    assert counts.added == 2, f"added={counts.added}, expected 2"
    assert len(store) == 2, f"{len(store)} rows, expected 2"


@check(2, "running twice leaves the same number of rows as running once")
def _() -> None:
    store = fresh()
    L.upsert(store, [ADA, GRACE], T0)
    after_one = len(store)
    L.upsert(store, [ADA, GRACE], T1)
    assert len(store) == after_one, (
        f"{len(store)} rows after the second run, {after_one} after the first — "
        "this is the duplicate the whole project is about"
    )


@check(2, "an identical second run reports nothing changed")
def _() -> None:
    store = fresh()
    L.upsert(store, [ADA], T0)
    counts = L.upsert(store, [ADA], T1)
    assert counts.added == 0, f"added={counts.added} on an unchanged re-run"
    assert counts.updated == 0, f"updated={counts.updated} on an unchanged re-run"
    assert counts.unchanged == 1, f"unchanged={counts.unchanged}, expected 1"


@check(2, "an unchanged record does not have its updated_at bumped")
def _() -> None:
    store = fresh()
    L.upsert(store, [ADA], T0)
    key = L.natural_key(ADA)
    before = store[key].updated_at
    L.upsert(store, [ADA], T2)
    assert store[key].updated_at == before, (
        "updated_at moved on a record that did not change, which makes "
        "'what changed?' unanswerable"
    )


@check(2, "a changed record updates in place rather than inserting a copy")
def _() -> None:
    store = fresh()
    L.upsert(store, [ADA], T0)
    moved = dict(ADA, email="ada@newplace.test", updated_at=T1)
    counts = L.upsert(store, [moved], T1)
    assert len(store) == 1, f"{len(store)} rows, expected 1"
    assert counts.updated == 1, f"updated={counts.updated}, expected 1"
    key = L.natural_key(moved)
    assert store[key].data["email"] == "ada@newplace.test", "the update did not land"


@check(2, "an update keeps the previous version in history")
def _() -> None:
    store = fresh()
    L.upsert(store, [ADA], T0)
    L.upsert(store, [dict(ADA, name="Ada L.", updated_at=T1)], T1)
    row = store[L.natural_key(ADA)]
    assert row.history, "history is empty, so the old value is gone for good"
    assert any(
        entry.get("name") == "Ada" for entry in row.history
    ), f"the previous name is not in history: {row.history}"


# --- Milestone 3: reconcile -----------------------------------------------

@check(3, "a record the source stopped sending is marked inactive")
def _() -> None:
    store = fresh()
    L.upsert(store, [ADA, GRACE], T0)
    marked = L.reconcile(store, {L.natural_key(ADA)}, T1)
    assert marked == 1, f"marked={marked}, expected 1"
    assert store[L.natural_key(GRACE)].active is False, "the leaver is still active"


@check(3, "a leaver is marked, never deleted")
def _() -> None:
    store = fresh()
    L.upsert(store, [ADA, GRACE], T0)
    L.reconcile(store, {L.natural_key(ADA)}, T1)
    assert len(store) == 2, (
        f"{len(store)} rows left — the constraint is 'never delete a row, mark it'"
    )
    assert store[L.natural_key(GRACE)].data.get("name") == "Grace", (
        "the leaver's data was discarded; its history must stay readable"
    )


@check(3, "a record still present stays active")
def _() -> None:
    store = fresh()
    L.upsert(store, [ADA, GRACE], T0)
    L.reconcile(store, {L.natural_key(ADA), L.natural_key(GRACE)}, T1)
    assert store[L.natural_key(ADA)].active is True


@check(3, "an already-inactive row is not marked, or counted, twice")
def _() -> None:
    store = fresh()
    L.upsert(store, [ADA, GRACE], T0)
    L.reconcile(store, {L.natural_key(ADA)}, T1)
    again = L.reconcile(store, {L.natural_key(ADA)}, T2)
    assert again == 0, f"marked={again} on the second pass, expected 0"


@check(3, "a record that comes back becomes active again")
def _() -> None:
    store = fresh()
    L.upsert(store, [ADA, GRACE], T0)
    L.reconcile(store, {L.natural_key(ADA)}, T1)
    L.upsert(store, [GRACE], T2)
    assert store[L.natural_key(GRACE)].active is True, (
        "a returning record stayed inactive"
    )


# --- Milestone 4: watermark -----------------------------------------------

@check(4, "with no watermark, everything is selected")
def _() -> None:
    picked = L.select_changed([ADA, GRACE], None)
    assert len(picked) == 2, f"{len(picked)} selected, expected 2"


@check(4, "only records at or after the watermark are selected")
def _() -> None:
    old = dict(ADA, updated_at=T0)
    new = dict(GRACE, updated_at=T2)
    picked = L.select_changed([old, new], T1)
    assert len(picked) == 1, f"{len(picked)} selected, expected 1"
    assert picked[0]["id"] == "c-2", f"selected the wrong record: {picked}"


@check(4, "a record exactly on the watermark is included, not dropped")
def _() -> None:
    picked = L.select_changed([dict(ADA, updated_at=T1)], T1)
    assert len(picked) == 1, (
        "a record sharing the watermark's timestamp was skipped — with > "
        "instead of >= it is skipped for ever"
    )


@check(4, "a record with no timestamp is included rather than silently skipped")
def _() -> None:
    picked = L.select_changed([{"id": "c-9", "name": "No stamp"}], T1)
    assert len(picked) == 1, "unknown is not the same as unchanged"


@check(4, "the watermark advances to the newest timestamp seen")
def _() -> None:
    assert L.advance_watermark([dict(ADA, updated_at=T0), dict(GRACE, updated_at=T2)], None) == T2


@check(4, "the watermark never moves backwards")
def _() -> None:
    assert L.advance_watermark([dict(ADA, updated_at=T0)], T2) == T2


@check(4, "an empty batch leaves the watermark alone")
def _() -> None:
    assert L.advance_watermark([], T1) == T1


# --- The whole thing together ---------------------------------------------

@check(4, "a full second run moves nothing")
def _() -> None:
    store = fresh()
    counts, mark = L.sync(store, [ADA, GRACE], T0, None)
    assert counts.added == 2, f"first run added={counts.added}, expected 2"
    counts2, _mark2 = L.sync(store, [ADA, GRACE], T1, mark)
    assert counts2.added == 0, f"second run added={counts2.added}, expected 0"
    assert counts2.updated == 0, f"second run updated={counts2.updated}, expected 0"
    assert counts2.marked_inactive == 0, (
        f"second run marked {counts2.marked_inactive} inactive — a watermark must "
        "not make unchanged records look like leavers"
    )
    assert len(store) == 2, f"{len(store)} rows after two runs, expected 2"


# --- Report ---------------------------------------------------------------

def main() -> int:
    total = len(PASSED) + len(FAILED) + len(SKIPPED)

    for label in PASSED:
        print(f"  pass    {label}")
    for label, reason in FAILED:
        print(f"  FAIL    {label}\n            {reason}")
    for label in SKIPPED:
        print(f"  todo    {label}")

    print()
    print(f"  {len(PASSED)} passed, {len(FAILED)} failed, {len(SKIPPED)} not written, of {total}")

    if SKIPPED and not FAILED:
        print("\n  Nothing is wrong yet — there is just code still to write.")
    if FAILED:
        print("\n  Read the first failure above. Fix that one, then run this again.")
    if not FAILED and not SKIPPED:
        print("\n  All acceptance criteria pass.")
        print("  Now the part no verifier can check: the definition of done.")
        print("  Have you run it twice against the real system and diffed the result?")

    return 1 if FAILED or SKIPPED else 0


if __name__ == "__main__":
    raise SystemExit(main())
