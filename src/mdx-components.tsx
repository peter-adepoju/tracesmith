import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/Callout";
import { Exercise } from "@/components/Exercise";
import { Quiz } from "@/components/Quiz";
import { RequestInspector } from "@/components/RequestInspector";
import { Terms } from "@/components/Terms";
import { Video } from "@/components/Video";
import { AccessibleName } from "@/components/interactive/AccessibleName";
import { BoxModel } from "@/components/interactive/BoxModel";
import { ConsoleLab } from "@/components/interactive/ConsoleLab";
import { CurlReader } from "@/components/interactive/CurlReader";
import { EndpointBuilder } from "@/components/interactive/EndpointBuilder";
import { JsonExplorer } from "@/components/interactive/JsonExplorer";
import { FormLab } from "@/components/interactive/FormLab";
import { HidingDemo } from "@/components/interactive/HidingDemo";
import { LivePlayground } from "@/components/interactive/LivePlayground";
import { PanelPicker } from "@/components/interactive/PanelPicker";
import { RedactionDrill } from "@/components/interactive/RedactionDrill";
import { RequestJourney } from "@/components/interactive/RequestJourney";
import { RiskMatrix } from "@/components/interactive/RiskMatrix";
import { SeverityGrid } from "@/components/interactive/SeverityGrid";
import { TestCaseBuilder } from "@/components/interactive/TestCaseBuilder";
import { TokenInspector } from "@/components/interactive/TokenInspector";
import { SpecificityScorer } from "@/components/interactive/SpecificityScorer";
import { StatusExplorer } from "@/components/interactive/StatusExplorer";
import { StorageAudit } from "@/components/interactive/StorageAudit";
import { ViewportSlider } from "@/components/interactive/ViewportSlider";
import { WaterfallExplorer } from "@/components/interactive/WaterfallExplorer";
import { WebhookSimulator } from "@/components/interactive/WebhookSimulator";

/**
 * Components every lesson can use without importing anything.
 * Keep this list short: a component that appears in one lesson belongs in
 * that lesson, not here.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    AccessibleName,
    BoxModel,
    Callout,
    ConsoleLab,
    CurlReader,
    EndpointBuilder,
    Exercise,
    FormLab,
    HidingDemo,
    JsonExplorer,
    LivePlayground,
    PanelPicker,
    Quiz,
    RedactionDrill,
    RequestInspector,
    RequestJourney,
    RiskMatrix,
    SeverityGrid,
    SpecificityScorer,
    StatusExplorer,
    StorageAudit,
    Terms,
    TestCaseBuilder,
    TokenInspector,
    Video,
    ViewportSlider,
    WaterfallExplorer,
    WebhookSimulator,
    ...components,
  };
}
