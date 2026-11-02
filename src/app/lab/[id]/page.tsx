import Link from "next/link";
import { notFound } from "next/navigation";
import { Workbench } from "@/components/lab/Workbench";
import { LABS, getLab } from "@/lib/labs";

export function generateStaticParams() {
  return LABS.map((lab) => ({ id: lab.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lab = getLab(id);
  return { title: lab ? lab.title : "Lab" };
}

export default async function LabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lab = getLab(id);
  if (!lab) notFound();

  return (
    <main className="mx-auto max-w-[88rem] px-4 py-8">
      <nav className="text-xs text-muted">
        <Link href="/lab" className="hover:text-text">
          Labs
        </Link>
        <span className="mx-1.5">/</span>
        <span>Week {lab.week}</span>
      </nav>

      <header className="mt-3 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{lab.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{lab.summary}</p>
      </header>

      <Workbench lab={lab} />
    </main>
  );
}
