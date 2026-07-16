import { describe, expect, it } from "vitest";
import { ambiguousCandidate, approvedSnapshot, candidateSnapshot } from "@/fixtures/deals";
import { classifyStructuredDiff } from "@/lib/semantic";

describe("semantic pre-check", () => {
  const approved = approvedSnapshot.metrics.exit_ebitda_fy2030;

  it("classifies the main fixture as a comparable value change", () => {
    expect(classifyStructuredDiff(approved, candidateSnapshot.metrics.exit_ebitda_fy2030)).toEqual({
      outcome: "value_change",
      comparable: true,
      recalculate: true,
      reason: "Period, unit, and explicit definition are comparable.",
    });
  });

  it("routes ambiguous source wording to model interpretation", () => {
    expect(classifyStructuredDiff(approved, ambiguousCandidate.metrics.exit_ebitda_fy2030).outcome).toBe(
      "ambiguous_definition",
    );
  });

  it("blocks explicit definition changes", () => {
    const changed = { ...candidateSnapshot.metrics.exit_ebitda_fy2030, basis: "Reported" };
    expect(classifyStructuredDiff(approved, changed).outcome).toBe("blocked");
  });

  it("investigates period changes", () => {
    const changed = { ...candidateSnapshot.metrics.exit_ebitda_fy2030, period: "LTM" };
    expect(classifyStructuredDiff(approved, changed).outcome).toBe("investigate");
  });
});
