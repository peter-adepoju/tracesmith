import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/Callout";
import { Exercise } from "@/components/Exercise";
import { Quiz } from "@/components/Quiz";
import { RequestInspector } from "@/components/RequestInspector";
import { Terms } from "@/components/Terms";
import { Video } from "@/components/Video";

/**
 * Components every lesson can use without importing anything.
 * Keep this list short: a component that appears in one lesson belongs in
 * that lesson, not here.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    Exercise,
    Quiz,
    RequestInspector,
    Terms,
    Video,
    ...components,
  };
}
