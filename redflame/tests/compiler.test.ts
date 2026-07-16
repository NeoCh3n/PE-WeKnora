import { describe, expect, it } from "vitest";
import { approvedSnapshot, candidateSnapshot } from "@/fixtures/deals";
import { compileSnapshot, formatMoic, formatMoney, formatPercent } from "@/lib/compiler";

describe("deterministic return compiler", () => {
  it("locks the approved and candidate golden outputs", () => {
    const approved = compileSnapshot(approvedSnapshot);
    const candidate = compileSnapshot(candidateSnapshot);

    expect(approved.derived.exit_ev).toBe(192);
    expect(approved.derived.exit_equity).toBe(180);
    expect(formatMoic(approved.derived.base_case_moic)).toBe("3.00x");
    expect(formatPercent(approved.derived.base_case_irr)).toBe("24.57%");

    expect(candidate.derived.exit_ev).toBe(160);
    expect(candidate.derived.exit_equity).toBe(148);
    expect(candidate.derived.base_case_moic).toBeCloseTo(2.4666666667, 9);
    expect(formatMoic(candidate.derived.base_case_moic)).toBe("2.47x");
    expect(formatPercent(candidate.derived.base_case_irr)).toBe("19.79%");
    expect(formatMoney(candidate.derived.exit_equity)).toBe("$148.00m");
  });

  it("fails both return hurdles and reuses the unaffected concentration test", () => {
    const result = compileSnapshot(candidateSnapshot, ["exit_ebitda_fy2030"]);
    expect(result.tests.base_case_moic_hurdle.result).toBe("fail");
    expect(result.tests.base_case_irr_hurdle.result).toBe("fail");
    expect(result.tests.top_customer_concentration.result).toBe("pass");
    expect(result.evaluatedTestIds).toEqual(["base_case_moic_hurdle", "base_case_irr_hurdle"]);
    expect(result.reusedTestIds).toEqual(["top_customer_concentration"]);
  });

  it("blocks invalid calculation domains", () => {
    const invalid = structuredClone(candidateSnapshot);
    invalid.metrics.entry_equity.value = 0;
    const result = compileSnapshot(invalid);
    expect(result.error).toMatch(/Entry equity/);
    expect(result.blockedTestIds).toHaveLength(3);
    expect(result.tests.base_case_irr_hurdle.result).toBe("unknown");
  });

  it("compares thresholds on unrounded values", () => {
    const boundary = structuredClone(candidateSnapshot);
    boundary.metrics.exit_ebitda_fy2030.value = 20.25;
    const result = compileSnapshot(boundary);
    expect(result.derived.base_case_moic).toBe(2.5);
    expect(result.tests.base_case_moic_hurdle.result).toBe("pass");
    expect(result.tests.base_case_irr_hurdle.result).toBe("pass");
  });
});
