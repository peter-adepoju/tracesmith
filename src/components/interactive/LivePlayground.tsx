"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * An editable HTML and CSS sandbox with a live preview and a DOM tree.
 *
 * The workhorse of the hands-on lessons. The tree is read back from the
 * rendered iframe rather than parsed from the text, so it shows what the
 * browser actually *built* — including its silent repairs to broken markup.
 * That is the whole point of several lessons, and seeing it happen to your own
 * typing lands harder than being told.
 */

type Props = {
  html: string;
  css?: string;
  /** Show the DOM tree panel. On by default. */
  tree?: boolean;
  /** Preview height in rem. */
  height?: number;
  /** A line of guidance shown above the editors. */
  task?: string;
};

type Node = { tag: string; depth: number; note?: string; text?: string };

export function LivePlayground({
  html,
  css = "",
  tree = true,
  height = 14,
  task,
}: Props) {
  const [htmlText, setHtmlText] = useState(html.trim());
  const [cssText, setCssText] = useState(css.trim());
  const [tab, setTab] = useState<"html" | "css">("html");
  const [nodes, setNodes] = useState<Node[]>([]);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font:15px/1.5 ui-sans-serif,system-ui,sans-serif;margin:12px;color:#1b1a17;background:#fff}
    ${cssText}
  </style></head><body>${htmlText}</body></html>`;

  /** Read the rendered tree back out of the iframe. */
  const readTree = useCallback(() => {
    const body = frameRef.current?.contentDocument?.body;
    if (!body) return;
    const out: Node[] = [];
    const walk = (el: Element, depth: number) => {
      if (depth > 8 || out.length > 60) return;
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent?.trim())
        .filter(Boolean)
        .join(" ");
      out.push({
        tag: el.tagName.toLowerCase(),
        depth,
        text: own ? own.slice(0, 32) : undefined,
      });
      for (const child of Array.from(el.children)) walk(child, depth + 1);
    };
    for (const child of Array.from(body.children)) walk(child, 0);
    setNodes(out);
  }, []);

  useEffect(() => {
    const id = setTimeout(readTree, 60);
    return () => clearTimeout(id);
  }, [doc, readTree]);

  const dirty = htmlText !== html.trim() || cssText !== css.trim();

  return (
    <div className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Try it
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("html")}
            className={`rounded px-2 py-0.5 text-xs ${tab === "html" ? "bg-bg font-medium" : "text-muted"}`}
          >
            HTML
          </button>
          {css !== "" || cssText !== "" ? (
            <button
              type="button"
              onClick={() => setTab("css")}
              className={`rounded px-2 py-0.5 text-xs ${tab === "css" ? "bg-bg font-medium" : "text-muted"}`}
            >
              CSS
            </button>
          ) : null}
        </div>
        {dirty ? (
          <button
            type="button"
            onClick={() => {
              setHtmlText(html.trim());
              setCssText(css.trim());
            }}
            className="ml-auto rounded border border-border px-2 py-0.5 text-xs"
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
          value={tab === "html" ? htmlText : cssText}
          onChange={(event) =>
            tab === "html"
              ? setHtmlText(event.target.value)
              : setCssText(event.target.value)
          }
          spellCheck={false}
          className="resize-y border-b border-border bg-[var(--code-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--code-text)] outline-none md:border-b-0 md:border-r"
          style={{ minHeight: `${height}rem` }}
          aria-label={tab === "html" ? "HTML editor" : "CSS editor"}
        />
        <iframe
          ref={frameRef}
          srcDoc={doc}
          onLoad={readTree}
          title="Live preview"
          sandbox="allow-same-origin"
          className="w-full bg-white"
          style={{ minHeight: `${height}rem` }}
        />
      </div>

      {tree ? (
        <div className="border-t border-border p-3">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
            What the browser actually built
          </p>
          <ul className="mt-1.5 font-mono text-xs leading-relaxed">
            {nodes.length === 0 ? (
              <li className="text-muted">(nothing yet)</li>
            ) : (
              nodes.map((node, index) => (
                <li key={index} style={{ paddingLeft: node.depth * 14 }}>
                  <span className="text-accent">&lt;{node.tag}&gt;</span>
                  {node.text ? (
                    <span className="text-muted"> {node.text}</span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Read back from the rendered page, not from your text. If this does
            not match what you typed, the browser repaired something.
          </p>
        </div>
      ) : null}
    </div>
  );
}
