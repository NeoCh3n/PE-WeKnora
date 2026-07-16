import type { Metric, SemanticDiff } from "@/lib/types";

const conversions: Record<string, number> = {
  USD_m: 1,
  USD_k: 0.001,
};

function canonicalValue(metric: Metric): number | null {
  if (metric.unit === "USD_m") return metric.value;
  const factor = conversions[metric.unit as string];
  return factor ? metric.value * factor : null;
}

export function classifyStructuredDiff(approved: Metric, candidate: Metric): SemanticDiff {
  if (approved.value === undefined || candidate.value === undefined) {
    return { outcome: "investigate", comparable: false, recalculate: false, reason: "A required value is missing." };
  }
  if (approved.period !== candidate.period) {
    return { outcome: "investigate", comparable: false, recalculate: false, reason: "The reporting periods differ." };
  }
  if ((approved.basis || "") !== (candidate.basis || "") && approved.basis && candidate.basis) {
    return { outcome: "blocked", comparable: false, recalculate: false, reason: "The explicit metric definitions differ." };
  }
  if (!approved.basis || !candidate.basis) {
    if ((approved.note || "") !== (candidate.note || "")) {
      return {
        outcome: "ambiguous_definition",
        comparable: null,
        recalculate: false,
        reason: "Structured tags cannot resolve the source-language definition.",
      };
    }
  }
  const approvedCanonical = canonicalValue(approved);
  const candidateCanonical = canonicalValue(candidate);
  if (approvedCanonical === null || candidateCanonical === null) {
    return { outcome: "investigate", comparable: false, recalculate: false, reason: "The units are unknown or incompatible." };
  }
  if (approvedCanonical === candidateCanonical) {
    return {
      outcome: approved.value === candidate.value ? "no_change" : "precision_only",
      comparable: true,
      recalculate: false,
      reason: "The canonical value and definition are unchanged.",
    };
  }
  return {
    outcome: approved.unit === candidate.unit ? "value_change" : "convertible_unit",
    comparable: true,
    recalculate: true,
    reason: "Period, unit, and explicit definition are comparable.",
  };
}
