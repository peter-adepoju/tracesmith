-- Trace: database schema.
--
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Every table is protected by row-level security, so a signed-in person can
-- only ever read and write their own rows. That is why the publishable key is
-- safe to ship in the browser.

-- ---------------------------------------------------------------------------
-- Lesson progress: one row per person per day of the course.
-- ---------------------------------------------------------------------------
create table if not exists public.progress (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  day_key      text        not null,              -- e.g. 'w01d03'
  completed_at timestamptz,
  quiz_score   smallint,                          -- correct answers
  quiz_total   smallint,                          -- questions asked
  updated_at   timestamptz not null default now(),
  primary key (user_id, day_key)
);

alter table public.progress enable row level security;

drop policy if exists "own progress" on public.progress;
create policy "own progress" on public.progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Flashcards: FSRS scheduling state, one row per person per card.
-- Card text lives in the repo; only the schedule lives here.
-- ---------------------------------------------------------------------------
create table if not exists public.cards (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  card_id      text        not null,              -- stable id from content
  due          timestamptz not null default now(),
  stability    real        not null default 0,
  difficulty   real        not null default 0,
  learning_steps integer   not null default 0,
  scheduled_days integer   not null default 0,
  reps         integer     not null default 0,
  lapses       integer     not null default 0,
  state        smallint    not null default 0,    -- ts-fsrs State enum
  last_review  timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, card_id)
);

alter table public.cards enable row level security;

drop policy if exists "own cards" on public.cards;
create policy "own cards" on public.cards
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists cards_due_idx on public.cards (user_id, due);

-- ---------------------------------------------------------------------------
-- Exercise attempts: kept so you can see which exercises you struggled with.
-- ---------------------------------------------------------------------------
create table if not exists public.attempts (
  id          bigserial   primary key,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  day_key     text        not null,
  exercise_id text        not null,
  passed      boolean     not null,
  answer      text,
  created_at  timestamptz not null default now()
);

alter table public.attempts enable row level security;

drop policy if exists "own attempts" on public.attempts;
create policy "own attempts" on public.attempts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists attempts_day_idx on public.attempts (user_id, day_key);

-- ---------------------------------------------------------------------------
-- Notebook: one row per person per note.
--
-- The document is stored as the editor's own JSON rather than HTML, which is
-- what every export walks, so a synced note comes back identical rather than
-- approximately. Images live inside that JSON as data URLs: it keeps a note
-- self-contained and exportable offline, at the cost of some large rows.
--
-- deleted_at is a tombstone, not a flag nobody reads. Without it, deleting a
-- note on your laptop and then opening your phone would simply put it back,
-- because "missing here" and "deleted everywhere" are indistinguishable.
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  id         text        not null,              -- the note's own id
  title      text        not null default '',
  doc        jsonb       not null,              -- TipTap/ProseMirror document
  tags       text[]      not null default '{}',
  source     jsonb,                             -- lesson it was clipped from
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

alter table public.notes enable row level security;

drop policy if exists "own notes" on public.notes;
create policy "own notes" on public.notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notes_updated_idx on public.notes (user_id, updated_at desc);
