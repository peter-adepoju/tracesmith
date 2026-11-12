import type { Metadata } from "next";
import { NotebookApp } from "@/components/notebook/NotebookApp";

export const metadata: Metadata = {
  title: "Notebook",
  description:
    "Your own record of the course: clippings from lessons, notes in your words, exportable to Word, PDF, Markdown or HTML.",
};

/**
 * The notebook route.
 *
 * Everything below here is client-side: the notes live in IndexedDB, which
 * the server cannot see. This page renders the shell so the route is still a
 * real page with a title, and the app fills in once the database opens.
 */
export default function NotebookPage() {
  return <NotebookApp />;
}
