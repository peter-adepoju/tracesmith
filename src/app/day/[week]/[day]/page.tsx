import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSONS } from "@content/registry";
import { CourseRail } from "@/components/CourseRail";
import { LessonFooter } from "@/components/LessonFooter";
import { LessonProvider } from "@/components/LessonContext";
import { ClipToNotebook } from "@/components/notebook/ClipToNotebook";
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
    <div className="mx-auto grid max-w-6xl lg:grid-cols-[264px_minmax(0,1fr)]">
      <CourseRail currentWeek={weekNumber} />

      {/* Capped at a reading measure: the rail takes the width a wide screen
          would otherwise spend making lines too long to track. */}
      <main className="min-w-0 max-w-[72ch] px-4 py-10 lg:px-10">
      <nav className="no-touch-target flex items-center gap-1.5 text-xs text-muted">
        <Link href="/course" className="hover:text-text">
          Course
        </Link>
        {phase ? (
          <>
            <span className="hidden sm:inline">/</span>
            <span className="hidden sm:inline">Phase {phase.n}</span>
          </>
        ) : null}
        <span>/</span>
        <Link href={`/course#week-${week.n}`} className="hover:text-text">
          Week {week.n}
        </Link>
        {/* Brass, because this is progress rather than navigation. */}
        <span className="ml-auto shrink-0 rounded-full bg-prog-soft px-2.5 py-0.5 font-mono text-[0.6875rem] tabular-nums text-prog">
          {index + 1}/{total}
        </span>
      </nav>

      <header className="mt-5">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
          Week {week.n} · {week.title} · Day {day.n}
        </p>
        <h1 className="mt-2.5 text-[clamp(2rem,4.6vw,2.9rem)] leading-[1.07]">
          {day.title}
        </h1>
      </header>

      {/* A quiet aside, not a card: the objectives should not outweigh the
          first paragraph of the lesson. */}
      <section className="mt-7 border-l-2 border-accent-soft pl-5">
        <h2 className="!mt-0 text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
          By the end you can
        </h2>
        <ul className="mt-2 space-y-0.5 text-[0.9375rem] text-muted-2">
          {day.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </section>

      {Lesson ? (
        <LessonProvider dayKey={key}>
          {/* data-lesson-body marks what counts as the lesson: selecting the
              navigation or the footer is not something to clip. */}
          <article className="prose mt-10" data-lesson-body>
            <Lesson />
          </article>
          <ClipToNotebook
            source={{
              dayKey: key,
              week: weekNumber,
              day: dayNumber,
              title: day.title,
            }}
          />
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
    </div>
  );
}
