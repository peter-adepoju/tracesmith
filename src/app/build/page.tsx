import type { Metadata } from "next";
import Link from "next/link";
import {
  DEFINITION_OF_DONE,
  LEVEL_LABEL,
  PROJECTS,
  STACK_LABEL,
} from "@/lib/projects";

export const metadata: Metadata = { title: "Build" };

const LEVEL_TONE: Record<string, string> = {
  foundation: "border-ok/40 bg-ok-soft",
  intermediate: "border-warn/40 bg-warn-soft",
  senior: "border-bad/40 bg-bad-soft",
};

export default function BuildPage() {
  const totalHours = PROJECTS.reduce((sum, project) => sum + project.hours, 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Build</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Ten automation projects you build on your own machine, with real tools,
        against real APIs. Each one is something you could keep using or sell.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-medium">These do not run in this page, and that is deliberate.</p>
        <p className="mt-2 text-muted">
          n8n cannot run inside a browser tab, and an agent that only works in a
          demo is not an agent you can rely on or sell. So the site holds the
          brief, the constraints, the acceptance criteria and the review
          checklist. The repo holds a starter scaffold with the interesting
          parts left as TODOs, and a <code>verify.py</code> that runs real
          assertions against what you built.
        </p>
      </div>

      <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
        <div>
          <dt className="text-muted">Projects</dt>
          <dd className="text-xl font-semibold">{PROJECTS.length}</dd>
        </div>
        <div>
          <dt className="text-muted">Estimated hours</dt>
          <dd className="text-xl font-semibold">{totalHours}</dd>
        </div>
        <div>
          <dt className="text-muted">Scaffolds ready</dt>
          <dd className="text-xl font-semibold">
            {PROJECTS.filter((p) => p.scaffold).length}
            <span className="text-sm font-normal text-muted">
              {" "}
              / {PROJECTS.length}
            </span>
          </dd>
        </div>
      </dl>

      <ol className="mt-10 space-y-4">
        {PROJECTS.map((project, index) => (
          <li key={project.id}>
            <Link
              href={`/build/${project.id}`}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 uppercase tracking-wide ${
                    LEVEL_TONE[project.level]
                  }`}
                >
                  {LEVEL_LABEL[project.level]}
                </span>
                <span className="text-muted">{STACK_LABEL[project.stack]}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">~{project.hours} h</span>
                <span className="text-muted">·</span>
                <span className="text-muted">week {project.week}</span>
                {project.scaffold ? (
                  <span className="rounded border border-ok/40 bg-ok-soft px-1.5 py-0.5 uppercase tracking-wide">
                    scaffold ready
                  </span>
                ) : null}
              </div>
              <h2 className="mt-2 text-xl font-semibold">{project.name}</h2>
              <p className="mt-1 text-sm">{project.tagline}</p>
              <p className="mt-2 text-sm text-muted">{project.why}</p>
            </Link>
          </li>
        ))}
      </ol>

      <section className="mt-14 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">The definition of done</h2>
        <p className="mt-1 text-sm text-muted">
          Applied to every project. Something that works once on your laptop but
          fails these is not finished.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
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
