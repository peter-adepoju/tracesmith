/**
 * The new words introduced by a lesson.
 *
 * These double as flashcards: `scripts/build-cards.mjs` reads them out of the
 * MDX so the review deck never drifts from the lessons.
 */
export function Terms({
  items,
}: {
  items: { term: string; meaning: string }[];
}) {
  return (
    <section className="my-8 rounded-xl border border-border bg-surface p-4">
      <h3 className="!mt-0 text-sm font-semibold uppercase tracking-wider text-muted">
        New words
      </h3>
      <dl className="mt-3 space-y-2.5">
        {items.map((item) => (
          <div key={item.term} className="text-[0.9375rem]">
            <dt className="inline font-semibold">{item.term}</dt>
            <dd className="ml-1.5 inline text-muted">— {item.meaning}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
