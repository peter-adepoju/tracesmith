import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DEFINITION_OF_DONE,
  LEVEL_LABEL,
  PROJECTS,
  STACK_LABEL,
  getProject,
} from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ id: project.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  return { title: project ? project.name : "Project" };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="no-touch-target text-xs text-muted">
        <Link href="/build" className="hover:text-text">
          Build
        </Link>
        <span className="mx-1.5">/</span>
        <span>{LEVEL_LABEL[project.level]}</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
        <p className="mt-2 text-lg text-muted">{project.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          <span>{STACK_LABEL[project.stack]}</span>
          <span>~{project.hours} hours</span>
          <span>Week {project.week}</span>
        </div>
      </header>

      <section className="prose mt-8">
        <h2>Why build this</h2>
        <p>{project.why}</p>

        <h2>Could you sell it</h2>
        <p>{project.sellable}</p>
      </section>

      <section className="mt-8 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          What it teaches
        </h2>
        <ul className="mt-3 space-y-1.5 text-[0.9375rem]">
          {project.teaches.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-accent">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-xl border border-bad/40 bg-bad-soft p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          Hard constraints
        </h2>
        <p className="mt-1 text-xs opacity-80">
          Not suggestions. A build that breaks one of these does not pass, even
          if it works.
        </p>
        <ul className="mt-3 space-y-1.5 text-[0.9375rem]">
          {project.constraints.map((item) => (
            <li key={item} className="flex gap-2">
              <span>·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Milestones</h2>
        <ol className="mt-4 space-y-4">
          {project.milestones.map((milestone) => (
            <li
              key={milestone.n}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-sm text-muted">
                  {milestone.n}
                </span>
                <h3 className="font-semibold">{milestone.title}</h3>
              </div>
              <p className="mt-1.5 text-[0.9375rem] text-muted">
                {milestone.brief}
              </p>
              <div className="mt-3">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
                  Done when
                </p>
                <ul className="mt-1.5 space-y-1 text-sm">
                  {milestone.acceptance.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-ok">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-xl border border-border bg-surface-2 p-5">
        <h2 className="font-semibold">The scaffold</h2>
        {project.scaffold ? (
          <>
            <p className="mt-2 text-sm text-muted">
              A starter is in the repo at <code>{project.scaffold}/</code>. The
              structure is there and the interesting parts are TODOs. Run the
              verifier against your work as you go:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--code-bg)] p-3 text-xs text-[var(--code-text)]">
              <code>{`cd ${project.scaffold}
python -I verify.py`}</code>
            </pre>
            <p className="mt-3 text-xs text-muted">
              The verifier checks behaviour, not elegance. Passing means it
              works the way the acceptance criteria say; it does not mean the
              code is good. That part is still your judgement.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No scaffold written yet. The brief above is complete and you can
            build from it today — the scaffold only saves you the boilerplate.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Before you call it finished
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {DEFINITION_OF_DONE.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-muted">☐</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
