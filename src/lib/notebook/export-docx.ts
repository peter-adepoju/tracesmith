"use client";

import type { JSONContent } from "@tiptap/core";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from "docx";
import type { Note } from "./store";

/**
 * A real .docx, not HTML wearing a Word extension.
 *
 * The usual shortcut — saving an HTML file as .doc — opens in Word and then
 * behaves like a web page: images go missing when the file moves, styles come
 * out wrong, and nothing else can read it. This builds the actual OOXML, so
 * the file opens the same in Word, Pages, LibreOffice and Google Docs, with
 * the images inside it.
 */

/** Printable width of A4 at one-inch margins, in CSS pixels at 96 to the inch. */
const CONTENT_WIDTH = 600;

const HEADINGS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
] as const;

type Mark = { type: string; attrs?: Record<string, unknown> };

function alignmentOf(node: JSONContent) {
  switch (node.attrs?.textAlign) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "justify":
      return AlignmentType.JUSTIFIED;
    default:
      return undefined;
  }
}

/** "data:image/png;base64,..." -> the format docx needs, or null. */
function imageTypeOf(src: string): "png" | "jpg" | "gif" | "bmp" | null {
  const match = /^data:image\/(png|jpe?g|gif|bmp)/i.exec(src);
  if (!match) return null;
  const kind = match[1].toLowerCase();
  if (kind === "jpeg" || kind === "jpg") return "jpg";
  return kind as "png" | "gif" | "bmp";
}

function runsOf(nodes: JSONContent[]): (TextRun | ImageRun | ExternalHyperlink)[] {
  const runs: (TextRun | ImageRun | ExternalHyperlink)[] = [];

  for (const node of nodes) {
    if (node.type === "hardBreak") {
      runs.push(new TextRun({ break: 1 }));
      continue;
    }

    if (node.type === "image") {
      const src = String(node.attrs?.src ?? "");
      const type = imageTypeOf(src);
      // A linked image has no bytes to embed, and Word cannot fetch one from
      // a file on disk, so it becomes a visible note rather than a blank gap.
      if (!type) {
        runs.push(new TextRun({ text: `[image: ${src}]`, italics: true }));
        continue;
      }
      // Scale to the page, keeping the aspect ratio the editor recorded. An
      // image with no recorded size is assumed landscape rather than left
      // for Word to stretch to nothing.
      const naturalWidth = Number(node.attrs?.width) || CONTENT_WIDTH;
      const naturalHeight = Number(node.attrs?.height) || Math.round(naturalWidth * 0.6);
      const width = Math.min(naturalWidth, CONTENT_WIDTH);
      const height = Math.round((naturalHeight * width) / naturalWidth);
      runs.push(
        new ImageRun({
          type,
          data: src,
          transformation: { width, height },
          altText: node.attrs?.alt
            ? { name: "image", description: String(node.attrs.alt), title: "" }
            : undefined,
        }),
      );
      continue;
    }

    if (node.type !== "text") {
      runs.push(...runsOf(node.content ?? []));
      continue;
    }

    const marks = (node.marks ?? []) as Mark[];
    const has = (name: string) => marks.some((mark) => mark.type === name);
    const styled = marks.find((mark) => mark.type === "textStyle");
    const highlight = marks.find((mark) => mark.type === "highlight");
    const colour = String(styled?.attrs?.color ?? "").replace("#", "");

    const run = new TextRun({
      text: node.text ?? "",
      bold: has("bold"),
      italics: has("italic"),
      underline: has("underline") ? {} : undefined,
      strike: has("strike"),
      font: has("code") ? "Consolas" : undefined,
      color: colour || undefined,
      shading: highlight
        ? {
            type: ShadingType.CLEAR,
            fill: String(highlight.attrs?.color ?? "#fff2a8").replace("#", ""),
          }
        : undefined,
    });

    const link = marks.find((mark) => mark.type === "link");
    runs.push(
      link
        ? new ExternalHyperlink({
            children: [run],
            link: String(link.attrs?.href ?? ""),
          })
        : run,
    );
  }

  return runs;
}

function cellParagraphs(cell: JSONContent): Paragraph[] {
  const blocks = (cell.content ?? []).flatMap((child) => blockOf(child, 0));
  return blocks.length ? (blocks as Paragraph[]) : [new Paragraph({})];
}

function blockOf(node: JSONContent, depth: number): (Paragraph | Table)[] {
  const children = node.content ?? [];

  switch (node.type) {
    case "paragraph":
      return [
        new Paragraph({
          children: runsOf(children),
          alignment: alignmentOf(node),
          spacing: { after: 160 },
        }),
      ];

    case "heading":
      return [
        new Paragraph({
          children: runsOf(children),
          heading: HEADINGS[Math.min(Number(node.attrs?.level ?? 1), 6) - 1],
          alignment: alignmentOf(node),
          spacing: { before: 280, after: 140 },
        }),
      ];

    case "blockquote":
      return children.flatMap((child) => {
        const inner = blockOf(child, depth);
        return inner.map((block) =>
          block instanceof Paragraph
            ? new Paragraph({
                children: runsOf(child.content ?? []),
                indent: { left: convertInchesToTwip(0.35) },
                border: {
                  left: { style: BorderStyle.SINGLE, size: 12, color: "CCCCCC", space: 12 },
                },
                spacing: { after: 160 },
              })
            : block,
        );
      });

    case "codeBlock":
      // One paragraph per line: Word has no pre element, and a single run
      // with newlines in it collapses to one unreadable line.
      return (children.map((child) => child.text ?? "").join("") || " ")
        .split("\n")
        .map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line || " ", font: "Consolas", size: 19 })],
              shading: { type: ShadingType.CLEAR, fill: "F4F4F4" },
              spacing: { after: 0 },
            }),
        );

    case "horizontalRule":
      return [
        new Paragraph({
          text: "",
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "DDDDDD", space: 8 } },
          spacing: { before: 200, after: 200 },
        }),
      ];

    case "image":
      return [new Paragraph({ children: runsOf([node]), spacing: { after: 160 } })];

    case "bulletList":
    case "orderedList":
    case "taskList":
      return children.flatMap((item) => listItemOf(item, node.type!, depth));

    case "table":
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: children.map(
            (row) =>
              new TableRow({
                children: (row.content ?? []).map(
                  (cell) =>
                    new TableCell({
                      children: cellParagraphs(cell),
                      shading:
                        cell.type === "tableHeader"
                          ? { type: ShadingType.CLEAR, fill: "F4F4F4" }
                          : undefined,
                    }),
                ),
              }),
          ),
        }),
      ];

    default:
      return children.flatMap((child) => blockOf(child, depth));
  }
}

function listItemOf(
  item: JSONContent,
  kind: string,
  depth: number,
): (Paragraph | Table)[] {
  const parts = item.content ?? [];
  const [first, ...rest] = parts;

  const lead =
    kind === "taskList"
      ? [
          new TextRun({ text: item.attrs?.checked ? "☑  " : "☐  " }),
          ...runsOf(first?.content ?? []),
        ]
      : runsOf(first?.content ?? []);

  const head = new Paragraph({
    children: lead,
    spacing: { after: 80 },
    ...(kind === "bulletList"
      ? { bullet: { level: depth } }
      : kind === "orderedList"
        ? { numbering: { reference: "notebook-ordered", level: depth } }
        : { indent: { left: convertInchesToTwip(0.25 * (depth + 1)) } }),
  });

  // Nested lists and extra paragraphs inside the item keep their place.
  const tail = rest.flatMap((child) =>
    child.type === "bulletList" || child.type === "orderedList" || child.type === "taskList"
      ? blockOf(child, depth + 1)
      : blockOf(child, depth),
  );

  return [head, ...tail];
}

function sectionFor(note: Note): (Paragraph | Table)[] {
  const header: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: note.title })],
      heading: HeadingLevel.TITLE,
      spacing: { after: 80 },
    }),
  ];

  if (note.source) {
    header.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Week ${note.source.week}, day ${note.source.day} — ${note.source.title}`,
            italics: true,
            color: "666666",
          }),
        ],
        spacing: { after: 40 },
      }),
    );
  }

  header.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Written ${note.createdAt.slice(0, 10)} · last edited ${note.updatedAt.slice(0, 10)}`,
          italics: true,
          color: "888888",
          size: 18,
        }),
      ],
      spacing: { after: 280 },
    }),
  );

  return [...header, ...(note.doc.content ?? []).flatMap((node) => blockOf(node, 0))];
}

export async function toDocxBlob(notes: Note[]): Promise<Blob> {
  const document = new Document({
    numbering: {
      config: [
        {
          reference: "notebook-ordered",
          levels: [0, 1, 2].map((level) => ({
            level,
            format: LevelFormat.DECIMAL,
            text: `%${level + 1}.`,
            alignment: AlignmentType.START,
            style: {
              paragraph: {
                indent: {
                  left: convertInchesToTwip(0.25 * (level + 1)),
                  hanging: convertInchesToTwip(0.2),
                },
              },
            },
          })),
        },
      ],
    },
    sections: notes.map((note, index) => ({
      properties:
        // Each note starts its own page, except the first, which would
        // otherwise open on a blank one.
        index === 0 ? {} : { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: sectionFor(note),
    })),
  });

  return Packer.toBlob(document);
}
