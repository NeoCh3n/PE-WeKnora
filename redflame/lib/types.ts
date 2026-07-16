export type MetricId =
  | "exit_ebitda_fy2030"
  | "exit_multiple"
  | "exit_net_debt"
  | "entry_equity"
  | "holding_period_years"
  | "top_customer_revenue_share";

export type DerivedMetricId =
  | "exit_ev"
  | "exit_equity"
  | "base_case_moic"
  | "base_case_irr";

export type TestId =
  | "base_case_moic_hurdle"
  | "base_case_irr_hurdle"
  | "top_customer_concentration";

export interface SourceRef {
  document: string;
  locator: string;
}

export interface Metric {
  id: MetricId;
  label: string;
  value: number;
  unit: "USD_m" | "multiple" | "years" | "ratio";
  period: string;
  basis?: string;
  note?: string;
  source: SourceRef;
}

export interface DealSnapshot {
  id: string;
  version: number;
  status: "approved" | "candidate";
  metrics: Record<MetricId, Metric>;
}

export interface DecisionTestDefinition {
  id: TestId;
  name: string;
  dependency: DerivedMetricId | MetricId;
  operator: ">=" | "<=";
  threshold: number;
  thresholdVersion: number;
}

export type TestResult = "pass" | "fail" | "unknown";
export type TestExecution = "evaluated" | "reused" | "blocked";

export interface TestOutcome extends DecisionTestDefinition {
  result: TestResult;
  execution: TestExecution;
  actual: number | null;
}

export interface CompileResult {
  derived: Record<DerivedMetricId, number | null>;
  tests: Record<TestId, TestOutcome>;
  evaluatedTestIds: TestId[];
  reusedTestIds: TestId[];
  blockedTestIds: TestId[];
  impactPath: Array<MetricId | DerivedMetricId | TestId | string>;
  error?: string;
}

export type EvidenceResolution = "pending" | "accepted" | "kept_previous" | "investigate";
export type MemoLifecycle = "current" | "stale" | "draft_revision" | "reviewed";
export type DealDecision = "review_required" | "hold" | "approved" | "rejected";

export interface ReviewState {
  evidence: EvidenceResolution;
  memo: MemoLifecycle;
  deal: DealDecision;
  receiptId: string | null;
  recordedAt: string | null;
}

export type SemanticOutcome =
  | "no_change"
  | "value_change"
  | "precision_only"
  | "convertible_unit"
  | "investigate"
  | "blocked"
  | "ambiguous_definition";

export interface SemanticDiff {
  outcome: SemanticOutcome;
  comparable: boolean | null;
  recalculate: boolean;
  reason: string;
}
