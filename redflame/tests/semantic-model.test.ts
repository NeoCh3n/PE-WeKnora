import { describe, expect, it } from "vitest";
import { isConfirmedDefinitionChange, semanticModelSchema } from "@/lib/semantic-model";

describe("semantic model output contract", () => {
  it("accepts a bounded non-numeric explanation", () => {
    expect(semanticModelSchema.parse({
      definition_changed: true,
      reason_code: "adjustment_treatment_changed",
      explanation: "The notes treat transformation adjustments differently.",
      confidence: 0.91,
    }).definition_changed).toBe(true);
  });

  it("rejects numeric claims and invalid reason codes", () => {
    expect(() => semanticModelSchema.parse({
      definition_changed: true,
      reason_code: "value_changed",
      explanation: "The metric moved by 20 percent.",
      confidence: 0.91,
    })).toThrow();
  });

  it("fails closed unless the model confirms a high-confidence definition change", () => {
    const base = {
      definition_changed: true,
      reason_code: "adjustment_treatment_changed" as const,
      explanation: "The notes treat adjustments differently.",
      confidence: 0.91,
    };
    expect(isConfirmedDefinitionChange(base)).toBe(true);
    expect(isConfirmedDefinitionChange({ ...base, definition_changed: false })).toBe(false);
    expect(isConfirmedDefinitionChange({ ...base, confidence: 0.84 })).toBe(false);
  });
});
