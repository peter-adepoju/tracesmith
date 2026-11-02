import type { Metadata } from "next";
import Link from "next/link";
import { LABS } from "@/lib/labs";

export const metadata: Metadata = { title: "Labs" };

const LEVEL_TONE: Record<string, string> = {
  beginner: "border-ok/40 bg-ok-soft",
  intermediate: "border-warn/40 bg-warn-soft",
  senior: "border-bad/40 bg-bad-soft",
};

export default function LabsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Labs</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Real testing on a real product. Meridian is a working shop with defects
        planted in it. You get the app, a console, a network panel and a bug
        tracker; you find what is wrong, file it in your own words, and the lab
        marks your coverage against a hidden answer key.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Meridian is the same product all the way through the course. It gains
        features and new defects as you progress, which is the part most
        practice sites miss: at work you test one thing you know deeply, and
        half the skill is noticing when something that worked last month stops
        working.
      </p>

      <ul className="mt-10 space-y-4">
        {LABS.map((lab) => (
          <li key={lab.id}>
            <Link
              href={`/lab/${lab.id}`}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded border px-1.5 py-0.5 uppercase tracking-wide ${
                    LEVEL_TONE[lab.level]
                  }`}
                >
                  {lab.level}
                </span>
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
              <h2 className="mt-2 text-xl font-semibold">{lab.title}</h2>
              <p className="mt-1 text-sm text-muted">{lab.summary}</p>
              <p className="mt-2 text-sm">
                <span className="text-muted">Trains: </span>
                {lab.trains}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-14 rounded-xl border border-border bg-surface-2 p-5">
        <h2 className="font-semibold">More labs are coming</h2>
        <p className="mt-2 text-sm text-muted">
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
