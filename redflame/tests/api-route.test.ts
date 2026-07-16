import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/semantic/route";

const originalEnable = process.env.ENABLE_LIVE_SEMANTIC;

afterEach(() => {
  process.env.ENABLE_LIVE_SEMANTIC = originalEnable;
});

describe("semantic endpoint boundary", () => {
  it("rejects unknown fixtures", async () => {
    const response = await POST(new NextRequest("http://localhost/api/semantic", {
      method: "POST",
      body: JSON.stringify({ fixtureId: "arbitrary-user-prompt" }),
      headers: { "content-type": "application/json" },
    }));
    expect(response.status).toBe(400);
  });

  it("fails closed when the live endpoint is disabled", async () => {
    process.env.ENABLE_LIVE_SEMANTIC = "false";
    const response = await POST(new NextRequest("http://localhost/api/semantic", {
      method: "POST",
      body: JSON.stringify({ fixtureId: "candidate-ambiguous-definition" }),
      headers: { "content-type": "application/json" },
    }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ mode: "recorded_available", state: "investigate" });
  });
});
