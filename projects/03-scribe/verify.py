"""
Verifier for Scribe.

    python -I verify.py

Checks behaviour against the acceptance criteria on the project page. It never
calls a model: every test injects a fake one, which is why this costs nothing
and finishes instantly. That the tests can do this at all is the design point
of the project.

It checks that your code works, not that it is good. Passing is necessary and
not sufficient; the definition of done on the project page is the rest.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Windows consoles default to cp1252 and will mangle anything outside it.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

sys.path.insert(0, str(Path(__file__).parent))

import scribe as S  # noqa: E402

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


GOOD = {
    "invoice_no": "INV-2026-114",
    "supplier": "Harmattan Supplies Ltd",
    "total_minor": 4850000,
    "currency": "NGN",
    "issued_on": "2026-02-04",
    "po_number": None,
}


def reply(data: dict, confidence: dict | None = None, fence: bool = False) -> str:
    payload = dict(data)
    if confidence is not None:
        payload["_confidence"] = confidence
    text = json.dumps(payload)
    return f"```json\n{text}\n```" if fence else text


def scripted(*replies: str):
    """A model that returns each reply in turn, then repeats the last."""
    calls = {"n": 0, "prompts": []}

    def call_model(prompt: str) -> str:
        calls["prompts"].append(prompt)
        index = min(calls["n"], len(replies) - 1)
        calls["n"] += 1
        return replies[index]

    call_model.calls = calls  # type: ignore[attr-defined]
    return call_model


CONFIDENT = {name: 0.95 for name in GOOD}


# --- Milestone 2: validation ----------------------------------------------

@check(2, "well-formed data passes validation")
def _() -> None:
    assert S.validate(dict(GOOD), S.SCHEMA) == []


@check(2, "a missing required field is reported")
def _() -> None:
    data = dict(GOOD)
    del data["invoice_no"]
    errors = S.validate(data, S.SCHEMA)
    assert errors, "no error for a missing required field"
    assert any("invoice_no" in e for e in errors), f"the error does not name the field: {errors}"


@check(2, "a required field that is explicitly null is not an error")
def _() -> None:
    errors = S.validate(dict(GOOD, invoice_no=None), S.SCHEMA)
    assert errors == [], (
        "null means 'the model does not know', which milestone 3 handles. "
        f"Treating it as invalid conflates missing with unknown: {errors}"
    )


@check(2, "a number sent as a string is rejected")
def _() -> None:
    errors = S.validate(dict(GOOD, total_minor="4850000"), S.SCHEMA)
    assert errors, "'4850000' is a string, not an integer"


@check(2, "a non-integer number is rejected")
def _() -> None:
    errors = S.validate(dict(GOOD, total_minor=48500.5), S.SCHEMA)
    assert errors, "minor units must be whole"


@check(2, "a malformed date is rejected")
def _() -> None:
    errors = S.validate(dict(GOOD, issued_on="04/02/2026"), S.SCHEMA)
    assert errors, "issued_on must be YYYY-MM-DD"


@check(2, "a value outside the allowed choices is rejected")
def _() -> None:
    errors = S.validate(dict(GOOD, currency="NGM"), S.SCHEMA)
    assert errors, "NGM is not in the currency choices"


@check(2, "a field the schema never declared is rejected")
def _() -> None:
    errors = S.validate(dict(GOOD, vat_rate=7.5), S.SCHEMA)
    assert errors, "an invented extra field is a signal, not a bonus"


# --- Milestone 2: the extract loop ----------------------------------------

@check(2, "a good first answer is accepted in one attempt")
def _() -> None:
    model = scripted(reply(GOOD, CONFIDENT))
    result = S.extract("an invoice", model, S.SCHEMA)
    assert result.data["invoice_no"] == "INV-2026-114", result.data
    assert result.attempts == 1, f"attempts={result.attempts}, expected 1"


@check(2, "a code-fenced answer is still read")
def _() -> None:
    model = scripted(reply(GOOD, CONFIDENT, fence=True))
    result = S.extract("an invoice", model, S.SCHEMA)
    assert result.data["supplier"] == "Harmattan Supplies Ltd", result.data


@check(2, "the confidence block is kept out of the validated data")
def _() -> None:
    model = scripted(reply(GOOD, CONFIDENT))
    result = S.extract("an invoice", model, S.SCHEMA)
    assert "_confidence" not in result.data, (
        "_confidence is metadata about the answer, not a field of it"
    )
    assert result.confidence, "the confidence scores were thrown away"


@check(2, "a reply that is not JSON at all is handled, not crashed on")
def _() -> None:
    model = scripted("I'm sorry, I can't help with that.", reply(GOOD, CONFIDENT))
    result = S.extract("an invoice", model, S.SCHEMA)
    assert result.attempts == 2, f"attempts={result.attempts}, expected 2"


@check(2, "invalid output triggers exactly one retry, then succeeds")
def _() -> None:
    bad = reply(dict(GOOD, currency="NGM"), CONFIDENT)
    model = scripted(bad, reply(GOOD, CONFIDENT))
    result = S.extract("an invoice", model, S.SCHEMA, max_retries=1)
    assert result.attempts == 2, f"attempts={result.attempts}, expected 2"
    assert result.data["currency"] == "NGN", result.data


@check(2, "the retry prompt carries the actual error back to the model")
def _() -> None:
    bad = reply(dict(GOOD, currency="NGM"), CONFIDENT)
    model = scripted(bad, reply(GOOD, CONFIDENT))
    S.extract("an invoice", model, S.SCHEMA, max_retries=1)
    first, second = model.calls["prompts"][0], model.calls["prompts"][1]
    # "NGM" appears nowhere in the document or the schema, so it can only
    # reach the second prompt by way of the validation error. Checking for
    # the field name instead would pass trivially: build_prompt always lists
    # every field.
    assert "NGM" in second, (
        "the rejected value is not in the retry prompt — a retry that asks "
        "the same question the same way is just a slower failure"
    )
    assert second != first, "the retry prompt is identical to the first"


@check(2, "output that never validates raises rather than returning")
def _() -> None:
    bad = reply(dict(GOOD, currency="NGM"), CONFIDENT)
    model = scripted(bad)
    try:
        result = S.extract("an invoice", model, S.SCHEMA, max_retries=1)
    except S.ExtractionError:
        return
    raise AssertionError(
        "it returned instead of raising. Nothing downstream may ever see "
        f"output that did not validate: {result.data}"
    )


@check(2, "a failing extraction stops after the retry budget")
def _() -> None:
    model = scripted("not json")
    try:
        S.extract("an invoice", model, S.SCHEMA, max_retries=1)
    except S.ExtractionError:
        pass
    assert model.calls["n"] == 2, (
        f"the model was called {model.calls['n']} times, expected 2 (1 + 1 retry)"
    )


# --- Milestone 3: knowing what you do not know ----------------------------

@check(3, "a confident, complete extraction does not need review")
def _() -> None:
    result = S.Extraction(data=dict(GOOD), confidence=dict(CONFIDENT))
    assert S.needs_review(result, threshold=0.8) is False


@check(3, "a null required field goes to review")
def _() -> None:
    result = S.Extraction(data=dict(GOOD, invoice_no=None), confidence=dict(CONFIDENT))
    assert S.needs_review(result, threshold=0.8) is True, (
        "the model said it did not know; using that record guesses on its behalf"
    )


@check(3, "a null optional field does not go to review")
def _() -> None:
    result = S.Extraction(data=dict(GOOD, po_number=None), confidence=dict(CONFIDENT))
    assert S.needs_review(result, threshold=0.8) is False, (
        "po_number is optional — sending these to review makes the queue noise"
    )


@check(3, "a low-confidence field goes to review")
def _() -> None:
    result = S.Extraction(
        data=dict(GOOD), confidence=dict(CONFIDENT, total_minor=0.4)
    )
    assert S.needs_review(result, threshold=0.8) is True


@check(3, "a required field with no confidence score at all goes to review")
def _() -> None:
    sparse = {k: v for k, v in CONFIDENT.items() if k != "total_minor"}
    result = S.Extraction(data=dict(GOOD), confidence=sparse)
    assert S.needs_review(result, threshold=0.8) is True, (
        "absent is not the same as high"
    )


# --- Milestone 1 and 4: measurement ---------------------------------------

@check(1, "a perfect run scores 1.0 on every field")
def _() -> None:
    scores = S.per_field_accuracy([dict(GOOD)], [dict(GOOD)])
    assert scores, "no scores returned"
    assert all(v == 1.0 for v in scores.values()), scores


@check(1, "accuracy is reported per field, not per document")
def _() -> None:
    expected = [dict(GOOD), dict(GOOD)]
    actual = [dict(GOOD), dict(GOOD, supplier="Wrong Ltd")]
    scores = S.per_field_accuracy(expected, actual)
    assert scores["supplier"] == 0.5, f"supplier={scores.get('supplier')}, expected 0.5"
    assert scores["invoice_no"] == 1.0, (
        "one wrong field dragged down a field that was right — score them separately"
    )


@check(1, "a missing field counts as wrong, not as absent")
def _() -> None:
    scores = S.per_field_accuracy([dict(GOOD)], [{}])
    assert scores["invoice_no"] == 0.0, f"invoice_no={scores.get('invoice_no')}"


@check(1, "formatting differences are not counted as errors")
def _() -> None:
    scores = S.per_field_accuracy(
        [dict(GOOD)], [dict(GOOD, currency="ngn", supplier="  Harmattan Supplies Ltd ")]
    )
    assert scores["currency"] == 1.0, "'ngn' and 'NGN' are the same answer"
    assert scores["supplier"] == 1.0, "surrounding whitespace is not a wrong answer"


@check(1, "an empty evaluation set does not divide by zero")
def _() -> None:
    assert S.per_field_accuracy([], []) == {}


@check(4, "cost per document is computed from tokens and prices")
def _() -> None:
    cost = S.cost_per_document(2000, 500, price_in_per_1k=0.003, price_out_per_1k=0.015)
    assert abs(cost - 0.0135) < 1e-6, f"got {cost}, expected 0.0135"


@check(4, "a free call costs nothing")
def _() -> None:
    assert S.cost_per_document(0, 0, 0.003, 0.015) == 0


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
        print("  What is your accuracy on the held-out set, per field, with a real model?")

    return 1 if FAILED or SKIPPED else 0


if __name__ == "__main__":
    raise SystemExit(main())
