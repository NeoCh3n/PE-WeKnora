import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { isConfirmedDefinitionChange, semanticFixture, semanticModelSchema } from "../lib/semantic-model";

const run = promisify(execFile);
const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const supportedModels = new Set(["gpt-5.6", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"]);

const outputSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["definition_changed", "reason_code", "explanation", "confidence"],
  properties: {
    definition_changed: { const: true },
    reason_code: {
      type: "string",
      enum: ["adjustment_treatment_changed", "scope_changed", "timing_changed", "unclear"],
    },
    explanation: { type: "string", maxLength: 240, pattern: "^[^0-9]*$" },
    confidence: { type: "number", minimum: 0.85, maximum: 1 },
  },
};

const prompt = `Do not call tools or inspect files. Perform one bounded semantic classification for RedFlame.
Metric: ${semanticFixture.metricId}
Period: ${semanticFixture.period}
Unit: ${semanticFixture.unit}
Approved note: ${semanticFixture.approvedNote}
Candidate note: ${semanticFixture.candidateNote}
Determine whether the definitions materially changed. Return only the JSON object required by the output schema. Do not calculate, repeat, or introduce numeric financial claims.`;

function sessionIdFromJsonl(stdout: string): string {
  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line) as { type?: string; thread_id?: string };
      if (event.type === "thread.started" && typeof event.thread_id === "string") return event.thread_id;
    } catch {
      // Non-JSON diagnostic lines are not evidence and can be ignored.
    }
  }
  throw new Error("Codex did not emit a thread.started session ID");
}

async function main() {
  if (!supportedModels.has(model)) throw new Error(`OPENAI_MODEL must be an official GPT-5.6 family model, received: ${model}`);

  const isolatedDir = await mkdtemp(path.join(tmpdir(), "redflame-gpt56-"));
  const schemaPath = path.join(isolatedDir, "output.schema.json");
  const resultPath = path.join(isolatedDir, "result.json");
  try {
    await writeFile(schemaPath, `${JSON.stringify(outputSchema, null, 2)}\n`, "utf8");
    const { stdout, stderr } = await run("codex", [
      "exec",
      "--model", model,
      "-c", "model_reasoning_effort=\"low\"",
      "--sandbox", "read-only",
      "--skip-git-repo-check",
      "--output-schema", schemaPath,
      "--output-last-message", resultPath,
      "--json",
      prompt,
    ], {
      cwd: isolatedDir,
      timeout: 480_000,
      maxBuffer: 4 * 1024 * 1024,
    });

    if (stderr.trim()) console.error(stderr.trim());
    const codexSessionId = sessionIdFromJsonl(stdout);
    const rawResult = JSON.parse(await readFile(resultPath, "utf8"));
    const result = semanticModelSchema.parse(rawResult);
    if (!isConfirmedDefinitionChange(result)) throw new Error("Eval failed: expected a high-confidence definition change");
    if (result.reason_code !== "adjustment_treatment_changed") throw new Error("Eval failed: unexpected reason_code");

    const timestamp = new Date().toISOString();
    const artifact = {
      mode: "live_eval",
      provider: "codex_cli",
      timestamp,
      model,
      fixtureId: semanticFixture.id,
      fixtureHash: createHash("sha256").update(JSON.stringify(semanticFixture)).digest("hex"),
      codexSessionId,
      result,
    };
    const outputDir = path.join(process.cwd(), "evals", "live");
    await mkdir(outputDir, { recursive: true });
    const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
    const immutablePath = path.join(outputDir, `${timestamp.replace(/[:.]/g, "-")}-codex.json`);
    await writeFile(immutablePath, serialized, "utf8");
    await writeFile(path.join(outputDir, "latest.json"), serialized, "utf8");
    console.log(`Codex GPT-5.6 eval passed: ${immutablePath}`);
    console.log(`Codex eval session: ${codexSessionId}`);
  } finally {
    await rm(isolatedDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
