import type { ReactNode } from "react";

type Kind = "key" | "watch" | "practice" | "note" | "job";

/**
 * An aside, set off by a flush-left rule rather than a box.
 *
 * It used to be a filled, outlined card. On a dense lesson that produced
 * dozens of competing rectangles and no hierarchy at all, so the aside now
 * keeps the colour — which is what tells you its kind — and drops the
 * border, the fill and the radius.
 */
const STYLES: Record<Kind, { label: string; rule: string; label_: string }> = {
  key: {
    label: "Key idea",
    rule: "border-accent",
    label_: "text-accent",
  },
  watch: {
    label: "Watch out",
    rule: "border-bad",
    label_: "text-bad",
  },
  practice: {
    label: "Try it",
    rule: "border-ok",
    label_: "text-ok",
  },
  note: {
    label: "Worth knowing",
    rule: "border-border-2",
    label_: "text-muted",
  },
  job: {
    label: "On the job",
    rule: "border-warn",
    label_: "text-warn",
  },
};

export function Callout({
  kind = "note",
  title,
  children,
}: {
  kind?: Kind;
  title?: string;
  children: ReactNode;
}) {
  const style = STYLES[kind] ?? STYLES.note;
  return (
    <aside className={`my-7 border-l-2 pl-5 ${style.rule}`}>
      <div
        className={`text-[0.625rem] font-medium uppercase tracking-[0.18em] ${style.label_}`}
      >
        {title ?? style.label}
      </div>
      <div className="mt-2 text-muted-2 [&>*+*]:mt-2.5 [&>p:first-child]:text-text">
        {children}
      </div>
    </aside>
  );
}
