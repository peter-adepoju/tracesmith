"use client";

import type { JSONContent } from "@tiptap/core";
import type { Note } from "./store";

/**
 * Markdown and HTML exports.
 *
 * Both walk the editor's own document rather than scraping the rendered DOM,
 * so what you get is what you wrote — no stray wrapper divs, no classes from
 * a theme that will not exist wherever the file ends up.
 */

type Mark = { type: string; attrs?: Record<string, unknown> };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ------------------------------------------------------------------ */
/* Markdown                                                            */
/* ------------------------------------------------------------------ */

function mdInline(node: JSONContent): string {
  if (node.type === "hardBreak") return "  \n";
  if (node.type === "image") {
    const attrs = node.attrs ?? {};
    return `![${String(attrs.alt ?? "")}](${String(attrs.src ?? "")})`;
  }
  if (node.type !== "text") return (node.content ?? []).map(mdInline).join("");

  let text = node.text ?? "";
  const marks = (node.marks ?? []) as Mark[];

  // Code first: nothing inside a code span should be re-marked, since the
  // asterisks would be literal characters there rather than emphasis.
  if (marks.some((m) => m.type === "code")) return `\`${text}\``;

  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        text = `**${text}**`;
        break;
      case "italic":
        text = `*${text}*`;
        break;
      case "strike":
        text = `~~${text}~~`;
        break;
      // Markdown has no underline or highlight, so these stay as HTML, which
      // every renderer worth using passes through.
      case "underline":
        text = `<u>${text}</u>`;
        break;
      case "highlight":
        text = `<mark>${text}</mark>`;
        break;
      case "link":
        text = `[${text}](${String(mark.attrs?.href ?? "")})`;
        break;
      default:
        break;
    }
  }
  return text;
}

function mdBlock(node: JSONContent, depth = 0): string {
  const children = node.content ?? [];
  const inline = () => children.map(mdInline).join("");
  const pad = "  ".repeat(depth);

  switch (node.type) {
    case "paragraph":
      return inline() ? `${pad}${inline()}\n\n` : "\n";
    case "heading":
      return `${"#".repeat(Number(node.attrs?.level ?? 1))} ${inline()}\n\n`;
    case "blockquote":
      return (
        children
          .map((child) => mdBlock(child, depth))
          .join("")
          .trimEnd()
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n") + "\n\n"
      );
    case "codeBlock":
      return `\`\`\`${String(node.attrs?.language ?? "")}\n${inline()}\n\`\`\`\n\n`;
    case "horizontalRule":
      return "---\n\n";
    case "image":
      return `${mdInline(node)}\n\n`;
    case "bulletList":
      return (
        children
          .map((item) => `${pad}- ${listItemBody(item, depth)}`)
          .join("") + (depth === 0 ? "\n" : "")
      );
    case "orderedList":
      return (
        children
          .map((item, i) => `${pad}${i + 1}. ${listItemBody(item, depth)}`)
          .join("") + (depth === 0 ? "\n" : "")
      );
    case "taskList":
      return (
        children
          .map(
            (item) =>
              `${pad}- [${item.attrs?.checked ? "x" : " "}] ${listItemBody(item, depth)}`,
          )
          .join("") + (depth === 0 ? "\n" : "")
      );
    case "table":
      return mdTable(node);
    default:
      return children.map((child) => mdBlock(child, depth)).join("");
  }
}

/** A list item's first paragraph inline, any nested list indented under it. */
function listItemBody(item: JSONContent, depth: number): string {
  const parts = item.content ?? [];
  const [first, ...rest] = parts;
  const head = first
    ? (first.content ?? []).map(mdInline).join("")
    : "";
  const tail = rest.map((child) => mdBlock(child, depth + 1)).join("");
  return `${head}\n${tail}`;
}

function mdTable(node: JSONContent): string {
  const rows = node.content ?? [];
  if (!rows.length) return "";
  const cellText = (cell: JSONContent) =>
    (cell.content ?? [])
      .map((block) => (block.content ?? []).map(mdInline).join(""))
      .join(" ")
      .replace(/\|/g, "\\|");

  const grid = rows.map((row) => (row.content ?? []).map(cellText));
  const width = Math.max(...grid.map((row) => row.length));
  const line = (cells: string[]) =>
    `| ${Array.from({ length: width }, (_, i) => cells[i] ?? "").join(" | ")} |`;

  // Markdown tables must have a header row; the first row serves whether or
  // not it was marked as one in the editor.
  const [head, ...body] = grid;
  return [
    line(head),
    `|${" --- |".repeat(width)}`,
    ...body.map(line),
    "",
    "",
  ].join("\n");
}

export function toMarkdown(note: Note): string {
  const front = [`# ${note.title}`, ""];
  if (note.source) {
    front.push(
      `*Week ${note.source.week}, day ${note.source.day} — ${note.source.title}*`,
      "",
    );
  }
  const body = (note.doc.content ?? []).map((node) => mdBlock(node)).join("");
  // The trailing newline matters: without it the first block runs straight on
  // from the title line, and a heading that does not start its own block is
  // a heading only in the parsers that happen to be lenient about it.
  return `${front.join("\n")}\n${body}`.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

export function notebookToMarkdown(notes: Note[]): string {
  return notes.map(toMarkdown).join("\n\n---\n\n");
}

/* ------------------------------------------------------------------ */
/* HTML                                                                */
/* ------------------------------------------------------------------ */

function htmlInline(node: JSONContent): string {
  if (node.type === "hardBreak") return "<br>";
  if (node.type === "image") {
    const attrs = node.attrs ?? {};
    return `<img src="${escapeHtml(String(attrs.src ?? ""))}" alt="${escapeHtml(String(attrs.alt ?? ""))}">`;
  }
  if (node.type !== "text") return (node.content ?? []).map(htmlInline).join("");

  let html = escapeHtml(node.text ?? "");
  for (const mark of (node.marks ?? []) as Mark[]) {
    switch (mark.type) {
      case "bold":
        html = `<strong>${html}</strong>`;
        break;
      case "italic":
        html = `<em>${html}</em>`;
        break;
      case "underline":
        html = `<u>${html}</u>`;
        break;
      case "strike":
        html = `<s>${html}</s>`;
        break;
      case "code":
        html = `<code>${html}</code>`;
        break;
      case "highlight":
        html = `<mark>${html}</mark>`;
        break;
      case "link":
        html = `<a href="${escapeHtml(String(mark.attrs?.href ?? ""))}">${html}</a>`;
        break;
      case "textStyle": {
        const color = mark.attrs?.color;
        if (color) html = `<span style="color:${escapeHtml(String(color))}">${html}</span>`;
        break;
      }
      default:
        break;
    }
  }
  return html;
}

function htmlBlock(node: JSONContent): string {
  const children = node.content ?? [];
  const inline = () => children.map(htmlInline).join("");
  const align = node.attrs?.textAlign;
  const style = align && align !== "left" ? ` style="text-align:${String(align)}"` : "";

  switch (node.type) {
    case "paragraph":
      return `<p${style}>${inline() || "<br>"}</p>`;
    case "heading":
      return `<h${Number(node.attrs?.level ?? 1)}${style}>${inline()}</h${Number(node.attrs?.level ?? 1)}>`;
    case "blockquote":
      return `<blockquote>${children.map(htmlBlock).join("")}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${escapeHtml(
        children.map((child) => child.text ?? "").join(""),
      )}</code></pre>`;
    case "horizontalRule":
      return "<hr>";
    case "image":
      return `<figure>${htmlInline(node)}</figure>`;
    case "bulletList":
      return `<ul>${children.map(htmlBlock).join("")}</ul>`;
    case "orderedList":
      return `<ol>${children.map(htmlBlock).join("")}</ol>`;
    case "taskList":
      return `<ul class="tasks">${children.map(htmlBlock).join("")}</ul>`;
    case "listItem":
      return `<li>${children.map(htmlBlock).join("")}</li>`;
    case "taskItem":
      return `<li><input type="checkbox" disabled${node.attrs?.checked ? " checked" : ""}> ${children
        .map(htmlBlock)
        .join("")}</li>`;
    case "table":
      return `<table>${children.map(htmlBlock).join("")}</table>`;
    case "tableRow":
      return `<tr>${children.map(htmlBlock).join("")}</tr>`;
    case "tableHeader":
      return `<th>${children.map(htmlBlock).join("")}</th>`;
    case "tableCell":
      return `<td>${children.map(htmlBlock).join("")}</td>`;
    default:
      return children.map(htmlBlock).join("");
  }
}

export function toHtmlFragment(doc: JSONContent): string {
  return (doc.content ?? []).map(htmlBlock).join("\n");
}

/**
 * A standalone page: no stylesheet to lose, no fonts to fetch.
 *
 * It is printed as well as saved, so the stylesheet is deliberately plain
 * and light — a black-on-white document is what survives being emailed,
 * opened on someone else's machine, or turned into a PDF years from now.
 */
export function toHtmlDocument(notes: Note[], title: string): string {
  const body = notes
    .map((note) => {
      const source = note.source
        ? `<p class="source">Week ${note.source.week}, day ${note.source.day} — ${escapeHtml(note.source.title)}</p>`
        : "";
      return `<article>
<h1>${escapeHtml(note.title)}</h1>
${source}
<p class="meta">Written ${new Date(note.createdAt).toISOString().slice(0, 10)} · last edited ${new Date(note.updatedAt).toISOString().slice(0, 10)}</p>
${toHtmlFragment(note.doc)}
</article>`;
    })
    .join("\n<hr class=\"between\">\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light }
  body { margin: 0 auto; max-width: 42rem; padding: 3rem 1.5rem;
         font: 16px/1.65 Georgia, "Times New Roman", serif; color: #1a1a1a; background: #fff }
  h1 { font-size: 1.9rem; line-height: 1.15; margin: 0 0 .4rem }
  h2 { font-size: 1.4rem; margin: 2rem 0 .5rem }
  h3 { font-size: 1.15rem; margin: 1.6rem 0 .4rem }
  p, ul, ol, blockquote, pre, table { margin: 0 0 1rem }
  .meta, .source { color: #666; font-size: .85rem; font-style: italic }
  .source { margin-bottom: .2rem }
  blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1rem; color: #333 }
  pre { background: #f4f4f4; padding: .9rem 1rem; overflow-x: auto; font-size: .875rem }
  code { font-family: "SF Mono", Consolas, monospace; font-size: .9em }
  pre code { font-size: inherit }
  img { max-width: 100%; height: auto }
  mark { background: #fff2a8 }
  table { border-collapse: collapse; width: 100% }
  th, td { border: 1px solid #ccc; padding: .4rem .6rem; text-align: left }
  th { background: #f4f4f4 }
  ul.tasks { list-style: none; padding-left: 1.2rem }
  hr.between { border: 0; border-top: 1px solid #ddd; margin: 3rem 0 }
  article { break-inside: auto }
  @page { margin: 2cm }
  @media print { body { padding: 0; max-width: none } h1, h2, h3 { break-after: avoid } }
</style>
</head>
<body>
${body}
</body>
</html>`;
}
