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

// --- 4. Every defect a lab references must exist --------------------------
async function checkLabDefects(labsText) {
  const known = new Set(
    [...labsText.matchAll(/^\s{2}"([a-z0-9-]+)":\s*\{$/gm)].map((m) => m[1]),
  );
  const referenced = new Set(
    [...labsText.matchAll(/defects:\s*\[([^\]]*)\]/g)]
      .flatMap((m) => m[1].split(","))
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean),
  );
  for (const id of referenced) {
    if (!known.has(id)) {
      problem(
        "src/lib/labs.ts",
        0,
        `lab references defect "${id}" which is not in DEFECTS — the lab would be unwinnable`,
      );
    }
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
await checkLabDefects(labsText);

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
