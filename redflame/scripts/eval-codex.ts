import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { assertAllowedGpt56Model, sessionIdFromJsonl, validateCodexEvalResult } from "../lib/codex-eval";
import { semanticFixture } from "../lib/semantic-model";

const run = promisify(execFile);
const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

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

async function main() {
  assertAllowedGpt56Model(model);

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
    const result = validateCodexEvalResult(rawResult);

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
