"""
Verifier for Sentinel.

    python -I verify.py

Checks behaviour against the acceptance criteria on the project page. No
browser is launched and no ticket is filed: the suite runner, the rerunner and
the issue tracker are all plain objects.

The test worth reading first is the one that makes the suite itself blow up.
A suite that could not run must never look like zero failures.

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

import sentinel as S  # noqa: E402

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


def passing(name: str) -> S.TestResult:
    return S.TestResult(name=name, status="pass")


def failing(name: str, message: str, evidence: list[str] | None = None) -> S.TestResult:
    return S.TestResult(name=name, status="fail", message=message, evidence=evidence or [])


TIMEOUT_A = failing("checkout", "Timeout contacting /orders/8821 after 30000ms")
TIMEOUT_B = failing("basket", "Timeout contacting /orders/9134 after 30000ms")
OTHER = failing("login", "Expected 200, received 403")


def counting_rerun(passes_on: set[str]):
    calls: dict[str, int] = {}

    def rerun(name: str) -> bool:
        calls[name] = calls.get(name, 0) + 1
        return name in passes_on

    rerun.calls = calls  # type: ignore[attr-defined]
    return rerun


# --- Milestone 1: the nightly run -----------------------------------------

@check(1, "a normal run returns its results")
def _() -> None:
    run = S.run_suite(lambda: [passing("a"), failing("b", "boom")])
    assert run.errored is False, "a working suite was reported as errored"
    assert len(run.results) == 2, run.results
    assert len(run.failures) == 1, run.failures


@check(1, "a suite that cannot run is not reported as zero failures")
def _() -> None:
    def broken() -> list[S.TestResult]:
        raise RuntimeError("browser executable not found")

    run = S.run_suite(broken)
    assert run.errored is True, (
        "the suite blew up and was reported as a clean run. That green is the "
        "most dangerous output this system can produce"
    )
    assert run.failures == [], "a suite that did not run has no failing tests"


@check(1, "the reason the suite died is kept")
def _() -> None:
    def broken() -> list[S.TestResult]:
        raise RuntimeError("browser executable not found")

    run = S.run_suite(broken)
    assert "browser" in run.error, f"the reason was lost: {run.error!r}"


# --- Milestone 2: flaky or broken -----------------------------------------

@check(2, "a failure that passes on retry is flaky")
def _() -> None:
    flaky, regressions = S.triage([TIMEOUT_A], counting_rerun({"checkout"}), attempts=2)
    assert [item.name for item in flaky] == ["checkout"], flaky
    assert regressions == [], regressions


@check(2, "a failure that never passes is a regression")
def _() -> None:
    flaky, regressions = S.triage([OTHER], counting_rerun(set()), attempts=2)
    assert flaky == [], flaky
    assert [item.name for item in regressions] == ["login"], regressions


@check(2, "retries are bounded")
def _() -> None:
    rerun = counting_rerun(set())
    S.triage([OTHER], rerun, attempts=2)
    assert rerun.calls.get("login", 0) <= 2, (
        f"rerun was called {rerun.calls.get('login')} times with attempts=2 — "
        "an unbounded retry loop runs until someone notices the bill"
    )


@check(2, "retrying stops as soon as a test passes")
def _() -> None:
    rerun = counting_rerun({"checkout"})
    S.triage([TIMEOUT_A], rerun, attempts=3)
    assert rerun.calls.get("checkout", 0) == 1, (
        f"rerun was called {rerun.calls.get('checkout')} times after it had "
        "already passed"
    )


@check(2, "a mixed batch is split correctly")
def _() -> None:
    flaky, regressions = S.triage(
        [TIMEOUT_A, OTHER], counting_rerun({"checkout"}), attempts=2
    )
    assert [item.name for item in flaky] == ["checkout"], flaky
    assert [item.name for item in regressions] == ["login"], regressions


@check(2, "nothing to triage is not a crash")
def _() -> None:
    flaky, regressions = S.triage([], counting_rerun(set()))
    assert flaky == [] and regressions == []


# --- Milestone 3: redaction and filing ------------------------------------

@check(3, "a known secret is removed")
def _() -> None:
    out = S.redact("auth failed for hunter2seventeen", ["hunter2seventeen"])
    assert "hunter2seventeen" not in out, "the secret survived into the report"


@check(3, "an API key is removed even when not known in advance")
def _() -> None:
    out = S.redact("Authorization used sk-live-abcd1234efgh", [])
    assert "sk-live-abcd1234efgh" not in out, f"the key survived: {out!r}"


@check(3, "a bearer token is removed")
def _() -> None:
    out = S.redact("header: Bearer eyJhbGciOiJIUzI1NiJ9", [])
    assert "eyJhbGciOiJIUzI1NiJ9" not in out, f"the token survived: {out!r}"


@check(3, "credentials inside a URL are removed")
def _() -> None:
    out = S.redact("connecting to https://admin:s3cretpw@db.example.test/x", [])
    assert "s3cretpw" not in out, f"the password survived: {out!r}"


@check(3, "ordinary text is left alone")
def _() -> None:
    message = "Expected 200, received 403"
    assert S.redact(message, ["hunter2"]) == message, (
        "a redactor that mangles the error message makes the report useless"
    )


@check(3, "a new cause is filed")
def _() -> None:
    report = S.build_report("k1", [OTHER], "staging")
    action, kept = S.file_or_update(report, {})
    assert action == "file", action
    assert kept.key == "k1", kept


@check(3, "a cause already open is updated, not filed again")
def _() -> None:
    existing = S.build_report("k1", [OTHER], "staging")
    action, kept = S.file_or_update(S.build_report("k1", [OTHER], "staging"), {"k1": existing})
    assert action == "update", (
        "a second report was filed for a cause that is already open"
    )
    assert kept.occurrences == 2, f"occurrences={kept.occurrences}, expected 2"


@check(3, "a closed report does not block a new filing")
def _() -> None:
    closed = S.build_report("k1", [OTHER], "staging")
    closed.status = "closed"
    action, _kept = S.file_or_update(S.build_report("k1", [OTHER], "staging"), {"k1": closed})
    assert action == "file", (
        "a returning bug was attached to a closed ticket, which is how a "
        "regression goes unnoticed for a month"
    )


@check(3, "an update merges the new test names in")
def _() -> None:
    existing = S.build_report("k1", [failing("one", "boom")], "staging")
    incoming = S.build_report("k1", [failing("two", "boom")], "staging")
    _action, kept = S.file_or_update(incoming, {"k1": existing})
    assert "two" in kept.tests, f"the new test was lost: {kept.tests}"
    assert "one" in kept.tests, f"the original test was lost: {kept.tests}"


# --- Milestone 4: grouping ------------------------------------------------

@check(4, "failures differing only by id share a cause")
def _() -> None:
    groups = S.group_by_cause([TIMEOUT_A, TIMEOUT_B])
    assert len(groups) == 1, (
        f"{len(groups)} groups — two timeouts on the same endpoint are one "
        "bug, not two. Forty of them are still one bug"
    )


@check(4, "a different failure is a different cause")
def _() -> None:
    groups = S.group_by_cause([TIMEOUT_A, OTHER])
    assert len(groups) == 2, f"{len(groups)} groups, expected 2"


@check(4, "every failure ends up in a group")
def _() -> None:
    groups = S.group_by_cause([TIMEOUT_A, TIMEOUT_B, OTHER])
    total = sum(len(members) for members in groups.values())
    assert total == 3, f"{total} failures across the groups, expected 3"


@check(4, "an empty message does not crash and does not swallow everything")
def _() -> None:
    groups = S.group_by_cause([failing("x", ""), OTHER])
    assert len(groups) == 2, (
        f"{len(groups)} groups — a blank message merged with a real one"
    )


@check(4, "nothing to group returns nothing")
def _() -> None:
    assert S.group_by_cause([]) == {}


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
        print("  Is your quarantine list shrinking, or quietly growing for ever?")

    return 1 if FAILED or SKIPPED else 0


if __name__ == "__main__":
    raise SystemExit(main())
