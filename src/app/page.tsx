import Link from "next/link";
import { HomeProgress } from "@/components/HomeProgress";
import { TOTAL_DAYS } from "@/lib/curriculum";
import { LABS } from "@/lib/labs";

/**
 * The landing page, and nothing else.
 *
 * The week-by-week listing moved to /course. A reader arriving here should
 * be able to tell in one screen what this is and whether it is for them;
 * 156 links did not do that.
 */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <section className="max-w-2xl">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
          A free course · 26 weeks · {TOTAL_DAYS} lessons
        </p>

        <h1 className="mt-4 text-[clamp(2.6rem,7vw,4.2rem)] leading-[1.02]">
          Three jobs that share a spine.
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-muted-2">
          One path from zero to employable across quality assurance, technical
          support and AI automation.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/day/1/1"
            className="bg-accent px-6 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-[#141008]"
          >
            Start day 1
          </Link>
          <Link
            href="/course"
            className="border border-accent px-6 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-accent transition-colors hover:bg-accent-soft"
          >
            See the course
          </Link>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-px border-y border-border bg-border sm:grid-cols-4">
          {[
            ["Phases", "5"],
            ["Weeks", "26"],
            ["Lessons", String(TOTAL_DAYS)],
            ["Labs", String(LABS.length)],
          ].map(([label, value]) => (
            <div key={label} className="bg-bg px-4 py-5">
              <dd className="font-display text-4xl leading-none tabular-nums text-accent">
                {value}
              </dd>
              <dt className="mt-2 text-[0.625rem] uppercase tracking-[0.16em] text-muted">
                {label}
              </dt>
            </div>
          ))}
        </dl>

        <HomeProgress />
      </section>
    </main>
  );
}
