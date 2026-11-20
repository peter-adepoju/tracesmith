/**
 * Catch the mistakes that are easy to make and slow to diagnose.
 *
 *     npm run validate
 *
 * Runs in about a second, and is worth running before every build. Each check
 * exists because the mistake it catches has actually happened here, which is
 * the only good reason to add one.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const problems = [];

function problem(file, line, message) {
  problems.push({ file, line, message });
}

// --- 1. Escaped quotes in MDX attributes ----------------------------------
// MDX is JSX, so prompt="he said \"no\"" is a parse error. The fix is the
// expression form: prompt={'he said "no"'}. This has caught us out five times.
async function checkMdxAttributes(file, text) {
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    // An attribute opened with a plain double quote that contains \"
    if (/\b(prompt|solution|hint|title|placeholder)="[^"]*\\"/.test(line)) {
      problem(
        file,
        index + 1,
        'escaped quote inside a plain MDX attribute; use the expression form, e.g. solution={\'...\\"...\'}',
      );
    }
  });
}

// --- 2. Lessons must exist in the curriculum ------------------------------
async function checkLessonsAreMapped(lessonKeys, curriculumText) {
  for (const key of lessonKeys) {
    const week = Number(key.slice(1, 3));
    const day = Number(key.slice(4, 6));
    const weekBlock = new RegExp(`\\n\\s*n:\\s*${week},`).test(curriculumText);
    if (!weekBlock) {
      problem("content/" + key, 0, `week ${week} is not in src/lib/curriculum.ts`);
      continue;
    }
    if (day < 1 || day > 6) {
      problem("content/" + key, 0, `day ${day} is outside the 1 to 6 range`);
    }
  }
}

// --- 3. Every video key a lesson uses must be in the library --------------
async function checkVideoKeys(file, text, knownKeys) {
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    const match = line.match(/<Video\s+id="([^"]+)"/);
    if (match && !knownKeys.has(match[1])) {
      problem(
        file,
        index + 1,
        `unknown video key "${match[1]}" — add it to src/lib/videos.ts, verified through oEmbed`,
      );
    }
  });
}

// --- 4. Every defect a lab references must exist AND be implemented -------
// Declaring a defect is half the work; making Meridian exhibit it is the
// other half. A declared-but-unimplemented defect never appears, which makes
// the lab unwinnable in a way nothing else would catch — so this checks both
// halves rather than only the declaration, as it once did.
async function checkLabDefects(labsText, meridianText) {
  const declared = new Set(
    [...labsText.matchAll(/^\s{2}"([a-z0-9-]+)":\s*\{$/gm)].map((m) => m[1]),
  );
  const referenced = new Set(
    [...labsText.matchAll(/defects:\s*\[([^\]]*)\]/g)]
      .flatMap((m) => m[1].split(","))
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean),
  );

  for (const id of referenced) {
    if (!declared.has(id)) {
      problem(
        "src/lib/labs.ts",
        0,
        `lab references defect "${id}" which is not in DEFECTS — the lab would be unwinnable`,
      );
    }
  }

  // Every declared defect must be named somewhere Meridian can act on it.
  for (const id of declared) {
    if (!meridianText.includes(`"${id}"`)) {
      problem(
        "src/lib/labs.ts",
        0,
        `defect "${id}" is declared but never referenced in Meridian — it can never appear, so any lab using it is unwinnable`,
      );
    }
  }
}

// --- 5. Manifest images must exist and be the size they claim -------------
// Chrome does not complain about a manifest image whose declared sizes are
// wrong — it silently ignores it, and ignores the whole screenshot set if the
// aspect ratios disagree. So a mistyped number costs the install dialog with
// no error anywhere. Both have happened here.

/** Pixel dimensions of a PNG or JPEG, read from the file's own header. */
function imageSize(buffer) {
  // PNG: an 8-byte signature, then an IHDR chunk carrying width and height.
  if (buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  // JPEG: walk the marker segments to the start-of-frame, which holds them.
  if (buffer.length > 4 && buffer.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) return null;
      const marker = buffer[offset + 1];
      // SOF0 to SOF15, excluding the four that are not frame headers.
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }
  return null;
}

async function checkManifestImages(manifest) {
  const entries = [
    ...(manifest.icons ?? []).map((item) => ({ ...item, kind: "icon" })),
    ...(manifest.screenshots ?? []).map((item) => ({ ...item, kind: "screenshot" })),
  ];

  const ratios = new Map();

  for (const entry of entries) {
    const file = join(root, "public", entry.src.replace(/^\//, ""));
    let buffer;
    try {
      buffer = await readFile(file);
    } catch {
      problem("public/manifest.webmanifest", 0, `${entry.kind} ${entry.src} does not exist`);
      continue;
    }

    const actual = imageSize(buffer);
    if (!actual) {
      problem("public/manifest.webmanifest", 0, `${entry.kind} ${entry.src} is not a readable PNG or JPEG`);
      continue;
    }

    const claimed = `${actual.width}x${actual.height}`;
    if (entry.sizes !== claimed) {
      problem(
        "public/manifest.webmanifest",
        0,
        `${entry.kind} ${entry.src} says sizes "${entry.sizes}" but is ${claimed} — the browser ignores it without saying so`,
      );
    }

    if (entry.kind !== "screenshot") continue;

    // Every screenshot of one form factor must share an aspect ratio, or the
    // browser drops the set and shows the plain install dialog instead.
    const ratio = actual.width / actual.height;
    const seen = ratios.get(entry.form_factor);
    if (seen && Math.abs(seen.ratio - ratio) > 0.01) {
      problem(
        "public/manifest.webmanifest",
        0,
        `screenshot ${entry.src} is ${claimed} but ${seen.src} is a different shape — same form_factor must mean same aspect ratio, or the whole set is dropped`,
      );
    } else if (!seen) {
      ratios.set(entry.form_factor, { ratio, src: entry.src });
    }

    // The long side may be at most 2.3x the short one, and neither below 320.
    const long = Math.max(actual.width, actual.height);
    const short = Math.min(actual.width, actual.height);
    if (short < 320 || long > 3840 || long > short * 2.3) {
      problem(
        "public/manifest.webmanifest",
        0,
        `screenshot ${entry.src} is ${claimed}, outside what a browser will display (320 to 3840 px, long side at most 2.3x the short)`,
      );
    }
  }
}

// --- 6. The search index must match the content it was built from ---------
// A stale index is the quietest failure here: search just stops finding the
// paragraph you wrote this morning, and nothing says why.
async function checkSearchIndex() {
  let generated;
  try {
    generated = await readFile(join(root, "content/search-titles.ts"), "utf8");
  } catch {
    problem(
      "content/search-titles.ts",
      0,
      "the search index has never been built — run `npm run search-index`",
    );
    return;
  }

  const stamped = /SEARCH_INDEX_STAMP = "([a-f0-9]+)"/.exec(generated);
  if (!stamped) {
    problem(
      "content/search-titles.ts",
      0,
      "the search index has no stamp; rebuild it with `npm run search-index`",
    );
    return;
  }

  const { inputStamp } = await import("./search-stamp.mjs");
  const current = await inputStamp();
  if (stamped[1] !== current) {
    problem(
      "content/search-titles.ts",
      0,
      "the search index is out of date — lessons, labs, projects or the " +
        "generator changed since it was built. Run `npm run search-index`",
    );
  }
}

// --- run ------------------------------------------------------------------
const contentDir = join(root, "content");
const weeks = (await readdir(contentDir, { withFileTypes: true }))
  .filter((e) => e.isDirectory() && /^w\d{2}$/.test(e.name))
  .map((e) => e.name);

const videosText = await readFile(join(root, "src/lib/videos.ts"), "utf8");
const videoKeys = new Set(
  [...videosText.matchAll(/^\s{2}"?([a-zA-Z0-9-]+)"?:\s*\{$/gm)].map((m) => m[1]),
);

const curriculumText = await readFile(join(root, "src/lib/curriculum.ts"), "utf8");
const labsText = await readFile(join(root, "src/lib/labs.ts"), "utf8");

const lessonKeys = [];
for (const week of weeks) {
  const files = (await readdir(join(contentDir, week))).filter((f) =>
    f.endsWith(".mdx"),
  );
  for (const name of files) {
    const path = join(contentDir, week, name);
    const text = await readFile(path, "utf8");
    const label = `content/${week}/${name}`;
    lessonKeys.push(`${week}${name.replace(".mdx", "")}`);
    await checkMdxAttributes(label, text);
    await checkVideoKeys(label, text, videoKeys);
  }
}

await checkLessonsAreMapped(lessonKeys, curriculumText);
// Both files Meridian's behaviour can live in, concatenated: a defect is
// implemented if either the API route or the catalogue names it.
const meridianText = (
  await Promise.all(
    [
      "src/app/api/meridian/[...path]/route.ts",
      "src/app/meridian/page.tsx",
    ].map((p) => readFile(join(root, p), "utf8")),
  )
).join("\n");

await checkLabDefects(labsText, meridianText);

await checkManifestImages(
  JSON.parse(await readFile(join(root, "public/manifest.webmanifest"), "utf8")),
);

await checkSearchIndex();

if (problems.length === 0) {
  console.log(
    `validate: ok — ${lessonKeys.length} lessons, ${videoKeys.size} videos, no problems`,
  );
  process.exit(0);
}

for (const { file, line, message } of problems) {
  console.log(`  ${file}${line ? ":" + line : ""}\n    ${message}`);
}
console.log(`\nvalidate: ${problems.length} problem(s)`);
process.exit(1);
