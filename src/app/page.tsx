import Link from "next/link";
import { hasLesson } from "@content/registry";
import { CourseProgress } from "@/components/CourseProgress";
import { PHASES, TOTAL_DAYS, WEEKS, dayKey } from "@/lib/curriculum";

export default function HomePage() {
  const written = WEEKS.flatMap((week) =>
    week.days.filter((day) => hasLesson(dayKey(week.n, day.n))),
  ).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <section className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">Tracesmith</h1>
        <p className="mt-3 text-lg text-muted">
          One path from zero to employable across three jobs that share a spine:
          quality assurance, technical support, and AI automation.
        </p>
        <p className="mt-4 text-[0.9375rem] leading-relaxed">
          All three roles live or die on the same skill: being able to say, with
          evidence, what a system actually did. A tester reads it in the Network
          tab, a support engineer reads it in a log, an automation writes it to
          a run log. So the course teaches that spine first and splits into the
          roles afterwards.
        </p>

        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <div>
            <dt className="text-muted">Length</dt>
            <dd className="text-xl font-semibold">26 weeks</dd>
          </div>
          <div>
            <dt className="text-muted">Days</dt>
            <dd className="text-xl font-semibold">{TOTAL_DAYS}</dd>
          </div>
          <div>
            <dt className="text-muted">Pace</dt>
            <dd className="text-xl font-semibold">1 hour, 6 days</dd>
          </div>
          <div>
            <dt className="text-muted">Written so far</dt>
            <dd className="text-xl font-semibold">
              {written}
              <span className="text-sm font-normal text-muted"> / {TOTAL_DAYS}</span>
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/day/1/1"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white"
          >
            Start day 1
          </Link>
          <Link
            href="/sandbox"
            className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium"
          >
            Open the sandbox
          </Link>
        </div>
      </section>

      <CourseProgress />

      <section className="mt-16 space-y-14">
        {PHASES.map((phase) => (
          <div key={phase.n}>
            <div className="border-b border-border pb-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent">
                Phase {phase.n} · weeks {phase.from} to {phase.to}
              </div>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {phase.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-muted">{phase.blurb}</p>
            </div>

            <div className="mt-6 space-y-8">
              {WEEKS.filter(
                (week) => week.n >= phase.from && week.n <= phase.to,
              ).map((week) => (
                <div key={week.n} id={`week-${week.n}`} className="scroll-mt-20">
                  <h3 className="text-lg font-semibold">
                    <span className="mr-2 font-mono text-sm text-muted">
                      W{String(week.n).padStart(2, "0")}
                    </span>
                    {week.title}
                  </h3>
                  <p className="mt-1 max-w-3xl text-sm text-muted">
                    {week.summary}
                  </p>
                  <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {week.days.map((day) => {
                      const key = dayKey(week.n, day.n);
                      const ready = hasLesson(key);
                      return (
                        <li key={day.n}>
                          <Link
                            href={`/day/${week.n}/${day.n}`}
                            data-day={key}
                            className="group flex h-full flex-col rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent/50 hover:bg-surface-2"
                          >
                            <span className="flex items-center gap-2 text-xs text-muted">
                              <span className="font-mono">Day {day.n}</span>
                              {ready ? null : (
                                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.625rem] uppercase tracking-wide">
                                  planned
                                </span>
                              )}
                              <span
                                data-tick
                                className="ml-auto hidden text-ok"
                                aria-hidden
                              >
                                done
                              </span>
                            </span>
                            <span className="mt-1 text-sm leading-snug">
                              {day.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
