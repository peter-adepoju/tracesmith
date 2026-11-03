import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center px-5 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">You are offline</h1>
      <p className="mt-3 text-muted">
        This page has not been opened on this device before, so there is no
        copy saved.
      </p>
      <p className="mt-3 text-sm text-muted">
        Lessons you have already read stay available offline. The review deck
        works offline too, and anything you answer syncs when you reconnect.
      </p>
      <div className="mt-8 flex flex-col gap-2">
        <Link
          href="/review"
          className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white"
        >
          Review your flashcards
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-border px-4 py-3 text-sm font-medium"
        >
          Back to the course
        </Link>
      </div>
    </main>
  );
}
