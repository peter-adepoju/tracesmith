"use client";

import { useMemo, useState } from "react";

/**
 * Read a JSON document the way you read a response.
 *
 * Edit it and three things update together: the parse result, a tree you can
 * walk, and the path to whatever you click. The path matters most — "the
 * total is missing" is weak, and "data.orders[0].total is null" is a finding
 * nobody can argue with.
 *
 * Broken JSON gets the line and column, because "Unexpected token" on its own
 * sends people hunting through eighty lines.
 */

type Props = {
  /** Starting document. */
  value?: string;
  /** Guidance shown above the editor. */
  task?: string;
  rows?: number;
};

const DEFAULT = `{
  "status": "success",
  "data": {
    "order": {
      "reference": "ORDER-1001",
      "paid": true,
      "amount": 4850000,
      "currency": "NGN",
      "customer": {
        "name": "Ada Obi",
        "email": null
      },
      "items": [
        { "sku": "mer-01", "qty": 1 },
        { "sku": "mer-08", "qty": 2 }
      ],
      "notes": "",
      "refunds": []
    }
  }
}`;

type Line = { path: string; key: string; preview: string; depth: number; kind: string };

function describe(value: unknown): { kind: string; preview: string } {
  if (value === null) return { kind: "null", preview: "null" };
  if (Array.isArray(value)) {
    return { kind: "array", preview: `[] ${value.length} item${value.length === 1 ? "" : "s"}` };
  }
  switch (typeof value) {
    case "object":
      return { kind: "object", preview: `{} ${Object.keys(value as object).length} keys` };
    case "string":
      return {
        kind: "string",
        preview: (value as string) === "" ? '"" empty string' : `"${value as string}"`,
      };
    case "number":
      return { kind: "number", preview: String(value) };
    case "boolean":
      return { kind: "boolean", preview: String(value) };
    default:
      return { kind: typeof value, preview: String(value) };
  }
}

const TONE: Record<string, string> = {
  null: "text-bad",
  string: "text-ok",
  number: "text-accent",
  boolean: "text-warn",
  object: "text-muted",
  array: "text-muted",
};

function flatten(value: unknown, path: string, key: string, depth: number, out: Line[]) {
  if (depth > 7 || out.length > 120) return;
  const { kind, preview } = describe(value);
  out.push({ path, key, preview, depth, kind });

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      flatten(item, `${path}[${index}]`, `[${index}]`, depth + 1, out),
    );
  } else if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) {
      flatten(child, path ? `${path}.${childKey}` : childKey, childKey, depth + 1, out);
    }
  }
}

/** Turn a parse failure into a line and column. */
function locate(text: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const at = message.match(/position (\d+)/);
  if (!at) return message;
  const index = Number(at[1]);
  const before = text.slice(0, index);
  const line = before.split("\n").length;
  const column = index - before.lastIndexOf("\n");
  return `${message}  →  line ${line}, column ${column}`;
}

export function JsonExplorer({ value = DEFAULT, task, rows = 14 }: Props) {
  const [text, setText] = useState(value.trim());
  const [picked, setPicked] = useState<Line | null>(null);

  const parsed = useMemo(() => {
    try {
      return { ok: true as const, value: JSON.parse(text) };
    } catch (error) {
      return { ok: false as const, error: locate(text, error) };
    }
  }, [text]);

  const lines = useMemo(() => {
    if (!parsed.ok) return [];
    const out: Line[] = [];
    flatten(parsed.value, "", "(root)", 0, out);
    return out;
  }, [parsed]);

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          JSON explorer
        </span>
        <span
          className={`ml-auto rounded px-2 py-0.5 font-mono text-xs ${
            parsed.ok ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"
          }`}
        >
          {parsed.ok ? "valid" : "invalid"}
        </span>
        {text !== value.trim() ? (
          <button
            type="button"
            onClick={() => setText(value.trim())}
            className="rounded border border-border px-2 py-0.5 text-xs"
          >
            Reset
          </button>
        ) : null}
      </div>

      {task ? (
        <p className="border-b border-border bg-accent-soft px-3 py-2 text-xs">
          {task}
        </p>
      ) : null}

      <div className="grid md:grid-cols-2">
        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setPicked(null);
          }}
          spellCheck={false}
          rows={rows}
          className="resize-y border-b border-border bg-[var(--code-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--code-text)] outline-none md:border-b-0 md:border-r"
          aria-label="JSON document"
        />

        <div className="max-h-96 overflow-auto p-2">
          {!parsed.ok ? (
            <p className="rounded-lg border border-bad/40 bg-bad-soft p-2.5 font-mono text-xs">
              {parsed.error}
            </p>
          ) : (
            <ul className="font-mono text-xs leading-relaxed">
              {lines.map((line) => (
                <li key={line.path || "root"}>
                  <button
                    type="button"
                    onClick={() => setPicked(line)}
                    style={{ paddingLeft: line.depth * 12 + 4 }}
                    className={`block w-full rounded py-0.5 text-left hover:bg-surface-2 ${
                      picked?.path === line.path ? "bg-surface-2" : ""
                    }`}
                  >
                    <span className="text-muted">{line.key}</span>
                    <span className={`ml-2 ${TONE[line.kind] ?? ""}`}>
                      {line.preview}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <figcaption className="border-t border-border p-3 text-sm">
        {picked ? (
          <>
            <p className="font-mono text-xs">
              <span className="text-muted">path </span>
              {picked.path || "(root)"}
            </p>
            <p className="mt-1">
              Type <strong>{picked.kind}</strong>.{" "}
              {picked.kind === "null"
                ? "Present, and deliberately empty. Different from the key being absent — the server is telling you it knows and has nothing."
                : picked.kind === "array" && picked.preview.startsWith("[] 0")
                  ? "An empty array. The key exists and there are genuinely no items, which is not the same as the key being missing."
                  : picked.preview.includes("empty string")
                    ? "An empty string. Present, and blank. Worth asking whether that is allowed."
                    : "Click another row to see its path."}
            </p>
          </>
        ) : parsed.ok ? (
          <p className="text-muted">
            Click any row to get its path. That path is what turns a vague
            report into a precise one.
          </p>
        ) : (
          <p className="text-muted">
            Fix the document to explore it. The line and column above are
            where the parser gave up, which is usually just after the real
            mistake.
          </p>
        )}
      </figcaption>
    </figure>
  );
}
