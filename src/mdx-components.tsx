import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/Callout";
import { Exercise } from "@/components/Exercise";
import { Quiz } from "@/components/Quiz";
import { RequestInspector } from "@/components/RequestInspector";
import { Terms } from "@/components/Terms";
import { Video } from "@/components/Video";
import { AccessibleName } from "@/components/interactive/AccessibleName";
import { AccessMatrix } from "@/components/interactive/AccessMatrix";
import { AgentTest } from "@/components/interactive/AgentTest";
import { AssertionLab } from "@/components/interactive/AssertionLab";
import { AutomationScorer } from "@/components/interactive/AutomationScorer";
import { BoxModel } from "@/components/interactive/BoxModel";
import { BugReportGrader } from "@/components/interactive/BugReportGrader";
import { ConsoleLab } from "@/components/interactive/ConsoleLab";
import { CurlReader } from "@/components/interactive/CurlReader";
import { EndpointBuilder } from "@/components/interactive/EndpointBuilder";
import { EvalRunner } from "@/components/interactive/EvalRunner";
import { IdorProbe } from "@/components/interactive/IdorProbe";
import { JsonExplorer } from "@/components/interactive/JsonExplorer";
import { KeyboardPass } from "@/components/interactive/KeyboardPass";
import { ExposureScan } from "@/components/interactive/ExposureScan";
import { FlakyRunner } from "@/components/interactive/FlakyRunner";
import { FormLab } from "@/components/interactive/FormLab";
import { HidingDemo } from "@/components/interactive/HidingDemo";
import { LivePlayground } from "@/components/interactive/LivePlayground";
import { NetworkVerdict } from "@/components/interactive/NetworkVerdict";
import { PanelPicker } from "@/components/interactive/PanelPicker";
import { PaymentTrace } from "@/components/interactive/PaymentTrace";
import { QueueTriage } from "@/components/interactive/QueueTriage";
import { RedactionDrill } from "@/components/interactive/RedactionDrill";
import { RegressionPicker } from "@/components/interactive/RegressionPicker";
import { RequestJourney } from "@/components/interactive/RequestJourney";
import { RetryPlanner } from "@/components/interactive/RetryPlanner";
import { RunTwice } from "@/components/interactive/RunTwice";
import { RiskMatrix } from "@/components/interactive/RiskMatrix";
import { SelectorLab } from "@/components/interactive/SelectorLab";
import { SeverityGrid } from "@/components/interactive/SeverityGrid";
import { TestCaseBuilder } from "@/components/interactive/TestCaseBuilder";
import { TokenInspector } from "@/components/interactive/TokenInspector";
import { SlaClock } from "@/components/interactive/SlaClock";
import { SpecificityScorer } from "@/components/interactive/SpecificityScorer";
import { SqlConsole } from "@/components/interactive/SqlConsole";
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
    AccessMatrix,
    AgentTest,
    AssertionLab,
    AutomationScorer,
    BoxModel,
    BugReportGrader,
    Callout,
    ConsoleLab,
    CurlReader,
    EndpointBuilder,
    EvalRunner,
    Exercise,
    ExposureScan,
    FlakyRunner,
    FormLab,
    HidingDemo,
    IdorProbe,
    JsonExplorer,
    KeyboardPass,
    LivePlayground,
    NetworkVerdict,
    PanelPicker,
    PaymentTrace,
    Quiz,
    QueueTriage,
    RedactionDrill,
    RegressionPicker,
    RequestInspector,
    RequestJourney,
    RetryPlanner,
    RiskMatrix,
    RunTwice,
    SelectorLab,
    SeverityGrid,
    SlaClock,
    SpecificityScorer,
    SqlConsole,
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
