import { isConfirmedDefinitionChange, semanticModelSchema, type SemanticModelResult } from "@/lib/semantic-model";

export const allowedGpt56Models = ["gpt-5.6", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"] as const;

export function assertAllowedGpt56Model(model: string): void {
  if (!(allowedGpt56Models as readonly string[]).includes(model)) {
    throw new Error(`OPENAI_MODEL must be an official GPT-5.6 family model, received: ${model}`);
  }
}

export function sessionIdFromJsonl(stdout: string): string {
  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line) as { type?: string; thread_id?: string };
      if (event.type === "thread.started" && typeof event.thread_id === "string") return event.thread_id;
    } catch {
      // Non-JSON diagnostics are not evidence and can be ignored.
    }
  }
  throw new Error("Codex did not emit a thread.started session ID");
}

export function validateCodexEvalResult(rawResult: unknown): SemanticModelResult {
  const result = semanticModelSchema.parse(rawResult);
  if (!isConfirmedDefinitionChange(result)) throw new Error("Eval failed: expected a high-confidence definition change");
  if (result.reason_code !== "adjustment_treatment_changed") throw new Error("Eval failed: unexpected reason_code");
  return result;
}
