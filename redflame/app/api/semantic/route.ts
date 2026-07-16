import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { semanticFixture, semanticModelSchema, semanticSystemPrompt, semanticUserPrompt } from "@/lib/semantic-model";

export const runtime = "nodejs";
export const maxDuration = 20;

const requestSchema = z.object({ fixtureId: z.literal("candidate-ambiguous-definition") }).strict();

function unavailable(reason: string, status = 503) {
  return NextResponse.json(
    { mode: "recorded_available", state: "investigate", reason },
    { status, headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (request.headers.get("content-length") && Number(request.headers.get("content-length")) > 256) {
    return unavailable("Request body is too large.", 413);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return unavailable("Invalid JSON body.", 400);
  }
  const parsedRequest = requestSchema.safeParse(payload);
  if (!parsedRequest.success || parsedRequest.data.fixtureId !== semanticFixture.id) {
    return unavailable("Unknown fixture.", 400);
  }

  if (process.env.ENABLE_LIVE_SEMANTIC !== "true") return unavailable("The public live endpoint is disabled.");
  if (!process.env.OPENAI_API_KEY) return unavailable("OpenAI is not configured.");
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return unavailable("Rate limiting is not configured.");
  }

  try {
    const redis = Redis.fromEnv();
    const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10 m"), prefix: "redflame:semantic" });
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const identity = forwarded || request.headers.get("x-real-ip") || "unknown";
    const limit = await limiter.limit(identity);
    if (!limit.success) return unavailable("Rate limit exceeded.", 429);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 15_000, maxRetries: 0 });
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      input: [
        { role: "system", content: semanticSystemPrompt },
        { role: "user", content: semanticUserPrompt() },
      ],
      text: { format: zodTextFormat(semanticModelSchema, "semantic_definition_diff") },
    });
    const result = response.output_parsed;
    if (!result || result.confidence < 0.85) return unavailable("Model confidence is below the review threshold.");
    return NextResponse.json(
      { mode: "live", timestamp: new Date().toISOString(), fixtureId: semanticFixture.id, result },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("semantic classification failed", error instanceof Error ? error.message : "unknown error");
    return unavailable("Semantic classification failed. Route to investigation.");
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { allow: "POST" } });
}
