/**
 * Heading slugs, in one place.
 *
 * Two things need to agree about what `## The six types` is called: the MDX
 * renderer, which puts the id on the heading, and the search index generator,
 * which builds the link that jumps to it. If they ever disagree the link
 * silently lands at the top of the page, which looks like the search is
 * slightly broken rather than like a bug anyone would go and find.
 *
 * So both import this, and neither has its own copy.
 */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** The text of a React heading child, which may be a string or nested nodes. */
export function textOfNode(node: unknown): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOfNode).join("");
  if (typeof node === "object" && "props" in (node as Record<string, unknown>)) {
    const props = (node as { props?: { children?: unknown } }).props;
    return textOfNode(props?.children);
  }
  return "";
}
