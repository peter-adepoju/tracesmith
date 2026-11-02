import type { ReactNode } from "react";

type Kind = "key" | "watch" | "practice" | "note" | "job";

const STYLES: Record<Kind, { label: string; className: string }> = {
  key: {
    label: "Key idea",
    className: "border-accent/40 bg-accent-soft",
  },
  watch: {
    label: "Watch out",
    className: "border-bad/40 bg-bad-soft",
  },
  practice: {
    label: "Try it",
    className: "border-ok/40 bg-ok-soft",
  },
  note: {
    label: "Worth knowing",
    className: "border-border bg-surface-2",
  },
  job: {
    label: "On the job",
    className: "border-warn/40 bg-warn-soft",
  },
};

/** A boxed aside. Used sparingly: three per lesson at most. */
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
    <aside className={`my-6 rounded-xl border p-4 ${style.className}`}>
      <div className="text-[0.6875rem] font-semibold uppercase tracking-wider opacity-70">
        {title ?? style.label}
      </div>
      <div className="mt-1.5 [&>*+*]:mt-2 [&>p]:text-[0.9375rem]">{children}</div>
    </aside>
  );
}
