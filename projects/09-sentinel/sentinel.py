"""
Sentinel — a regression bot that runs your tests, triages the failures, and
files the bugs.

Standard library only. Run it with:

    python -I sentinel.py --suite suite.example.json

Five functions are left for you. They are marked TODO and currently raise
NotImplementedError, so `python -I verify.py` fails until you write them.

This is where the two halves of the course meet: the Playwright tests from
week 15 and the reliability work from week 22, joined into something a team
would actually run at 2am.

Four things separate a regression bot people keep from one they switch off:

  It knows the difference between a suite that failed and a suite that could
  not run. "0 failures" because the browser never launched is the most
  dangerous green you will ever see.

  It knows the difference between flaky and broken, and quarantines rather
  than deletes. A deleted flaky test is a hole in your coverage that nobody
  remembers making.

  It never files a duplicate. Forty failures from one broken endpoint is one
  bug, not forty, and a bot that files forty gets muted within a week.

  It redacts. Evidence is the most useful part of a bug report and the most
  likely place to leak a token into a ticket that everyone can read.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Iterable

RUN_LOG = Path("run-log.jsonl")

# Patterns worth redacting even when you did not know the value in advance.
SECRET_PATTERNS = (
    re.compile(r"\bsk-[A-Za-z0-9_-]{8,}\b"),
    re.compile(r"\bBearer\s+[A-Za-z0-9._-]{8,}\b", re.IGNORECASE),
    re.compile(r"\b[A-Za-z0-9._%+-]+:[^@\s]{6,}@"),  # user:password@host
)
REDACTED = "[redacted]"

# Numbers and ids differ between runs of the same bug; strip them before
# comparing messages so one broken endpoint groups into one report.
VOLATILE = re.compile(r"\b(?:[0-9a-f]{8,}|\d+(?:\.\d+)?)\b", re.IGNORECASE)


@dataclass
class TestResult:
    name: str
    status: str  # "pass" or "fail"
    message: str = ""
    evidence: list[str] = field(default_factory=list)


@dataclass
class SuiteRun:
    results: list[TestResult] = field(default_factory=list)
    errored: bool = False
    error: str = ""

    @property
    def failures(self) -> list[TestResult]:
        return [item for item in self.results if item.status == "fail"]


@dataclass
class BugReport:
    key: str
    title: str
    environment: str
    steps: list[str]
    expected: str
    actual: str
    evidence: list[str] = field(default_factory=list)
    occurrences: int = 1
    status: str = "open"
    tests: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Milestone 1 — the nightly run
# ---------------------------------------------------------------------------

def run_suite(runner: Callable[[], list[TestResult]]) -> SuiteRun:
    """Run the suite, distinguishing a failing test from a suite that died.

    TODO (milestone 1)

    - a runner that returns results gives a SuiteRun holding them, with
      `errored` False
    - a runner that raises gives a SuiteRun with `errored` True, the reason in
      `error`, and no results

    This is the whole milestone and it is worth more than it looks. A suite
    that could not run at all — browser missing, environment down, bad
    credentials — must never be reported as "0 failures". That green is the
    most dangerous output this system can produce, because everybody believes
    it.
    """
    raise NotImplementedError("run_suite")


# ---------------------------------------------------------------------------
# Milestone 2 — flaky or broken
# ---------------------------------------------------------------------------

def triage(
    failures: Iterable[TestResult],
    rerun: Callable[[str], bool],
    attempts: int = 2,
) -> tuple[list[TestResult], list[TestResult]]:
    """Re-run each failure. Return (flaky, regressions).

    TODO (milestone 2)

    - `rerun(name)` returns True when the test passed that time
    - a failure that passes on any retry is flaky
    - a failure that fails every retry is a regression
    - retries are bounded by `attempts`. Call `rerun` at most that many times
      per failure, and stop early the moment one passes — an unbounded retry
      loop on a genuinely broken suite runs until someone notices the bill.

    Flaky does not mean fine. It means the test cannot be trusted either way,
    which is its own bug; it gets quarantined and listed, never deleted.
    """
    raise NotImplementedError("triage")


# ---------------------------------------------------------------------------
# Milestone 3 — file it well
# ---------------------------------------------------------------------------

def redact(text: str, secrets: Iterable[str] = ()) -> str:
    """Remove secrets from text before it goes anywhere a human can read it.

    TODO (milestone 3)

    - replace every occurrence of each value in `secrets` with REDACTED
    - also apply SECRET_PATTERNS, which catch the shapes you did not know in
      advance: API keys, bearer tokens, credentials embedded in a URL
    - leave ordinary text alone. A redactor that mangles the error message
      makes the report useless, and someone will turn it off.

    Evidence is the most useful part of a bug report and the likeliest place
    to paste a token into a ticket the whole company can read.
    """
    raise NotImplementedError("redact")


def file_or_update(
    report: BugReport, open_reports: dict[str, BugReport]
) -> tuple[str, BugReport]:
    """File a new bug, or update the one already open for this cause.

    TODO (milestone 3)

    Return ("file", report) or ("update", the existing report).

    - a key not among `open_reports` is filed
    - a key already open is updated: bump `occurrences`, merge in any new
      evidence and test names, and do NOT create a second report
    - a report whose status is not "open" — closed, resolved — does not block
      a new filing. A bug that comes back is news, and silently attaching it
      to a closed ticket is how a regression goes unnoticed for a month.

    Never file a duplicate. A bot that files forty tickets for one broken
    endpoint gets muted in a week, and then it is filing nothing.
    """
    raise NotImplementedError("file_or_update")


# ---------------------------------------------------------------------------
# Milestone 4 — group by cause
# ---------------------------------------------------------------------------

def group_by_cause(failures: Iterable[TestResult]) -> dict[str, list[TestResult]]:
    """Group failures that share a probable cause.

    TODO (milestone 4)

    Return {cause_key: [failures]}.

    The rule, and it must stay explainable in one sentence: two failures share
    a cause when their messages are the same once volatile parts — ids,
    timestamps, numbers — are removed. VOLATILE is there for that.

    - forty tests failing with "Timeout contacting /orders/8821" and
      "Timeout contacting /orders/9134" are one cause
    - a different message is a different cause
    - an empty message still groups, under something stable; it must not
      crash and must not silently merge with everything else

    Resist cleverness here. A grouping rule you cannot explain to the engineer
    reading the ticket is one they will not trust.
    """
    raise NotImplementedError("group_by_cause")


# ---------------------------------------------------------------------------
# Given to you below this line
# ---------------------------------------------------------------------------

def cause_key(message: str) -> str:
    """A stable fingerprint for a failure message. Used as the report key."""
    normalised = VOLATILE.sub("#", (message or "").strip().lower())
    return normalised or "empty-message"


def build_report(
    key: str, failures: list[TestResult], environment: str, secrets: Iterable[str] = ()
) -> BugReport:
    """Turn a group of failures into the bug report you learned to write."""
    first = failures[0]
    return BugReport(
        key=key,
        title=redact(f"{len(failures)} test(s) failing: {first.message[:80]}", secrets),
        environment=environment,
        steps=[f"Run the suite against {environment}", f"Observe {first.name}"],
        expected="The suite passes, as it did on the previous run.",
        actual=redact(first.message, secrets),
        evidence=[redact(item, secrets) for f in failures for item in f.evidence],
        tests=[f.name for f in failures],
    )


def append_run_log(run: SuiteRun, flaky: list[TestResult], filed: list[str]) -> None:
    with RUN_LOG.open("a", encoding="utf-8") as handle:
        handle.write(
            json.dumps(
                {
                    "errored": run.errored,
                    "error": run.error,
                    "tests": len(run.results),
                    "failures": len(run.failures),
                    "flaky": [item.name for item in flaky],
                    "filed": filed,
                }
            )
            + "\n"
        )
        handle.flush()


def runner_from_file(path: Path) -> tuple[Callable[[], list[TestResult]], Callable[[str], bool]]:
    """Build a suite runner and a rerunner from a fixture.

    A fixture with "suite_error" raises, so you can see the difference between
    a broken suite and failing tests without breaking anything.
    """
    data = json.loads(path.read_text(encoding="utf-8"))

    def runner() -> list[TestResult]:
        if data.get("suite_error"):
            raise RuntimeError(data["suite_error"])
        return [TestResult(**item) for item in data["results"]]

    flaky_names = set(data.get("flaky", []))

    def rerun(name: str) -> bool:
        return name in flaky_names

    return runner, rerun


def main() -> int:
    parser = argparse.ArgumentParser(description="Sentinel")
    parser.add_argument("--suite", default="suite.example.json")
    parser.add_argument("--env", default="staging")
    args = parser.parse_args()

    runner, rerun = runner_from_file(Path(args.suite))
    secrets = json.loads(Path(args.suite).read_text(encoding="utf-8")).get("secrets", [])

    run = run_suite(runner)
    if run.errored:
        append_run_log(run, [], [])
        print(f"THE SUITE DID NOT RUN: {run.error}")
        print("This is not zero failures. Nothing was tested.")
        return 2

    flaky, regressions = triage(run.failures, rerun)
    groups = group_by_cause(regressions)

    open_reports: dict[str, BugReport] = {}
    filed: list[str] = []
    for key, members in groups.items():
        report = build_report(key, members, args.env, secrets)
        action, kept = file_or_update(report, open_reports)
        open_reports[kept.key] = kept
        filed.append(f"{action}: {kept.title}")

    append_run_log(run, flaky, filed)

    print(f"{len(run.results)} tests, {len(run.failures)} failed")
    print(f"flaky (quarantined, not deleted): {[item.name for item in flaky] or 'none'}")
    print(f"regressions: {len(regressions)} in {len(groups)} group(s)")
    for line in filed:
        print(f"  {line}")
    print("\nOne broken endpoint is one bug, not forty. Check the grouping above.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
