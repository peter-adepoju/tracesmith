"use client";

import { useState } from "react";

/**
 * The box model, with the arithmetic shown.
 *
 * Drag the sliders and watch the total width change. The box-sizing toggle is
 * the point of the whole thing: flipping it makes the same numbers produce a
 * different box, which is the explanation for a whole family of "why is this
 * element too wide" bugs.
 */

const Slider = ({
  label,
  value,
  set,
  max,
  tone,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  max: number;
  tone: string;
}) => (
  <label className="block">
    <span className="flex items-baseline justify-between text-xs">
      <span className="flex items-center gap-1.5">
        <span className={`inline-block h-2.5 w-2.5 rounded-sm ${tone}`} />
        {label}
      </span>
      <span className="font-mono text-muted">{value}px</span>
    </span>
    <input
      type="range"
      min={0}
      max={max}
      value={value}
      onChange={(event) => set(Number(event.target.value))}
      className="mt-1 w-full accent-[var(--accent)]"
    />
  </label>
);

export function BoxModel() {
  const [width, setWidth] = useState(200);
  const [padding, setPadding] = useState(20);
  const [border, setBorder] = useState(4);
  const [margin, setMargin] = useState(16);
  const [borderBox, setBorderBox] = useState(false);

  const contentWidth = borderBox
    ? Math.max(0, width - padding * 2 - border * 2)
    : width;
  const boxWidth = contentWidth + padding * 2 + border * 2;
  const spaceWidth = boxWidth + margin * 2;

  return (
    <figure className="no-touch-target my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          The box model
        </span>
        <label className="ml-auto flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={borderBox}
            onChange={(event) => setBorderBox(event.target.checked)}
          />
          <code>box-sizing: border-box</code>
        </label>
      </div>

      {/* The box, drawn to scale */}
      <div className="overflow-x-auto bg-surface-2 p-4">
        <div
          className="mx-auto bg-orange-200/40 ring-1 ring-dashed ring-orange-400/60"
          style={{ padding: margin, width: "fit-content" }}
          title={`margin: ${margin}px`}
        >
          <div
            className="bg-slate-400/30"
            style={{ padding: border }}
            title={`border: ${border}px`}
          >
            <div
              className="bg-emerald-300/40"
              style={{ padding }}
              title={`padding: ${padding}px`}
            >
              <div
                className="grid h-14 place-items-center bg-sky-400/40 text-xs font-medium"
                style={{ width: contentWidth }}
                title={`content: ${contentWidth}px`}
              >
                content {contentWidth}px
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <Slider label="width" value={width} set={setWidth} max={320} tone="bg-sky-400/60" />
        <Slider label="padding" value={padding} set={setPadding} max={60} tone="bg-emerald-300/70" />
        <Slider label="border" value={border} set={setBorder} max={20} tone="bg-slate-400/60" />
        <Slider label="margin" value={margin} set={setMargin} max={60} tone="bg-orange-300/70" />
      </div>

      <figcaption className="border-t border-border p-4 text-sm">
        <pre className="overflow-x-auto rounded-lg bg-[var(--code-bg)] p-3 font-mono text-xs text-[var(--code-text)]">
{`width: ${width}px;  padding: ${padding}px;  border: ${border}px;  margin: ${margin}px;
${borderBox ? "box-sizing: border-box;" : "/* box-sizing: content-box, the original default */"}`}
        </pre>

        <p className="mt-3 font-mono text-xs">
          {borderBox ? (
            <>
              content {contentWidth} = width {width} − padding {padding * 2} −
              border {border * 2}
            </>
          ) : (
            <>
              box {boxWidth} = width {width} + padding {padding * 2} + border{" "}
              {border * 2}
            </>
          )}
        </p>

        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span>
            Box on screen: <strong className="font-mono">{boxWidth}px</strong>
          </span>
          <span className="text-muted">
            Space it occupies:{" "}
            <strong className="font-mono">{spaceWidth}px</strong>
          </span>
        </div>

        <p className="mt-3 text-muted">
          {borderBox
            ? "With border-box, width means the whole box. Set two of these to 50% and they fit side by side, which is what everyone assumes happens anyway."
            : `Without border-box, width applies to the content only. You asked for ${width}px and got a ${boxWidth}px box. Two of these at 50% will not fit side by side — and that is the bug.`}
        </p>
      </figcaption>
    </figure>
  );
}
