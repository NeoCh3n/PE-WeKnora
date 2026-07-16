import Decimal from "decimal.js";
import { decisionTests } from "@/fixtures/deals";
import type {
  CompileResult,
  DealSnapshot,
  DerivedMetricId,
  MetricId,
  TestId,
  TestOutcome,
} from "@/lib/types";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

const returnPath: Array<MetricId | DerivedMetricId | TestId | string> = [
  "exit_ebitda_fy2030",
  "exit_ev",
  "exit_equity",
  "base_case_moic",
  "base_case_irr",
  "base_case_moic_hurdle",
  "base_case_irr_hurdle",
  "memo-p4",
  "memo-p7",
];

function numeric(snapshot: DealSnapshot, id: MetricId): Decimal {
  const metric = snapshot.metrics[id];
  if (!metric || !Number.isFinite(metric.value)) {
    throw new Error(`Missing or invalid metric: ${id}`);
  }
  return new Decimal(metric.value);
}

function outcome(
  id: TestId,
  actual: Decimal | null,
  execution: TestOutcome["execution"],
): TestOutcome {
  const definition = decisionTests[id];
  if (!actual || execution === "blocked") {
    return { ...definition, actual: null, result: "unknown", execution };
  }
  const threshold = new Decimal(definition.threshold);
  const passed = definition.operator === ">=" ? actual.greaterThanOrEqualTo(threshold) : actual.lessThanOrEqualTo(threshold);
  return { ...definition, actual: actual.toNumber(), result: passed ? "pass" : "fail", execution };
}

export function compileSnapshot(
  snapshot: DealSnapshot,
  changedMetricIds: MetricId[] = ["exit_ebitda_fy2030"],
): CompileResult {
  const changed = new Set(changedMetricIds);
  try {
    const ebitda = numeric(snapshot, "exit_ebitda_fy2030");
    const multiple = numeric(snapshot, "exit_multiple");
    const netDebt = numeric(snapshot, "exit_net_debt");
    const entryEquity = numeric(snapshot, "entry_equity");
    const holdingPeriod = numeric(snapshot, "holding_period_years");
    const concentration = numeric(snapshot, "top_customer_revenue_share");

    if (entryEquity.lessThanOrEqualTo(0)) throw new Error("Entry equity must be greater than zero");
    if (holdingPeriod.lessThanOrEqualTo(0)) throw new Error("Holding period must be greater than zero");

    const exitEv = ebitda.times(multiple);
    const exitEquity = exitEv.minus(netDebt);
    if (exitEquity.lessThanOrEqualTo(0)) throw new Error("Exit equity must be greater than zero");
    const moic = exitEquity.dividedBy(entryEquity);
    const irr = moic.pow(new Decimal(1).dividedBy(holdingPeriod)).minus(1);

    const returnChanged = ["exit_ebitda_fy2030", "exit_multiple", "exit_net_debt", "entry_equity", "holding_period_years"].some(
      (id) => changed.has(id as MetricId),
    );
    const concentrationChanged = changed.has("top_customer_revenue_share");

    const tests: CompileResult["tests"] = {
      base_case_moic_hurdle: outcome("base_case_moic_hurdle", moic, returnChanged ? "evaluated" : "reused"),
      base_case_irr_hurdle: outcome("base_case_irr_hurdle", irr, returnChanged ? "evaluated" : "reused"),
      top_customer_concentration: outcome(
        "top_customer_concentration",
        concentration,
        concentrationChanged ? "evaluated" : "reused",
      ),
    };
    const allIds = Object.keys(tests) as TestId[];
    return {
      derived: {
        exit_ev: exitEv.toNumber(),
        exit_equity: exitEquity.toNumber(),
        base_case_moic: moic.toNumber(),
        base_case_irr: irr.toNumber(),
      },
      tests,
      evaluatedTestIds: allIds.filter((id) => tests[id].execution === "evaluated"),
      reusedTestIds: allIds.filter((id) => tests[id].execution === "reused"),
      blockedTestIds: [],
      impactPath: returnChanged ? returnPath : ["top_customer_revenue_share", "top_customer_concentration"],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calculation blocked";
    const blockedIds = Object.keys(decisionTests) as TestId[];
    return {
      derived: { exit_ev: null, exit_equity: null, base_case_moic: null, base_case_irr: null },
      tests: {
        base_case_moic_hurdle: outcome("base_case_moic_hurdle", null, "blocked"),
        base_case_irr_hurdle: outcome("base_case_irr_hurdle", null, "blocked"),
        top_customer_concentration: outcome("top_customer_concentration", null, "blocked"),
      },
      evaluatedTestIds: [],
      reusedTestIds: [],
      blockedTestIds: blockedIds,
      impactPath: [],
      error: message,
    };
  }
}

export function formatMoney(value: number | null): string {
  return value === null ? "—" : `$${new Decimal(value).toDecimalPlaces(2).toFixed(2)}m`;
}

export function formatMoic(value: number | null): string {
  return value === null ? "—" : `${new Decimal(value).toDecimalPlaces(2).toFixed(2)}x`;
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${new Decimal(value).times(100).toDecimalPlaces(2).toFixed(2)}%`;
}
