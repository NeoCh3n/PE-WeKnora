import { describe, expect, it } from "vitest";
import { initialReviewState, transitionReview } from "@/lib/review-state";

describe("review resolution state machine", () => {
  it("accepts evidence without approving the investment", () => {
    const result = transitionReview(initialReviewState, {
      type: "accept",
      now: "2026-07-16T08:00:00.000Z",
      receiptId: "RES-004",
    });
    expect(result).toMatchObject({ evidence: "accepted", memo: "draft_revision", deal: "hold" });
  });

  it("disables acceptance for non-comparable evidence", () => {
    expect(
      transitionReview(
        initialReviewState,
        { type: "accept", now: "2026-07-16T08:00:00.000Z", receiptId: "RES-004" },
        false,
      ),
    ).toEqual(initialReviewState);
  });

  it("is idempotent after resolution", () => {
    const accepted = transitionReview(initialReviewState, {
      type: "accept",
      now: "2026-07-16T08:00:00.000Z",
      receiptId: "RES-004",
    });
    expect(transitionReview(accepted, { type: "investigate" })).toBe(accepted);
  });

  it("retains the approved decision when the candidate is kept out", () => {
    expect(transitionReview(initialReviewState, { type: "keep_previous" })).toMatchObject({
      evidence: "kept_previous",
      memo: "current",
      deal: "approved",
    });
  });
});
