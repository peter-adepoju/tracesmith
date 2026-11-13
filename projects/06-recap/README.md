# Recap

A weekly digest where every claim carries its evidence.

Standard library only. No model needed to start, and none needed to pass the
verifier — the table is the product, and the prose is optional.

```bash
cd projects/06-recap
python -I verify.py
```

That fails at first. Twenty-one acceptance criteria are waiting for five
functions in `recap.py`, each marked `TODO` with the rules it has to satisfy.

## Run it

```bash
python -I recap.py --week 2026-03-02
```

`week.example.json` has a `calendar` source rigged to fail and one commit with
no reference, so the first digest you produce already shows both behaviours:
a named gap, and an excluded item. Read the output and check you could tell,
as a client, exactly what this report could not see.

## No model touches the counting half

Gathering and counting are code. A model gets exactly one job — turning a
table that already exists into prose — and then `verify_prose` checks every
number it wrote against that table and refuses the ones it cannot support.

The default "model" writes nothing at all, which is the honest starting
point. Wire a real one into `main` when the table is right, not before.

## The two failures this prevents

**A failed source becoming a zero.** "No activity this week" and "I could not
reach the tracker" look identical in a report that quietly drops failures, and
only one of them is good news. A gap is named in the output, always.

**A number nobody can support.** A digest saying "fourteen tickets closed"
when the table says eleven is worse than no digest, because it is believable.

## What the verifier does and does not tell you

It checks behaviour against the acceptance criteria on the project page. It
cannot check:

- Whether your digest is worth reading. Send one to yourself on a Friday.
- Whether the references actually resolve. A link that 404s is evidence of
  nothing.
- Whether anyone reads it. A digest nobody opens is a cron job.

## Write these down here as you go

**What you do about numbers spelled as words.** `verify_prose` catches `14`
and not `fourteen`. Forbid words in the prompt, convert them before checking,
or accept the hole — any is defensible, ignoring it is not.

**Which source you could not get evidence from**, and what you did instead.

**How long the digest takes to produce**, and how much of that is you.

<!-- your notes -->
