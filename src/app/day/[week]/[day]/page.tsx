import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSONS } from "@content/registry";
import { LessonFooter } from "@/components/LessonFooter";
import { LessonProvider } from "@/components/LessonContext";
import { WEEKS, dayKey, getDay, getWeek, neighbours, phaseOf } from "@/lib/curriculum";

export function generateStaticParams() {
  return WEEKS.flatMap((week) =>
    week.days.map((day) => ({
      week: String(week.n),
      day: String(day.n),
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ week: string; day: string }>;
}) {
  const { week: weekParam, day: dayParam } = await params;
  const day = getDay(Number(weekParam), Number(dayParam));
  return { title: day ? day.title : "Lesson" };
}

export default async function DayPage({
  params,
}: {
  params: Promise<{ week: string; day: string }>;
}) {
  const { week: weekParam, day: dayParam } = await params;
  const weekNumber = Number(weekParam);
  const dayNumber = Number(dayParam);

  const week = getWeek(weekNumber);
  const day = getDay(weekNumber, dayNumber);
  if (!week || !day) notFound();

  const phase = phaseOf(weekNumber);
  const key = dayKey(weekNumber, dayNumber);
  const Lesson = LESSONS[key];
  const { index, total } = neighbours(weekNumber, dayNumber);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-text">
          Course
        </Link>
        <span>/</span>
        {phase ? <span>Phase {phase.n}</span> : null}
        <span>/</span>
        <Link href={`/#week-${week.n}`} className="hover:text-text">
          Week {week.n}
        </Link>
        <span className="ml-auto font-mono">
          Day {index + 1} of {total}
        </span>
      </nav>

      <header className="mt-4">
        <p className="text-sm text-muted">
          Week {week.n} · {week.title} · Day {day.n}
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight">
          {day.title}
        </h1>
      </header>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="!mt-0 text-xs font-semibold uppercase tracking-wider text-muted">
          By the end you can
        </h2>
        <ul className="mt-2 space-y-1 text-[0.9375rem]">
          {day.objectives.map((objective) => (
            <li key={objective} className="flex gap-2">
              <span className="text-accent">·</span>
              <span>{objective}</span>
            </li>
          ))}
        </ul>
      </section>

      {Lesson ? (
        <LessonProvider dayKey={key}>
          <article className="prose mt-10">
            <Lesson />
          </article>
        </LessonProvider>
      ) : (
        <div className="mt-10 rounded-xl border border-border bg-surface-2 p-6">
          <h2 className="!mt-0 text-lg font-semibold">Not written yet</h2>
          <p className="mt-2 text-sm text-muted">
            This day is planned and its objectives are above, but the lesson
            itself is still to be written. Week 1 is complete; the rest of the
            course is being filled in week by week.
          </p>
        </div>
      )}

      <LessonFooter week={weekNumber} day={dayNumber} />
    </main>
  );
}
