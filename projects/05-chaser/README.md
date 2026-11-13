# Chaser

A polite, escalating follow-up ladder that stops the moment you are paid.

Standard library only. Nothing to install, nothing to connect.

```bash
cd projects/05-chaser
python -I verify.py
```

That fails at first. Twenty-eight acceptance criteria are waiting for five
functions in `chaser.py`, each marked `TODO` with the rules it has to satisfy.

## Run it, then prove it stops

```bash
cp invoices.example.json invoices.json
python -I chaser.py --invoices invoices.json --today 2026-03-10
```

Look at what it plans. Then run the same command again with the invoice it was
about to chase marked as paid:

```bash
python -I chaser.py --invoices invoices.json --today 2026-03-10 --paid INV-2026-002
```

It must plan nothing for that invoice. That is the whole project, and it is
the one thing worth testing by hand before you trust it with a client.

Time is a flag, so you can walk the whole three-week ladder in a minute
instead of three weeks.

## The failure this exists to prevent

Chasing someone who has already paid. It is worse than sending nothing: it
costs you the client, and it is nearly always caused by the same thing — a
payment state read once at the top of a batch and still trusted twenty minutes
later.

`may_draft` takes `check_payment` as an argument and must call it **every
time, immediately before drafting**. The verifier counts the calls. Code that
trusts `invoice.state` passes every other test and fails that one.

## What the verifier does and does not tell you

It checks behaviour against the acceptance criteria on the project page. It
cannot check:

- Whether you have actually marked an invoice paid between two runs and
  watched the ladder stop. Do that before this touches a real client.
- Whether your three messages read as firm or as rude. Read them aloud. The
  third one is the one that costs you a relationship if you get it wrong.
- Whether your holiday list is the right one for where your clients are.

## Write these down here as you go

**What happens on the third rung.** The acceptance criterion says it escalates
to a person. Who is that person, and what do they get?

**Your cap, and what happens after it.** Three messages then a human is the
default. If you raised it, say why.

**What `SENT` from `reminded-2` should do.** The scaffold suggests refusing it.
If you let it through, say what stops the ladder running for ever.

<!-- your notes -->
