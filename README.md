# Tracesmith

A course on **QA testing, technical support and AI automation**, from zero.

A *trace* is what every one of those three jobs reads: a tester finds it in the
Network tab, a support engineer finds it in a log, an automation writes it to a
run log. A **tracesmith** is someone who can take any system and say, with
evidence, what it actually did.

One merged path rather than three separate tracks, because all three jobs rest
on the same skill: being able to say, with evidence, what a system actually
did. A tester reads it in the Network tab, a support engineer reads it in a
log, an automation writes it to a run log.

Twenty-six weeks, six days a week, 156 days, in five phases:

| Phase | Weeks | What it covers |
| --- | --- | --- |
| 1 | 1–4 | How the web works: HTTP, HTML, CSS, the DOM, DevTools |
| 2 | 5–8 | Data, APIs and evidence: JSON, endpoints, payloads, auth, Postman, webhooks |
| 3 | 9–15 | Quality assurance: test cases, bug reports, regression, API and security testing, Playwright |
| 4 | 16–19 | Technical support: triage, diagnosis, writing, escalation, the payments domain |
| 5 | 20–26 | AI automation: workflows, reliability, models, agents, governance, handover |

## Running it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. It works immediately with no configuration: every
lesson, quiz, flashcard and sandbox runs, and progress is kept in your browser.

## Saving progress across devices (optional)

Progress, quiz scores and the flashcard schedule can sync through Supabase.

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local` and fill in the two values from
   **Project Settings → API**.
3. Open the SQL editor and run `supabase/schema.sql`.
4. Restart the dev server and sign in. Sign-in is a one-time emailed link; there
   is no password.

Both keys are meant to be public. Row-level security in the schema is what
protects the data: every table is restricted to `auth.uid() = user_id`, so one
account can never read another's rows.

## On a phone

Tracesmith is an installable PWA, not just a responsive site.

- **Install it.** Android Chrome offers an Install button; on iOS use Share →
  Add to Home Screen. It then opens full screen with no browser chrome.
- **Offline.** A service worker caches pages you have already opened, so
  lessons you have read stay readable with no connection. The review deck
  works offline too. Live data (`/api/`, `/auth/`) is never cached.
- **Separate mobile layout.** Below `md` the top navigation is replaced by a
  bottom tab bar — Course, Labs, Build, Review — because thumbs reach the
  bottom of a phone. The lab switches the shop and the tools into a segmented
  control rather than trying to show both.
- **Safe areas.** The layout respects the notch and the home indicator through
  `env(safe-area-inset-*)`, which is what stops an installed PWA looking like
  a web page in a frame.

The service worker is registered in production only. A worker caching pages
while you edit them produces baffling stale results.

Regenerate the icons after changing the mark:

```bash
python -I scripts/make-icons.py
```

Pure standard library, no Pillow. It draws the signal trace and writes the
192, 512, maskable and Apple touch icons into `public/`.

## Deploying

1. **Vercel** — import the repo at vercel.com. Next.js is detected; change
   nothing. It deploys and works immediately in guest mode.
2. **Supabase**, for progress that follows you between devices — create a
   project, run `supabase/schema.sql` in the SQL editor, then set these three
   in Vercel's environment variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   NEXT_PUBLIC_SITE_URL
   ```

   The `NEXT_PUBLIC_` prefix is required: without it Next.js will not expose
   the value to browser code and the app silently stays in guest mode. These
   are compiled into the browser bundle and are public by design, so mark them
   Config rather than Secret. Never add the `service_role` key — it bypasses
   the row-level security that protects the data.
3. In Supabase → Authentication → URL Configuration, set the Site URL and add
   `https://<your-app>/auth/callback` as a redirect URL.
4. Redeploy. Vercel does not apply new variables to an existing build.

**Known limitation.** Meridian's API keeps stock and orders in memory. On
Vercel's serverless functions each request may hit a different instance, so
server-side state is unreliable in production: the *stock not decremented*
defect may behave inconsistently. Every client-side lab defect is unaffected.
Moving that store into Supabase is the fix.

## Layout

```
content/
  w01/d01.mdx …     lessons, one file per day
  cards.ts          the spaced-repetition deck
  registry.ts       generated; maps w01d01 to its lesson component
src/
  app/              routes: course map, day, review, sandbox, login
  components/       lesson components (Video, Quiz, Exercise, Callout, Terms…)
  lib/
    curriculum.ts   the whole 156-day map, as data
    videos.ts       the verified video library
    mockApi.ts      the in-browser fake API the sandbox runs on
    cards.ts        FSRS scheduling
    progress.ts     progress storage, Supabase or local
scripts/
  find-videos.py    search YouTube and verify ids through oEmbed
  build-registry.mjs regenerate content/registry.ts
supabase/schema.sql
```

## Adding a lesson

1. Write `content/wNN/dNN.mdx`. The day must already exist in
   `src/lib/curriculum.ts`; its title and objectives come from there, so the
   MDX file is the body only.
2. Run `npm run registry` to pick it up.
3. `npm run build` to check it compiles.

Components available in any lesson without importing: `Callout`, `Video`,
`Quiz`, `Exercise`, `Terms`, `RequestInspector`.

### A note on MDX attributes

MDX is JSX, so an attribute string cannot contain escaped quotes. Where a
solution needs to quote HTML, use the expression form:

```mdx
solution={'Add <meta charset="utf-8" /> to the head.'}
```

## Videos

Every embedded video is real. `src/lib/videos.ts` holds the library, and each
entry was found on YouTube and then confirmed through the public oEmbed
endpoint, which only resolves for videos that exist. Lessons reference entries
by key, so a video that later disappears is replaced in one place.

To find candidates for a new topic:

```bash
python -I scripts/find-videos.py "topic to search"
```

It prints only videos that oEmbed confirms, with channel, runtime and view
count, so nothing invented can reach a lesson.

## The sandbox

`src/lib/mockApi.ts` is a fake payments API that runs entirely in the browser:
no network, no server, nothing that can cost money or touch real data. It is
deliberately strict about the things real APIs are strict about — the right key
for the right call, the right method, required fields, valid JSON — so it can
produce a genuine 400, 401, 403, 404, 405, 422 and 500 on demand.

`RequestInspector` is a practice Network tab over it, with the same Headers,
Payload, Response and Timing tabs you get in DevTools.

## Status

Week 1 is written in full, plus week 2 day 1. Every one of the 156 days exists
in the map with its title and objectives; days without a lesson say so plainly
rather than pretending.
