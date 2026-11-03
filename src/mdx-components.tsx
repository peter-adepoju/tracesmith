import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/Callout";
import { Exercise } from "@/components/Exercise";
import { Quiz } from "@/components/Quiz";
import { RequestInspector } from "@/components/RequestInspector";
import { Terms } from "@/components/Terms";
import { Video } from "@/components/Video";
import { BoxModel } from "@/components/interactive/BoxModel";
import { FormLab } from "@/components/interactive/FormLab";
import { HidingDemo } from "@/components/interactive/HidingDemo";
import { LivePlayground } from "@/components/interactive/LivePlayground";
import { RequestJourney } from "@/components/interactive/RequestJourney";
import { SpecificityScorer } from "@/components/interactive/SpecificityScorer";
import { StatusExplorer } from "@/components/interactive/StatusExplorer";
import { ViewportSlider } from "@/components/interactive/ViewportSlider";

/**
 * Components every lesson can use without importing anything.
 * Keep this list short: a component that appears in one lesson belongs in
 * that lesson, not here.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    BoxModel,
    Callout,
    Exercise,
    FormLab,
    HidingDemo,
    LivePlayground,
    Quiz,
    RequestInspector,
    RequestJourney,
    SpecificityScorer,
    StatusExplorer,
    Terms,
    Video,
    ViewportSlider,
    ...components,
  };
}
