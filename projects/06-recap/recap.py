"""
Recap — a weekly digest where every claim carries its evidence.

Standard library only. Run it with:

    python -I recap.py --week 2026-03-02

Five functions are left for you. They are marked TODO and currently raise
NotImplementedError, so `python -I verify.py` fails until you write them.

The rule this project is built around: no model touches the counting half.
Gathering and counting are code. A model is allowed exactly one job — turning
a table that already exists into readable prose — and then its output is
checked against that table before anyone sees it.

That check is `verify_prose`, and it is the most useful function here. It
takes the numbers the model wrote and refuses any that the table does not
contain. A digest that says "fourteen tickets closed" when the table says
eleven is worse than no digest, because it is believable.

The second rule: a source you could not read is a gap, named in the output.
It is never a zero. "No activity this week" and "I could not reach GitHub" look
identical in a report that quietly drops failures, and only one of them is
good news.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Iterable

DIGEST_PATH = Path("digest.md")

# An ISO date is a number-shaped thing that is not a claim about quantity.
# verify_prose strips these before looking for numbers; see its docstring.
ISO_DATE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")
NUMBER = re.compile(r"\b\d+\b")


@dataclass
class Item:
    """One thing that happened, with the evidence that it happened."""

    source: str
    kind: str
    title: str
    at: str  # ISO date
    reference: str | None = None  # a link or an id; without one it is hearsay


@dataclass
class Gap:
    source: str
    reason: str


@dataclass
class Gathered:
    rows: list[Item] = field(default_factory=list)
    gaps: list[Gap] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Milestone 1 — gather, with evidence
# ---------------------------------------------------------------------------

def collect(sources: dict[str, Callable[[], list[Item]]]) -> Gathered:
    """Call every source, keeping what worked and recording what did not.

    TODO (milestone 1)

    - call each source function; collect the items it returns
    - a source that raises becomes a Gap naming the source and the reason,
      and contributes no rows
    - a source that fails must NOT silently contribute zero rows. That is the
      whole milestone: zero and unknown are different, and a digest that
      cannot tell them apart will one day report a quiet week during an
      outage.
    - every source is tried, even if an earlier one failed. One broken
      integration must not take the digest with it.

    No AI anywhere in this function, or in the two after it.
    """
    raise NotImplementedError("collect")


def usable_rows(rows: Iterable[Item]) -> tuple[list[Item], int]:
    """Keep the rows that carry evidence; count the ones that do not.

    TODO (milestone 1)

    Return (kept, excluded_count).

    - a row with no `reference`, or an empty one, is excluded. An item nobody
      can click through to is hearsay, and hearsay in a client report is how
      you end up defending a number you cannot support.
    - excluded rows are counted, not forgotten. The digest says how many.
    - the kept rows come back in a deterministic order, so the same week
      always produces the same table. Sort by something stable: date, then
      source, then reference. Relying on the order the sources happened to
      answer in makes the digest unreproducible, and you will not notice until
      two runs disagree in front of a client.
    """
    raise NotImplementedError("usable_rows")


def count_by(rows: Iterable[Item], field_name: str) -> dict[str, int]:
    """Count rows by one of their fields. Plain arithmetic, no model.

    TODO (milestone 1)

    - return {value: count}
    - an empty input returns an empty dict, not a crash
    - this is the function a model must never be allowed to do. Counting is
      the one thing a computer has never got wrong, and a language model gets
      wrong often enough to matter.
    """
    raise NotImplementedError("count_by")


# ---------------------------------------------------------------------------
# Milestone 3 — check the prose against the table
# ---------------------------------------------------------------------------

def verify_prose(prose: str, allowed: Iterable[int]) -> list[str]:
    """Return every number in the prose that the table does not support.

    TODO (milestone 3)

    - strip ISO dates first, with ISO_DATE. "2026-03-02" is three numbers to a
      regular expression and no kind of claim about quantity.
    - find the remaining whole numbers with NUMBER
    - any number not in `allowed` is a problem. Return a readable message for
      each, naming the number.
    - an empty list means the prose is supported by the table.

    This is what makes the model safe to use here. It may phrase things; it
    may not assert quantities of its own. If it writes "fourteen" as digits
    and your table says eleven, this catches it before a client does.

    Worth thinking about and writing in the README: this cannot catch a number
    spelled as a word. What do you do about that?
    """
    raise NotImplementedError("verify_prose")


# ---------------------------------------------------------------------------
# Milestone 2 — name the gaps
# ---------------------------------------------------------------------------

def render_digest(
    week: str,
    rows: list[Item],
    counts: dict[str, int],
    gaps: list[Gap],
    excluded: int,
    prose: str = "",
) -> str:
    """Assemble the digest as Markdown.

    TODO (milestone 2)

    It must contain, and the verifier checks for each:
      - the week it covers
      - the prose summary, if one was supplied and verified
      - one line per item, each carrying its reference — every claim carries
        its evidence, which is the project's name
      - the counts
      - a section naming every unreachable source and why. When there are
        none, say so explicitly ("All sources responded") rather than leaving
        the section out: a missing section is indistinguishable from a
        section you forgot to write.
      - how many items were excluded for having no reference

    A reader must be able to tell, without asking you, what this digest could
    not see.
    """
    raise NotImplementedError("render_digest")


# ---------------------------------------------------------------------------
# Given to you below this line
# ---------------------------------------------------------------------------

def build_prompt(rows: list[Item], counts: dict[str, int]) -> str:
    """A prompt that hands the model a finished table and forbids arithmetic."""
    lines = "\n".join(f"- [{row.kind}] {row.title} ({row.source} {row.reference})" for row in rows)
    tally = ", ".join(f"{value}: {count}" for value, count in sorted(counts.items()))
    return f"""You write a short weekly update for a client.

Below is a table of what happened. It is complete and already counted.

Rules:
  - Do not invent, add, or recompute any number. Use only the counts given.
  - Three sentences at most.
  - Plain English. No adjectives about how well the week went.

Counts: {tally}

Items:
{lines}"""


def no_model(prompt: str) -> str:
    """The default 'model': it writes nothing.

    An empty summary is the honest default before you wire up a real model,
    and the digest is already useful without it — the table is the product.
    """
    del prompt
    return ""


def load_week(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def sources_from_file(path: Path) -> dict[str, Callable[[], list[Item]]]:
    """Build source callables from a fixture file, including failing ones.

    A source whose entry has "error" raises when called. That is how you can
    see the gap behaviour without unplugging anything.
    """
    data = load_week(path)
    built: dict[str, Callable[[], list[Item]]] = {}

    for name, spec in data["sources"].items():

        def make(spec: dict[str, Any] = spec, name: str = name):
            def source() -> list[Item]:
                if spec.get("error"):
                    raise RuntimeError(spec["error"])
                return [Item(source=name, **item) for item in spec.get("items", [])]

            return source

        built[name] = make()

    return built


def main() -> int:
    parser = argparse.ArgumentParser(description="Recap")
    parser.add_argument("--week", default="2026-03-02")
    parser.add_argument("--fixture", default="week.example.json")
    args = parser.parse_args()

    gathered = collect(sources_from_file(Path(args.fixture)))
    rows, excluded = usable_rows(gathered.rows)
    counts = count_by(rows, "kind")

    prose = no_model(build_prompt(rows, counts))
    if prose:
        problems = verify_prose(prose, set(counts.values()) | {len(rows)})
        if problems:
            print("The summary was refused:")
            for problem in problems:
                print(f"  - {problem}")
            prose = ""

    digest = render_digest(args.week, rows, counts, gathered.gaps, excluded, prose)
    DIGEST_PATH.write_text(digest, encoding="utf-8")
    print(digest)
    print(f"\nWritten to {DIGEST_PATH}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
