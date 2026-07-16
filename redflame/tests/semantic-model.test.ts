import { describe, expect, it } from "vitest";
import { semanticModelSchema } from "@/lib/semantic-model";

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
});
