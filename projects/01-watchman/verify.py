"""
Verifier for Watchman.

    python -I verify.py

Checks behaviour against the acceptance criteria on the project page. It does
not touch the network: every test injects a fake fetch, which is why the whole
run takes under a second.

It checks that your code works, not that it is good. Passing is necessary and
not sufficient; the definition of done on the project page is the rest.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

# Windows consoles default to cp1252 and will mangle anything outside it.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

sys.path.insert(0, str(Path(__file__).parent))

import watchman as w  # noqa: E402

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


def fake(*responses: w.Response):
    """A fetch that returns each response in turn, then repeats the last."""
    calls = {"n": 0}

    def fetch(_url: str) -> w.Response:
        index = min(calls["n"], len(responses) - 1)
        calls["n"] += 1
        return responses[index]

    fetch.calls = calls  # type: ignore[attr-defined]
    return fetch


def no_sleep(_seconds: float) -> None:
    return None


OK = w.Response(status=200, latency_ms=100)
SLOW = w.Response(status=200, latency_ms=5000)
BOOM = w.Response(status=500, latency_ms=80)
DEAD = w.Response(status=None, latency_ms=10000, error="timeout")


# --- Milestone 1: classify ------------------------------------------------

@check(1, "a fast 2xx is OK")
def _() -> None:
    assert w.classify(OK, budget_ms=1000) == "OK"


@check(1, "a slow 2xx is DEGRADED")
def _() -> None:
    assert w.classify(SLOW, budget_ms=1000) == "DEGRADED"


@check(1, "a 5xx is FAILED")
def _() -> None:
    assert w.classify(BOOM, budget_ms=1000) == "FAILED"


@check(1, "a timeout is FAILED")
def _() -> None:
    assert w.classify(DEAD, budget_ms=1000) == "FAILED"


@check(1, "a 4xx is classified deliberately, not crashed on")
def _() -> None:
    result = w.classify(w.Response(status=404, latency_ms=50), budget_ms=1000)
    assert result in ("OK", "DEGRADED", "FAILED"), f"got {result!r}"


# --- Milestone 2: retry ---------------------------------------------------

@check(2, "a healthy target is fetched once")
def _() -> None:
    fetch = fake(OK)
    result = w.check_target(w.Target("api", "https://x.test", retries=2), fetch, no_sleep)
    assert result.status == "OK", result.status
    assert result.attempts == 1, f"attempts={result.attempts}, expected 1"


@check(2, "a failing target is retried up to the limit")
def _() -> None:
    fetch = fake(BOOM)
    result = w.check_target(w.Target("api", "https://x.test", retries=2), fetch, no_sleep)
    assert result.status == "FAILED", result.status
    assert result.attempts == 3, f"attempts={result.attempts}, expected 3 (1 + 2 retries)"


@check(2, "a target that recovers on retry stops early and reports OK")
def _() -> None:
    fetch = fake(BOOM, OK)
    result = w.check_target(w.Target("api", "https://x.test", retries=3), fetch, no_sleep)
    assert result.status == "OK", result.status
    assert result.attempts == 2, f"attempts={result.attempts}, expected 2"


@check(2, "backoff grows between attempts")
def _() -> None:
    waits: list[float] = []
    w.check_target(
        w.Target("api", "https://x.test", retries=2),
        fake(BOOM),
        lambda seconds: waits.append(seconds),
    )
    assert len(waits) >= 2, f"expected at least 2 waits, saw {len(waits)}"
    assert waits[1] > waits[0], f"waits did not grow: {waits}"


@check(2, "a paused target is PAUSED and is never fetched")
def _() -> None:
    fetch = fake(OK)
    result = w.check_target(
        w.Target("api", "https://x.test", paused=True), fetch, no_sleep
    )
    assert result.status == "PAUSED", result.status
    assert fetch.calls["n"] == 0, "a paused target must not be fetched"


# --- Milestone 4: alerting ------------------------------------------------

@check(4, "the first failure alerts")
def _() -> None:
    assert w.should_alert("OK", "FAILED") is True


@check(4, "a continuing failure does not alert again")
def _() -> None:
    assert w.should_alert("FAILED", "FAILED") is False


@check(4, "recovery alerts")
def _() -> None:
    assert w.should_alert("FAILED", "OK") is True


@check(4, "a steady healthy target does not alert")
def _() -> None:
    assert w.should_alert("OK", "OK") is False


@check(4, "a failure on the very first run alerts")
def _() -> None:
    assert w.should_alert(None, "FAILED") is True


@check(4, "PAUSED never alerts")
def _() -> None:
    assert w.should_alert("OK", "PAUSED") is False
    assert w.should_alert("FAILED", "PAUSED") is False


# --- Milestone 5: heartbeat -----------------------------------------------

@check(5, "a recent run is not stale")
def _() -> None:
    now = time.time()
    assert w.is_stale(now - 60, expected_every_s=300, now=now) is False


@check(5, "a missed window is stale")
def _() -> None:
    now = time.time()
    assert w.is_stale(now - 1800, expected_every_s=300, now=now) is True


@check(5, "never having run is stale")
def _() -> None:
    assert w.is_stale(None, expected_every_s=300, now=time.time()) is True


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
        print("  Have you broken it on purpose and seen the alert arrive?")

    return 1 if FAILED or SKIPPED else 0


if __name__ == "__main__":
    raise SystemExit(main())
