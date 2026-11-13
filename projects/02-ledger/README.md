# Ledger

A sync between two systems that can run twice and never duplicate.

Standard library only. No network, no database, no packages to install.

```bash
cd projects/02-ledger
python -I verify.py
```

That fails at first. Twenty-two acceptance criteria are waiting for five
functions in `ledger.py`, each marked `TODO` with the rules it has to satisfy.
Write them one milestone at a time and run the verifier after each.

## Try the real thing too

```bash
cp source.example.json source.json
python -I ledger.py --source source.json
python -I ledger.py --source source.json
```

The second run is the point. If anything other than `unchanged` moves, it is
not idempotent yet. Then edit a record and run again; then delete one from
`source.json` and run again, and watch it get marked rather than vanish.

`state.json` is the destination. `sync-log.jsonl` is one line per run. Both
are safe to delete if you want to start over.

## What the verifier does and does not tell you

It checks behaviour against the acceptance criteria on the project page. It
does not check that your code is good, and it cannot check the things that
actually matter in production:

- Have you run it against the real source twice and diffed the result?
- What happens when the source returns three records instead of three
  thousand because its API was half-down? `reconcile` will cheerfully mark the
  other 2,997 as leavers. What guard did you add, and why that one?
- Can someone else read `sync-log.jsonl` and tell what happened last Tuesday?

## Write these down here as you go

Two decisions the verifier deliberately leaves open, because both have a
defensible answer and having to justify yours is the exercise:

**Which fields make up the natural key, and why.** Pick wrong in one direction
and two real people merge into one row; pick wrong in the other and one person
becomes two. Say what you chose and what would break it.

**What stops a truncated source wiping your destination.** A minimum record
count, a percentage drop, a manual flag — any is defensible. None is not.

<!-- your notes -->
