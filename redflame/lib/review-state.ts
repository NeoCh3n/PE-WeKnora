import type { ReviewState } from "@/lib/types";

export const initialReviewState: ReviewState = {
  evidence: "pending",
  memo: "stale",
  deal: "review_required",
  receiptId: null,
  recordedAt: null,
};

export type ReviewAction =
  | { type: "accept"; now: string; receiptId: string }
  | { type: "keep_previous" }
  | { type: "investigate" }
  | { type: "reset" };

export function transitionReview(state: ReviewState, action: ReviewAction, comparable = true): ReviewState {
  if (action.type === "reset") return initialReviewState;
  if (state.evidence !== "pending") return state;
  if (action.type === "accept") {
    if (!comparable) return state;
    return {
      evidence: "accepted",
      memo: "draft_revision",
      deal: "hold",
      receiptId: action.receiptId,
      recordedAt: action.now,
    };
  }
  if (action.type === "keep_previous") {
    return { ...state, evidence: "kept_previous", memo: "current", deal: "approved" };
  }
  return { ...state, evidence: "investigate", memo: "stale", deal: "review_required" };
}
