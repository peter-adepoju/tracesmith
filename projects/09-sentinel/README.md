# Sentinel

A regression bot that runs your tests, triages the failures, and files the
bugs.

Standard library only. No browser is launched and no ticket is filed: the
suite runner, the rerunner and the tracker are all plain objects.

```bash
cd projects/09-sentinel
python -I verify.py
python -I sentinel.py --suite suite.example.json
```

Twenty-three acceptance criteria are waiting for five functions in
`sentinel.py`.

## The example run shows all four behaviours

`suite.example.json` is built so the first run demonstrates everything at
once: two failures that are the same broken endpoint and must group into
**one** bug, one genuinely flaky test that must be quarantined rather than
filed, and one failure whose evidence contains a password and a bearer token
that must not reach the ticket.

Then set `"suite_error"` to a string and run it again. The output must say the
suite did not run — not that nothing failed.

## The four things that make this worth keeping

**A suite that could not run is not zero failures.** Browser missing,
environment down, bad credentials: all of them produce a clean green if you
are not careful, and that is the most dangerous output this system can
produce, because everybody believes it.

**Flaky is not fine.** A test that passes on retry cannot be trusted either
way. It gets quarantined and listed, never deleted — a deleted flaky test is
a hole in your coverage that nobody remembers making.

**Forty failures from one broken endpoint is one bug.** A bot that files forty
tickets gets muted within a week, and then it is filing nothing. The grouping
rule here is deliberately dull: two failures share a cause when their messages
match once ids and numbers are stripped. If you cannot explain your rule in
one sentence, the engineer reading the ticket will not trust it.

**Redact everything.** Evidence is the most useful part of a bug report and
the likeliest place to paste a token into a ticket the whole company can read.

## What the verifier does and does not tell you

It cannot check whether your reports are actually readable, whether anyone
acts on them, or whether your quarantine list is quietly growing for ever.
That last one is the failure mode: a quarantine nobody empties is just a
list of tests you stopped running.

## Write these down here as you go

**Your grouping rule, in one sentence.**

**How big the quarantine list is**, and when you last emptied it.

**The first duplicate you filed anyway**, and what you changed.

<!-- your notes -->
