import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { isConfirmedDefinitionChange, semanticFixture, semanticModelSchema, semanticSystemPrompt, semanticUserPrompt } from "../lib/semantic-model";

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required for eval:live");
  const model = process.env.OPENAI_MODEL || "gpt-5.6";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000, maxRetries: 0 });
  const response = await client.responses.parse({
    model,
    input: [
      { role: "system", content: semanticSystemPrompt },
      { role: "user", content: semanticUserPrompt() },
    ],
    text: { format: zodTextFormat(semanticModelSchema, "semantic_definition_diff") },
  });
  const result = response.output_parsed;
  if (!result) throw new Error("Model returned no parsed result");
  if (!isConfirmedDefinitionChange(result)) throw new Error("Eval failed: expected a high-confidence definition change");
  if (result.reason_code !== "adjustment_treatment_changed") throw new Error("Eval failed: unexpected reason_code");
  if (/\d/.test(result.explanation)) throw new Error("Eval failed: explanation contains a numeric claim");
  if (result.explanation.trim().split(/\s+/).length > 30) throw new Error("Eval failed: explanation exceeds 30 words");

  const timestamp = new Date().toISOString();
  const artifact = {
    mode: "live_eval",
    timestamp,
    model,
    fixtureId: semanticFixture.id,
    fixtureHash: createHash("sha256").update(JSON.stringify(semanticFixture)).digest("hex"),
    responseId: response.id,
    result,
  };
  const outputDir = path.join(process.cwd(), "evals", "live");
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${timestamp.replace(/[:.]/g, "-")}.json`);
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  await writeFile(outputPath, serialized, "utf8");
  await writeFile(path.join(outputDir, "latest.json"), serialized, "utf8");
  console.log(`Live eval passed: ${outputPath}`);
  console.log(`Judge-visible artifact updated: ${path.join(outputDir, "latest.json")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
