"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A real console, pointed at a deliberately flawed page.
 *
 * The page below is rendered in an iframe and your queries run against *its*
 * document, so the one-line audits from the lesson return real answers about
 * real markup. It has genuine defects planted in it: images with no alt, an
 * input with no name, a link opening a new tab without rel=noopener, and a
 * heading level skipped.
 *
 * Your code is evaluated in your own browser against that sandbox document.
 * Nothing leaves the page and nothing can reach the rest of the site.
 */

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
 body{font:14px/1.5 ui-sans-serif,system-ui,sans-serif;margin:12px;color:#1b1a17}
 img{width:54px;height:40px;background:#ddd8cf;border-radius:4px}
 .row{display:flex;gap:8px;margin:8px 0}
 input,button{font:inherit;padding:4px 6px}
</style></head><body>
  <h1>Meridian orders</h1>
  <h3>Recent</h3>

  <div class="row">
    <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Field jacket">
    <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
    <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
  </div>

  <form>
    <label for="ref">Reference</label>
    <input id="ref" name="reference" value="ORDER-1001">
    <label for="note">Note</label>
    <input id="note" value="no name attribute">
    <button type="submit">Filter</button>
  </form>

  <h2>Help</h2>
  <p>
    <a href="https://example.com" target="_blank">Docs</a>
    <a href="https://example.com" target="_blank" rel="noopener">Support</a>
  </p>
</body></html>`;

const PRESETS: { label: string; code: string; finds: string }[] = [
  {
    label: "Images missing alt",
    code: `$$('img').filter(i => !i.hasAttribute('alt')).length`,
    finds: "How many images a screen reader cannot describe.",
  },
  {
    label: "Heading outline",
    code: `$$('h1,h2,h3,h4,h5,h6').map(h => h.tagName)`,
    finds: "Read it as a table of contents. Any level skipped?",
  },
  {
    label: "Fields that never submit",
    code: `$$('input, select, textarea').filter(f => !f.name).length`,
    finds: "A field with no name is dropped from the request entirely.",
  },
  {
    label: "Unsafe new-tab links",
    code: `$$('a[target="_blank"]:not([rel*="noopener"])').length`,
    finds: "Each one hands the opened page a reference back to yours.",
  },
  {
    label: "Count everything",
    code: `$$('*').length`,
    finds: "A rough sense of how heavy the page is.",
  },
];

type Entry = { code: string; result: string; error: boolean };

export function ConsoleLab() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [code, setCode] = useState(PRESETS[0].code);
  const [log, setLog] = useState<Entry[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [log]);

  function show(value: unknown): string {
    if (value === undefined) return "undefined";
    if (value === null) return "null";
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      const items = value.map((item) =>
        item instanceof Element
          ? `<${item.tagName.toLowerCase()}${item.id ? "#" + item.id : ""}>`
          : String(item),
      );
      return `(${value.length}) [${items.slice(0, 12).join(", ")}${
        items.length > 12 ? ", …" : ""
      }]`;
    }
    if (value instanceof Element) {
      return `<${value.tagName.toLowerCase()}>`;
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value).slice(0, 300);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  function run() {
    // Guard here rather than disabling the button on an onLoad flag: a srcDoc
    // iframe often fires load before React attaches the handler, which would
    // leave the button disabled forever.
    const doc = frameRef.current?.contentDocument;
    if (!doc?.body) {
      setLog((previous) => [
        ...previous,
        { code, result: "The sample page is still loading. Try again.", error: true },
      ]);
      return;
    }

    // The same two helpers DevTools gives you.
    const $ = (selector: string) => doc.querySelector(selector);
    const $$ = (selector: string) => Array.from(doc.querySelectorAll(selector));

    let result: string;
    let error = false;
    try {
      // Evaluated against the sandbox document, in your own browser.
      const fn = new Function(
        "document",
        "$",
        "$$",
        `"use strict"; return (${code});`,
      );
      result = show(fn(doc, $, $$));
    } catch (exception) {
      error = true;
      result =
        exception instanceof Error
          ? `${exception.name}: ${exception.message}`
          : String(exception);
    }
    setLog((previous) => [...previous, { code, result, error }].slice(-25));
  }

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Console, on a page with real defects
        </span>
      </div>

      <iframe
        ref={frameRef}
        srcDoc={PAGE}
        title="Sample page under inspection"
        sandbox="allow-same-origin"
        className="h-52 w-full border-b border-border bg-white"
      />

      <div className="no-touch-target flex flex-wrap gap-1.5 border-b border-border p-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setCode(preset.code)}
            className="rounded border border-border px-2 py-1 text-xs text-muted transition-colors hover:text-text"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="max-h-56 overflow-y-auto bg-[var(--code-bg)] p-3 font-mono text-xs text-[var(--code-text)]">
        {log.length === 0 ? (
          <p className="opacity-60">
            Pick a query above, or write your own, then press Run.
          </p>
        ) : (
          log.map((entry, index) => (
            <div key={index} className="mb-2">
              <div className="opacity-60">&gt; {entry.code}</div>
              <div className={entry.error ? "text-red-400" : "text-emerald-300"}>
                {entry.result}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 border-t border-border p-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") run();
          }}
          spellCheck={false}
          className="min-w-0 flex-1 rounded-md border border-border bg-bg px-2 py-2 font-mono text-xs"
          aria-label="Console expression"
        />
        <button
          type="button"
          onClick={run}
          className="rounded-md bg-accent px-3 py-2 text-xs font-medium text-white"
        >
          Run
        </button>
      </div>

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        <code>$</code> and <code>$$</code> work exactly as they do in DevTools.
        Four defects are planted in that page: find them all, then write one
        finding for each. Your code runs in your own browser against the
        sandbox document only.
      </figcaption>
    </figure>
  );
}
