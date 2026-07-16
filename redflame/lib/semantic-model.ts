import { z } from "zod";

export const semanticModelSchema = z.object({
  definition_changed: z.boolean(),
  reason_code: z.enum(["adjustment_treatment_changed", "scope_changed", "timing_changed", "unclear"]),
  explanation: z.string().max(240).refine((value) => !/\d/.test(value), "Explanation must not contain numeric claims"),
  confidence: z.number().min(0).max(1),
});

export type SemanticModelResult = z.infer<typeof semanticModelSchema>;

export function isConfirmedDefinitionChange(result: SemanticModelResult): boolean {
  return result.definition_changed && result.confidence >= 0.85;
}

export const semanticFixture = {
  id: "candidate-ambiguous-definition",
  metricId: "exit_ebitda_fy2030",
  approvedNote: "EBITDA before one-time transformation costs.",
  candidateNote: "EBITDA including normalized transformation adjustments.",
  period: "FY2030",
  unit: "USD_m",
  approvedBasis: "",
  candidateBasis: "",
} as const;

export const semanticSystemPrompt = `You classify whether two descriptions of the same financial metric use materially different definitions.
Return only the requested structured result.
Do not calculate, repeat, or introduce any numeric value.
Use adjustment_treatment_changed when the inclusion or exclusion of adjustments differs.
Use confidence conservatively. The application will route confidence below its threshold to human investigation.`;

export function semanticUserPrompt(): string {
  return [
    `Metric: ${semanticFixture.metricId}`,
    `Period: ${semanticFixture.period}`,
    `Unit: ${semanticFixture.unit}`,
    `Approved note: ${semanticFixture.approvedNote}`,
    `Candidate note: ${semanticFixture.candidateNote}`,
    "Determine whether the definitions changed and explain the semantic reason without numeric claims.",
  ].join("\n");
}
