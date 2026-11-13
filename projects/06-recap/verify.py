"""
Verifier for Recap.

    python -I verify.py

Checks behaviour against the acceptance criteria on the project page. Sources
are plain functions, one of which raises on purpose: that is how the gap
behaviour is tested without unplugging anything.

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

import recap as R  # noqa: E402

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


def item(**over) -> R.Item:
    base = dict(
        source="github", kind="commit", title="Fix the thing", at="2026-03-03",
        reference="abc123",
    )
    base.update(over)
    return R.Item(**base)


GIT = [item(reference="c1", at="2026-03-03"), item(reference="c2", at="2026-03-04")]
TICKETS = [item(source="tracker", kind="ticket", reference="T-9", at="2026-03-02")]


def working(rows):
    return lambda: list(rows)


def broken(message: str):
    def source():
        raise RuntimeError(message)

    return source


# --- Milestone 1: gathering -----------------------------------------------

@check(1, "rows from every working source are collected")
def _() -> None:
    got = R.collect({"github": working(GIT), "tracker": working(TICKETS)})
    assert len(got.rows) == 3, f"{len(got.rows)} rows, expected 3"
    assert got.gaps == [], f"unexpected gaps: {got.gaps}"


@check(1, "a failing source becomes a gap, not an exception")
def _() -> None:
    got = R.collect({"github": working(GIT), "tracker": broken("401 unauthorised")})
    assert len(got.gaps) == 1, f"{len(got.gaps)} gaps, expected 1"
    assert got.gaps[0].source == "tracker", got.gaps[0]
    assert "401" in got.gaps[0].reason, f"the reason is not carried: {got.gaps[0].reason}"


@check(1, "a failing source contributes no rows")
def _() -> None:
    got = R.collect({"github": working(GIT), "tracker": broken("down")})
    assert len(got.rows) == 2, (
        f"{len(got.rows)} rows — a source that failed must not contribute, "
        "and must not quietly count as zero either"
    )


@check(1, "one broken source does not stop the others")
def _() -> None:
    got = R.collect(
        {"a": broken("down"), "github": working(GIT), "c": broken("also down")}
    )
    assert len(got.rows) == 2, f"{len(got.rows)} rows, expected 2"
    assert len(got.gaps) == 2, f"{len(got.gaps)} gaps, expected 2"


@check(1, "an item with no reference is excluded and counted")
def _() -> None:
    kept, excluded = R.usable_rows([item(reference="c1"), item(reference=None)])
    assert len(kept) == 1, f"{len(kept)} kept, expected 1"
    assert excluded == 1, f"excluded={excluded}, expected 1"


@check(1, "an empty reference counts as no reference")
def _() -> None:
    kept, excluded = R.usable_rows([item(reference=""), item(reference="  ")])
    assert len(kept) == 0, f"{len(kept)} kept, expected 0"
    assert excluded == 2, f"excluded={excluded}, expected 2"


@check(1, "the same rows in a different order produce the same table")
def _() -> None:
    rows = [
        item(reference="c2", at="2026-03-04"),
        item(reference="c1", at="2026-03-03"),
        item(source="tracker", kind="ticket", reference="T-9", at="2026-03-02"),
    ]
    first, _ = R.usable_rows(rows)
    second, _ = R.usable_rows(list(reversed(rows)))
    assert [r.reference for r in first] == [r.reference for r in second], (
        "the order depends on the order the sources answered in, so two runs "
        "of the same week disagree"
    )


@check(1, "counting is by field value")
def _() -> None:
    counts = R.count_by(GIT + TICKETS, "kind")
    assert counts == {"commit": 2, "ticket": 1}, counts


@check(1, "counting nothing returns nothing, not a crash")
def _() -> None:
    assert R.count_by([], "kind") == {}


# --- Milestone 3: the prose check -----------------------------------------

@check(3, "prose whose numbers match the table passes")
def _() -> None:
    assert R.verify_prose("We landed 2 commits and closed 1 ticket.", {1, 2, 3}) == []


@check(3, "a number the table does not support is caught")
def _() -> None:
    problems = R.verify_prose("We landed 14 commits.", {1, 2, 3})
    assert problems, "14 is not in the table and was allowed through"
    assert any("14" in p for p in problems), f"the problem does not name it: {problems}"


@check(3, "dates are not mistaken for claims about quantity")
def _() -> None:
    problems = R.verify_prose("In the week of 2026-03-02 we landed 2 commits.", {2})
    assert problems == [], (
        f"an ISO date was read as numbers: {problems}. Strip dates first."
    )


@check(3, "prose with no numbers at all passes")
def _() -> None:
    assert R.verify_prose("A steady week with no surprises.", {1, 2}) == []


@check(3, "every unsupported number is reported, not just the first")
def _() -> None:
    problems = R.verify_prose("We shipped 14 things across 9 repositories.", {1, 2})
    assert len(problems) >= 2, f"only {len(problems)} reported: {problems}"


# --- Milestone 2: naming the gaps -----------------------------------------

@check(2, "the digest lists every unreachable source")
def _() -> None:
    text = R.render_digest(
        "2026-03-02",
        list(GIT),
        {"commit": 2},
        [R.Gap("tracker", "401 unauthorised"), R.Gap("calendar", "timeout")],
        excluded=0,
    )
    assert "tracker" in text, "an unreachable source is not named in the digest"
    assert "calendar" in text, "only one of two gaps was reported"


@check(2, "a failed source is never reported as zero")
def _() -> None:
    text = R.render_digest(
        "2026-03-02", list(GIT), {"commit": 2}, [R.Gap("tracker", "timeout")], excluded=0
    )
    lowered = text.lower()
    assert "tracker" in lowered, "the failed source vanished from the digest"
    assert "tracker: 0" not in lowered and "tracker 0" not in lowered, (
        "an unreachable source was reported as a zero, which is the one thing "
        "this milestone exists to prevent"
    )


@check(2, "a clean run says so rather than omitting the section")
def _() -> None:
    text = R.render_digest("2026-03-02", list(GIT), {"commit": 2}, [], excluded=0)
    assert "all sources responded" in text.lower(), (
        "with no gaps the section was left out entirely; a missing section "
        "is indistinguishable from one you forgot to write"
    )


@check(2, "the digest says how many items were excluded")
def _() -> None:
    text = R.render_digest("2026-03-02", list(GIT), {"commit": 2}, [], excluded=3)
    assert "3" in text, "the excluded count is not in the digest"
    assert "exclud" in text.lower(), "nothing explains what the 3 refers to"


@check(2, "every item carries its reference")
def _() -> None:
    text = R.render_digest("2026-03-02", list(GIT), {"commit": 2}, [], excluded=0)
    for row in GIT:
        assert row.reference in text, (
            f"item {row.title!r} appears without its reference {row.reference!r} — "
            "every claim carries its evidence"
        )


@check(2, "the digest names the week it covers")
def _() -> None:
    text = R.render_digest("2026-03-02", list(GIT), {"commit": 2}, [], excluded=0)
    assert "2026-03-02" in text


@check(2, "a verified summary appears in the digest")
def _() -> None:
    text = R.render_digest(
        "2026-03-02", list(GIT), {"commit": 2}, [], excluded=0, prose="A steady week."
    )
    assert "A steady week." in text, "the summary was dropped"


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
        print("  Unplug a real source and read the digest. Does it say so plainly?")

    return 1 if FAILED or SKIPPED else 0


if __name__ == "__main__":
    raise SystemExit(main())
