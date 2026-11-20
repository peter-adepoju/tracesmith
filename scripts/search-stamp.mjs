/**
 * A fingerprint of everything the search index is built from.
 *
 * It is embedded in the generated file so `npm run validate` can tell that a
 * lesson was edited and the index was not rebuilt. Without it a stale index is
 * invisible: search simply stops finding the paragraph you just wrote, and
 * nothing anywhere says why.
 *
 * It lives in its own module, with no side effects, so both the generator and
 * the validator can import it. Putting it in the generator would mean
 * importing it ran the generator.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("..", import.meta.url));
const contentDir = join(root, "content");

/**
 * Hash the bytes, but not the line endings.
 *
 * Git on Windows checks these files out with CRLF, so hashing raw bytes makes
 * the stamp change on a fresh clone and validate reports a stale index when
 * nothing has changed at all. A false alarm in a staleness check is worse than
 * none: people learn to ignore it.
 */
function normalised(buffer) {
  return buffer.toString("utf8").replace(/\r\n/g, "\n");
}

export async function inputStamp() {
  const hash = createHash("sha256");

  const weeks = (await readdir(contentDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^w\d{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  for (const week of weeks) {
    const files = (await readdir(join(contentDir, week)))
      .filter((name) => /^d\d{2}\.mdx$/.test(name))
      .sort();
    for (const name of files) {
      hash.update(`${week}/${name}`);
      hash.update(normalised(await readFile(join(contentDir, week, name))));
    }
  }

  for (const source of ["curriculum.ts", "labs.ts", "projects.ts"]) {
    hash.update(normalised(await readFile(join(root, "src/lib", source))));
  }

  // The generator itself counts: changing how text is extracted changes the
  // index without changing a single lesson.
  hash.update(normalised(await readFile(join(root, "scripts/build-search-index.mjs"))));

  return hash.digest("hex").slice(0, 16);
}
