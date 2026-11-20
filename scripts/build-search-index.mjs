/**
 * Regenerate content/search-index.ts from the lessons, labs and projects.
 *
 *     npm run search-index
 *
 * Why a generated file rather than searching at runtime: the lesson bodies are
 * MDX compiled into React components, so by the time the app is running the
 * prose has become JSX and there is no text left to grep. The text has to be
 * read off disk at build time, which is the same reason content/registry.ts
 * exists.
 *
 * Why a .ts module rather than a .json in public/: Next gives it a
 * content-hashed chunk name. The service worker already caches hashed chunks
 * cache-first, so search keeps working offline and can never serve a stale
 * index — a new deploy means a new URL. A plain /search-index.json would have
 * needed its own caching rule and would have gone stale the first time one
 * was slightly wrong.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { inputStamp } from "./search-stamp.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const contentDir = join(root, "content");

const { WEEKS, dayKey, phaseOf } = await import(
  new URL("../src/lib/curriculum.ts", import.meta.url).href
);
const { LABS } = await import(new URL("../src/lib/labs.ts", import.meta.url).href);
const { PROJECTS, LEVEL_LABEL } = await import(
  new URL("../src/lib/projects.ts", import.meta.url).href
);
const { slug } = await import(new URL("../src/lib/slug.ts", import.meta.url).href);

const warnings = [];

/**
 * Turn MDX into the words a reader would actually see.
 *
 * Component attributes are not metadata here — a Quiz's question, an
 * Exercise's prompt and a Terms definition are some of the most useful text in
 * the course, and dropping them would make the search quietly worse in
 * exactly the places someone is most likely to go looking. So quoted strings
 * are lifted out of each tag before the tag itself is discarded.
 *
 * Code is kept deliberately. On a testing course, "curl -i" and "PUT" are
 * things people search for.
 */
function readable(mdx) {
  let text = mdx.replace(/^(?:import|export)\s.+$/gm, " ");

  // Lift quoted strings out of component tags, then drop the markup.
  text = text.replace(/<[A-Z][A-Za-z0-9]*[\s\S]*?\/?>/g, (tag) => {
    const strings = [];
    for (const match of tag.matchAll(/"([^"]{4,})"|'([^']{4,})'/g)) {
      strings.push(match[1] ?? match[2]);
    }
    return " " + strings.join(" ") + " ";
  });
  text = text.replace(/<\/[A-Za-z][A-Za-z0-9]*>/g, " ");
  text = text.replace(/<[a-z][^>]*>/g, " ");

  // Markdown punctuation, not the words it decorates.
  text = text.replace(/^```.*$/gm, " ");
  text = text.replace(/^\s{0,3}[-*+]\s+/gm, " ");
  text = text.replace(/^\s{0,3}>\s?/gm, " ");
  text = text.replace(/\|/g, " ");
  text = text.replace(/[*_`]/g, "");
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/\\(.)/g, "$1");

  return text.replace(/\s+/g, " ").trim();
}

/** Split a lesson into sections at its `##` headings. */
function sections(mdx) {
  const lines = mdx.split("\n");
  const found = [];
  let current = { heading: null, lines: [] };

  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence;
    // A `##` inside a fenced block is a comment or a markdown example, not a
    // heading. Treating it as one splits a lesson in a place no reader sees.
    const match = !inFence && /^##\s+(.+?)\s*$/.exec(line);
    if (match) {
      found.push(current);
      current = { heading: match[1].trim(), lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  found.push(current);

  return found
    .map((part) => ({ heading: part.heading, text: readable(part.lines.join("\n")) }))
    .filter((part) => part.text.length > 0 || part.heading);
}

const entries = [];

// --- Lessons, one entry per section ---------------------------------------
const weekDirs = (await readdir(contentDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^w\d{2}$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

let lessonCount = 0;
for (const weekDir of weekDirs) {
  const weekNumber = Number(weekDir.slice(1));
  const week = WEEKS.find((item) => item.n === weekNumber);
  if (!week) {
    warnings.push(`content/${weekDir} has no week in curriculum.ts`);
    continue;
  }

  const files = (await readdir(join(contentDir, weekDir)))
    .filter((name) => /^d\d{2}\.mdx$/.test(name))
    .sort();

  for (const file of files) {
    const dayNumber = Number(file.slice(1, 3));
    const day = week.days.find((item) => item.n === dayNumber);
    if (!day) {
      warnings.push(`content/${weekDir}/${file} has no day in curriculum.ts`);
      continue;
    }

    lessonCount += 1;
    const mdx = await readFile(join(contentDir, weekDir, file), "utf8");
    const href = `/day/${weekNumber}/${dayNumber}`;
    const context = `Week ${weekNumber} · Day ${dayNumber} · ${week.title}`;

    // The day itself: its title and objectives, so searching an objective
    // finds the lesson even when the body never phrases it that way.
    entries.push({
      k: "lesson",
      t: day.title,
      c: context,
      u: href,
      x: [day.title, ...(day.objectives ?? [])].join(" "),
    });

    const seen = new Set();
    for (const part of sections(mdx)) {
      if (!part.heading) {
        // The run-up before the first heading belongs to the day entry.
        if (part.text) entries[entries.length - 1].x += " " + part.text;
        continue;
      }
      const anchor = slug(part.heading);
      if (seen.has(anchor)) {
        warnings.push(
          `${weekDir}/${file}: two sections both slug to "${anchor}" — the ` +
            `second link will land on the first`,
        );
      }
      seen.add(anchor);
      entries.push({
        k: "section",
        t: part.heading,
        c: `${day.title} · ${context}`,
        u: `${href}#${anchor}`,
        x: `${part.heading} ${part.text}`,
      });
    }
  }
}

// --- Weeks ----------------------------------------------------------------
for (const week of WEEKS) {
  const phase = phaseOf(week.n);
  entries.push({
    k: "week",
    t: `Week ${week.n}: ${week.title}`,
    c: phase ? `Phase ${phase.n} · ${phase.title}` : "Course",
    u: `/course#week-${week.n}`,
    x: [week.title, week.summary, ...week.days.map((day) => day.title)].join(" "),
  });
}

// --- Labs -----------------------------------------------------------------
for (const lab of LABS) {
  entries.push({
    k: "lab",
    t: lab.title,
    c: `Lab · week ${lab.week} · ${lab.level}`,
    u: `/lab/${lab.id}`,
    x: [
      lab.title,
      lab.summary,
      lab.trains,
      ...lab.stages.flatMap((stage) => [stage.title, stage.brief ?? ""]),
    ].join(" "),
  });
}

// --- Build projects -------------------------------------------------------
for (const project of PROJECTS) {
  entries.push({
    k: "build",
    t: project.name,
    c: `Build · week ${project.week} · ${LEVEL_LABEL[project.level]}`,
    u: `/build/${project.id}`,
    x: [
      project.name,
      project.tagline,
      project.why,
      project.sellable,
      ...project.teaches,
      ...project.constraints,
      ...project.milestones.flatMap((milestone) => [
        milestone.title,
        milestone.brief,
        ...milestone.acceptance,
      ]),
    ].join(" "),
  });
}

// --- Standing pages -------------------------------------------------------
for (const page of [
  { t: "Notebook", c: "Your own record", u: "/notebook", x: "notebook notes clippings export word pdf markdown backup sync" },
  { t: "Review", c: "Spaced repetition", u: "/review", x: "review flashcards spaced repetition due cards recall" },
  { t: "Sandbox", c: "A fake API", u: "/sandbox", x: "sandbox fake api requests responses devtools practise endpoints" },
  { t: "Labs", c: "All labs", u: "/lab", x: "labs meridian defects bug tracker coverage answer key" },
  { t: "Build", c: "All projects", u: "/build", x: "build projects automation n8n python scaffolds verifier" },
]) {
  entries.push({ k: "page", ...page });
}

/*
 * Two files, on purpose.
 *
 * The titles are a tenth of the weight and answer most searches on their own —
 * people look for "idempotency" or "status codes", which are headings. They
 * load first so the box is useful immediately. The bodies are most of the
 * megabyte and arrive a moment later in the background, upgrading the same
 * search to full text without anybody waiting on a spinner.
 *
 * Capping the bodies instead was the obvious way to make one smaller file, and
 * it is the wrong trade: a word late in a long section would simply stop being
 * findable, and a search box that silently cannot find things is worse than a
 * slow one.
 */
const titlesFile = `/**
 * Generated by \`npm run search-index\`. Edit lessons, labs or projects, not
 * this file. \`npm run validate\` fails when it drifts out of date.
 */

export type SearchKind = "lesson" | "section" | "week" | "lab" | "build" | "page";

export type SearchEntry = {
  /** What sort of thing this is, for grouping and for the result's label. */
  k: SearchKind;
  /** The result's own name. */
  t: string;
  /** Where it sits, shown under the name. */
  c: string;
  /** Where it goes. */
  u: string;
};

/**
 * Fingerprint of the lessons, data files and generator this was built from.
 * \`npm run validate\` recomputes it and fails when they have moved on.
 */
export const SEARCH_INDEX_STAMP = "${await inputStamp()}";

export const SEARCH_TITLES: SearchEntry[] = ${JSON.stringify(
  entries.map(({ k, t, c, u }) => ({ k, t, c, u })),
  null,
  0,
)};
`;

const textFile = `/**
 * Generated by \`npm run search-index\`. The full searchable text of every
 * entry in SEARCH_TITLES, in the same order.
 *
 * Kept in its original case: this is what the snippets under each result are
 * cut from, and a result that reads "the rule that matters: safe and
 * idempotent" in flat lower case looks broken. The client lowercases a copy
 * once, after loading, and matches against that.
 *
 * Loaded separately and in the background: this is the heavy half.
 */

export const SEARCH_TEXT: string[] = ${JSON.stringify(
  entries.map((entry) => entry.x),
  null,
  0,
)};
`;

await writeFile(join(contentDir, "search-titles.ts"), titlesFile, "utf8");
await writeFile(join(contentDir, "search-text.ts"), textFile, "utf8");

const titlesKb = Buffer.byteLength(titlesFile, "utf8") / 1024;
const textKb = Buffer.byteLength(textFile, "utf8") / 1024;
const counts = entries.reduce((totals, entry) => {
  totals[entry.k] = (totals[entry.k] ?? 0) + 1;
  return totals;
}, {});

console.log(
  `search index written: ${entries.length} entries ` +
    `(${Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(", ")}) ` +
    `from ${lessonCount} lessons`,
);
console.log(
  `  titles ${titlesKb.toFixed(0)} KB (loads first), text ${textKb.toFixed(0)} KB (follows)`,
);

for (const warning of warnings) console.log(`  warning: ${warning}`);
