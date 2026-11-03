"use client";

import { useState } from "react";

/**
 * Drag a layout through its breakpoints.
 *
 * The page really is rendered at the chosen width in an iframe, with real
 * media queries, so the jumps you see are the jumps a phone sees. The marks
 * on the track are the breakpoints, which is the thing a tester has to find
 * before they can test either side of one.
 */

const BREAKPOINTS = [480, 768, 1024];
const MIN = 320;
const MAX = 1200;

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}
  body{font:14px/1.5 ui-sans-serif,system-ui,sans-serif;margin:0;color:#1b1a17;background:#fff}
  header{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #e4e0d9}
  .brand{font-weight:700}
  nav{display:none;gap:12px;margin-left:auto}
  .burger{margin-left:auto;border:1px solid #d9d4cb;border-radius:6px;padding:4px 8px}
  main{display:grid;gap:10px;padding:12px}
  .card{border:1px solid #e4e0d9;border-radius:8px;padding:10px;background:#faf9f7}
  aside{display:none;border:1px dashed #cfc9bd;border-radius:8px;padding:10px;color:#6b6559}
  .tag{position:fixed;right:6px;bottom:6px;background:#1b1a17;color:#fff;
       font:11px ui-monospace,monospace;padding:2px 6px;border-radius:4px}
  .tag::after{content:"base (under 480)"}

  @media (min-width:480px){
    main{grid-template-columns:repeat(2,1fr)}
    .tag::after{content:"480+"}
  }
  @media (min-width:768px){
    nav{display:flex}
    .burger{display:none}
    main{grid-template-columns:repeat(3,1fr)}
    .tag::after{content:"768+ nav shown"}
  }
  @media (min-width:1024px){
    main{grid-template-columns:2fr 2fr 2fr 1fr}
    aside{display:block}
    .tag::after{content:"1024+ sidebar shown"}
  }
</style></head><body>
  <header>
    <span class="brand">Meridian</span>
    <nav><span>Shop</span><span>Orders</span><span>Account</span></nav>
    <button class="burger">Menu</button>
  </header>
  <main>
    <div class="card">Product one</div>
    <div class="card">Product two</div>
    <div class="card">Product three</div>
    <aside>Filters</aside>
  </main>
  <span class="tag"></span>
</body></html>`;

export function ViewportSlider() {
  const [width, setWidth] = useState(375);

  const active =
    width >= 1024 ? 1024 : width >= 768 ? 768 : width >= 480 ? 480 : null;

  return (
    <figure className="no-touch-target my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Drag through the breakpoints
        </span>
        <span className="ml-auto font-mono text-sm font-semibold">{width}px</span>
      </div>

      <div className="px-3 pt-3">
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={width}
          onChange={(event) => setWidth(Number(event.target.value))}
          className="w-full accent-[var(--accent)]"
          aria-label="Viewport width"
        />
        {/* Breakpoint marks under the track */}
        <div className="relative mt-1 h-5">
          {BREAKPOINTS.map((bp) => (
            <button
              key={bp}
              type="button"
              onClick={() => setWidth(bp)}
              style={{ left: `${((bp - MIN) / (MAX - MIN)) * 100}%` }}
              className={`absolute -translate-x-1/2 font-mono text-[0.625rem] ${
                active === bp ? "font-bold text-accent" : "text-muted"
              }`}
            >
              |{bp}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 pb-2">
          {[320, 375, 414, 768, 1024, 1280].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWidth(Math.min(MAX, w))}
              className="rounded border border-border px-1.5 py-0.5 font-mono text-[0.625rem] text-muted"
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto bg-surface-2 p-3">
        <iframe
          srcDoc={PAGE}
          title={`Layout at ${width} pixels`}
          sandbox=""
          style={{ width, height: 270 }}
          className="mx-auto block rounded-lg border border-border bg-white"
        />
      </div>

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Three breakpoints are live in this page. Drag slowly across 480, 768
        and 1024 and watch what changes at each: the columns, then the
        navigation, then the sidebar. Test <strong>either side</strong> of a
        breakpoint and exactly on it — 767, 768 and 769, not 400 and 1200.
      </figcaption>
    </figure>
  );
}
