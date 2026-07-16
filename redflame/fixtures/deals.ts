import type { DealSnapshot, DecisionTestDefinition, TestId } from "@/lib/types";

const shared = {
  exit_multiple: {
    id: "exit_multiple" as const,
    label: "Exit Multiple",
    value: 8,
    unit: "multiple" as const,
    period: "FY2030",
    source: { document: "Approved Decision v3", locator: "Returns bridge" },
  },
  exit_net_debt: {
    id: "exit_net_debt" as const,
    label: "Exit Net Debt",
    value: 12,
    unit: "USD_m" as const,
    period: "FY2030",
    source: { document: "Approved Decision v3", locator: "Returns bridge" },
  },
  entry_equity: {
    id: "entry_equity" as const,
    label: "Entry Equity",
    value: 60,
    unit: "USD_m" as const,
    period: "Entry",
    source: { document: "Approved Decision v3", locator: "Sources & uses" },
  },
  holding_period_years: {
    id: "holding_period_years" as const,
    label: "Holding Period",
    value: 5,
    unit: "years" as const,
    period: "Entry to FY2030",
    source: { document: "Approved Decision v3", locator: "Returns bridge" },
  },
  top_customer_revenue_share: {
    id: "top_customer_revenue_share" as const,
    label: "Top Customer Revenue Share",
    value: 0.18,
    unit: "ratio" as const,
    period: "LTM",
    source: { document: "Commercial DD v3", locator: "Page 14" },
  },
};

export const approvedSnapshot: DealSnapshot = {
  id: "approved-v3",
  version: 3,
  status: "approved",
  metrics: {
    exit_ebitda_fy2030: {
      id: "exit_ebitda_fy2030",
      label: "FY2030 Exit EBITDA",
      value: 24,
      unit: "USD_m",
      period: "FY2030",
      basis: "Adjusted",
      note: "Adjusted EBITDA including approved add-backs.",
      source: { document: "Management Model v3", locator: "F42" },
    },
    ...shared,
  },
};

export const candidateSnapshot: DealSnapshot = {
  id: "candidate-v4",
  version: 4,
  status: "candidate",
  metrics: {
    exit_ebitda_fy2030: {
      id: "exit_ebitda_fy2030",
      label: "FY2030 Exit EBITDA",
      value: 20,
      unit: "USD_m",
      period: "FY2030",
      basis: "Adjusted",
      note: "Adjusted EBITDA including approved add-backs.",
      source: { document: "Management Model v4", locator: "F42" },
    },
    ...shared,
  },
};

export const ambiguousCandidate: DealSnapshot = {
  ...candidateSnapshot,
  id: "candidate-ambiguous-definition",
  metrics: {
    ...candidateSnapshot.metrics,
    exit_ebitda_fy2030: {
      ...candidateSnapshot.metrics.exit_ebitda_fy2030,
      note: "EBITDA including normalized transformation adjustments.",
      basis: "",
      source: { document: "Management Note v4", locator: "Paragraph 6" },
    },
  },
};

export const decisionTests: Record<TestId, DecisionTestDefinition> = {
  base_case_moic_hurdle: {
    id: "base_case_moic_hurdle",
    name: "Base-case MOIC ≥ 2.50x",
    dependency: "base_case_moic",
    operator: ">=",
    threshold: 2.5,
    thresholdVersion: 1,
  },
  base_case_irr_hurdle: {
    id: "base_case_irr_hurdle",
    name: "Base-case IRR ≥ 20%",
    dependency: "base_case_irr",
    operator: ">=",
    threshold: 0.2,
    thresholdVersion: 1,
  },
  top_customer_concentration: {
    id: "top_customer_concentration",
    name: "Top customer concentration ≤ 20%",
    dependency: "top_customer_revenue_share",
    operator: "<=",
    threshold: 0.2,
    thresholdVersion: 1,
  },
};

export const memoParagraphs = [
  {
    id: "memo-p4",
    title: "Exit case",
    approved: "The base case assumes $24.0m of FY2030 Adjusted EBITDA at an 8.0x exit multiple.",
    draft: "The updated base case assumes $20.0m of FY2030 Adjusted EBITDA at an 8.0x exit multiple.",
  },
  {
    id: "memo-p7",
    title: "Base-case returns",
    approved: "The base case clears the fund's 2.50x MOIC and 20% IRR hurdles.",
    draft: "The updated base case produces 2.47x MOIC and 19.79% IRR, below both approved hurdles.",
  },
];
