import { describe, expect, it } from "vitest";
import { assertAllowedGpt56Model, sessionIdFromJsonl, validateCodexEvalResult } from "@/lib/codex-eval";

const validResult = {
  definition_changed: true,
  reason_code: "adjustment_treatment_changed" as const,
  explanation: "The notes apply transformation adjustments differently.",
  confidence: 0.93,
};

describe("Codex GPT-5.6 eval evidence", () => {
  it("allows only official GPT-5.6 family identifiers", () => {
    expect(() => assertAllowedGpt56Model("gpt-5.6-luna")).not.toThrow();
    expect(() => assertAllowedGpt56Model("gpt-5.5")).toThrow(/GPT-5.6 family/);
  });

  it("extracts the separate eval session ID from JSONL diagnostics", () => {
    const stdout = [
      "unstructured diagnostic",
      JSON.stringify({ type: "thread.started", thread_id: "session-123" }),
      JSON.stringify({ type: "turn.started" }),
    ].join("\n");
    expect(sessionIdFromJsonl(stdout)).toBe("session-123");
    expect(() => sessionIdFromJsonl('{"type":"turn.started"}')).toThrow(/session ID/);
  });

  it("rejects low-confidence, unchanged, or wrong-reason results", () => {
    expect(validateCodexEvalResult(validResult)).toEqual(validResult);
    expect(() => validateCodexEvalResult({ ...validResult, confidence: 0.84 })).toThrow(/high-confidence/);
    expect(() => validateCodexEvalResult({ ...validResult, definition_changed: false })).toThrow(/high-confidence/);
    expect(() => validateCodexEvalResult({ ...validResult, reason_code: "scope_changed" })).toThrow(/reason_code/);
  });
});
