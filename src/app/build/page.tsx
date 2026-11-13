import type { Metadata } from "next";
import Link from "next/link";
import {
  DEFINITION_OF_DONE,
  LEVEL_LABEL,
  PROJECTS,
  STACK_LABEL,
} from "@/lib/projects";

export const metadata: Metadata = { title: "Build" };

/* As on the labs page: the level is a coloured word rather than a pill. */
const LEVEL_TONE: Record<string, string> = {
  foundation: "text-ok",
  intermediate: "text-warn",
  senior: "text-bad",
};

export default function BuildPage() {
  const totalHours = PROJECTS.reduce((sum, project) => sum + project.hours, 0);
  const ready = PROJECTS.filter((project) => project.scaffold).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="max-w-2xl">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
          {PROJECTS.length} projects · on your own machine
        </p>
        <h1 className="mt-2.5 text-[clamp(2.1rem,5vw,3.1rem)] leading-[1.05]">
          Build
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-2">
          Ten automation projects you build on your own machine, with real
          tools, against real APIs. Each one is something you could keep using
          or sell.
        </p>
      </header>

      <section className="mt-7 max-w-2xl border-l-2 border-accent-soft pl-5">
        <h2 className="!mt-0 text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
          These do not run in this page, and that is deliberate
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          n8n cannot run inside a browser tab, and an agent that only works in a
          demo is not an agent you can rely on or sell. So the site holds the
          brief, the constraints, the acceptance criteria and the review
          checklist. The repo holds a starter scaffold with the interesting
          parts left as TODOs, and a <code>verify.py</code> that runs real
          assertions against what you built.
        </p>
      </section>

      {/* The hairline grid from the home page: the gap is the border colour
          showing through, so there are no boxes, only the lines between. */}
      <dl className="mt-10 grid grid-cols-3 gap-px border-y border-border bg-border">
        {[
          ["Projects", String(PROJECTS.length)],
          ["Hours", String(totalHours)],
          ["Scaffolds", `${ready}/${PROJECTS.length}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-bg px-4 py-5">
            <dd className="font-display text-3xl leading-none tabular-nums text-accent">
              {value}
            </dd>
            <dt className="mt-2 text-[0.625rem] uppercase tracking-[0.16em] text-muted">
              {label}
            </dt>
          </div>
        ))}
      </dl>

      <ol className="mt-12">
        {PROJECTS.map((project, index) => (
          <li key={project.id}>
            <Link
              href={`/build/${project.id}`}
              className="group block border-l-2 border-border py-4 pl-5 pr-3 transition-colors hover:border-accent hover:bg-surface/40"
            >
              <div className="flex flex-wrap items-center gap-x-2 text-[0.625rem] uppercase tracking-[0.14em]">
                <span className="font-mono normal-case text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={LEVEL_TONE[project.level]}>
                  {LEVEL_LABEL[project.level]}
                </span>
                <span className="text-muted">{STACK_LABEL[project.stack]}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">~{project.hours} h</span>
                <span className="text-muted">·</span>
                <span className="text-muted">week {project.week}</span>
                {project.scaffold ? (
                  <span className="text-ok">scaffold ready</span>
                ) : null}
              </div>
              <h2 className="mt-1.5 text-lg text-muted-2 transition-colors group-hover:text-text">
                {project.name}
              </h2>
              <p className="mt-1 text-sm text-muted-2">{project.tagline}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {project.why}
              </p>
            </Link>
          </li>
        ))}
      </ol>

      <section className="mt-14 max-w-2xl border-l-2 border-accent-soft pl-5">
        <h2 className="!mt-0 text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
          The definition of done
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Applied to every project. Something that works once on your laptop
          but fails these is not finished.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-2">
          {DEFINITION_OF_DONE.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-accent">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
