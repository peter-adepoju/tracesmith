import type { Metadata } from "next";
import Link from "next/link";
import { LABS } from "@/lib/labs";

export const metadata: Metadata = { title: "Labs" };

/* Difficulty reads as a coloured word, not a filled pill. Eighteen pills down
   a page is eighteen things competing with the titles they label. */
const LEVEL_TONE: Record<string, string> = {
  beginner: "text-ok",
  intermediate: "text-warn",
  senior: "text-bad",
};

export default function LabsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="max-w-2xl">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
          {LABS.length} labs · one product
        </p>
        <h1 className="mt-2.5 text-[clamp(2.1rem,5vw,3.1rem)] leading-[1.05]">
          Labs
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-2">
          Real testing on a real product. Meridian is a working shop with
          defects planted in it. You get the app, a console, a network panel
          and a bug tracker; you find what is wrong, file it in your own words,
          and the lab marks your coverage against a hidden answer key.
        </p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          Meridian is the same product all the way through the course. It gains
          features and new defects as you progress, which is the part most
          practice sites miss: at work you test one thing you know deeply, and
          half the skill is noticing when something that worked last month
          stops working.
        </p>
      </header>

      <ul className="mt-12">
        {LABS.map((lab) => (
          <li key={lab.id}>
            <Link
              href={`/lab/${lab.id}`}
              className="group block border-l-2 border-border py-4 pl-5 pr-3 transition-colors hover:border-accent hover:bg-surface/40"
            >
              <div className="flex flex-wrap items-center gap-x-2 text-[0.625rem] uppercase tracking-[0.14em]">
                <span className={LEVEL_TONE[lab.level]}>{lab.level}</span>
                <span className="text-muted">Week {lab.week}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">{lab.minutes} min</span>
                <span className="text-muted">·</span>
                <span className="text-muted">
                  {lab.stages.length} stages,{" "}
                  {lab.stages.reduce((sum, stage) => sum + stage.defects.length, 0)}{" "}
                  defects
                </span>
              </div>
              <h2 className="mt-1.5 text-lg text-muted-2 transition-colors group-hover:text-text">
                {lab.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {lab.summary}
              </p>
              <p className="mt-1.5 text-sm text-muted-2">
                <span className="text-muted">Trains: </span>
                {lab.trains}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-14 max-w-2xl border-l-2 border-accent-soft pl-5">
        <h2 className="!mt-0 text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted">
          More labs are coming
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The plan, in order: an admin back-office to test role permissions and
          tenant isolation against; an API-only lab worked entirely in Postman;
          a release-regression lab where you are given a changelog and must
          decide what to re-run; a cross-browser and responsive lab; an
          accessibility lab; and a senior lab where the defects are race
          conditions and idempotency failures rather than anything you can see
          on screen.
        </p>
      </section>
    </main>
  );
}
