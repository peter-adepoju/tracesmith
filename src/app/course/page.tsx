import type { Metadata } from "next";
import Link from "next/link";
import { hasLesson } from "@content/registry";
import { CourseProgress } from "@/components/CourseProgress";
import { PhaseDisclosure } from "@/components/PhaseDisclosure";
import { PHASES, TOTAL_DAYS, WEEKS, dayKey } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Course",
  description:
    "All 26 weeks of Tracesmith, phase by phase: quality assurance, technical support and AI automation.",
};

/**
 * The whole course, in one place.
 *
 * This used to live on the home page, which meant the first thing a new
 * reader met was 156 links. The home page now says what the course is;
 * this page is where you choose a day.
 */
export default function CoursePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="max-w-2xl">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
          5 phases · 26 weeks · {TOTAL_DAYS} days
        </p>
        <h1 className="mt-2.5 text-[clamp(2.1rem,5vw,3.1rem)] leading-[1.05]">
          The course
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-2">
          Five phases. The first two build the spine every role shares; the
          last three are the roles themselves. Days are about an hour, six
          days a week, and nothing assumes the day before was easy.
        </p>
      </header>

      <CourseProgress />

      <div className="mt-14 space-y-14">
        {PHASES.map((phase) => (
          <PhaseDisclosure
            key={phase.n}
            phase={phase.n}
            eyebrow={`Phase ${phase.n} · weeks ${phase.from} to ${phase.to}`}
            title={phase.title}
            blurb={phase.blurb}
            weeks={phase.to - phase.from + 1}
            days={WEEKS.filter(
              (week) => week.n >= phase.from && week.n <= phase.to,
            ).reduce((sum, week) => sum + week.days.length, 0)}
            defaultOpen={phase.n === 1}
          >
            {WEEKS.filter(
              (week) => week.n >= phase.from && week.n <= phase.to,
            ).map((week) => (
                <div key={week.n} id={`week-${week.n}`} className="scroll-mt-20">
                  <h3 className="text-lg">
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
                            className="group flex h-full flex-col border-l-2 border-border bg-surface/40 py-2.5 pl-3 pr-3 transition-colors hover:border-accent hover:bg-surface"
                          >
                            <span className="flex items-center gap-2 text-xs text-muted">
                              <span className="font-mono">Day {day.n}</span>
                              {ready ? null : (
                                <span className="text-[0.625rem] uppercase tracking-wide">
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
                            <span className="mt-1 text-sm leading-snug text-muted-2 group-hover:text-text">
                              {day.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
            ))}
          </PhaseDisclosure>
        ))}
      </div>
    </main>
  );
}
