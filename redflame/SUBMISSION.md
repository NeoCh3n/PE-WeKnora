# OpenAI Build Week Submission Draft

## Project

**RedFlame Decision CI**

**Tagline:** Pull requests and CI tests for investment decisions.

**Public app:** https://redflame-plum.vercel.app

**Source branch:** https://github.com/NeoCh3n/PE-WeKnora/tree/codex/redflame-decision-ci/redflame

## One-paragraph pitch

Investment teams already use AI to summarize diligence and draft IC memos. The dangerous gap appears after those materials exist: a revised seller model arrives, but the old return calculations and investment assertions can quietly survive. RedFlame treats new evidence like a pull request. It compares the definition, deterministically recompiles only the affected financial path, reruns versioned MOIC and IRR hurdles, marks dependent memo paragraphs stale, and asks a human to Accept, Keep, or Investigate the evidence. Accepting a fact never approves the investment.

## Inspiration and problem

The target workflow is a PE Associate preparing an IC memo when a revised seller model changes an assumption such as exit EBITDA. Existing AI workflows can search deal materials, preserve source lineage, update models, and regenerate memos. RedFlame tests a narrower control question: **does the newly accepted evidence invalidate a decision the team previously believed had passed?**

Current impact status must remain explicit: this is an unvalidated workflow hypothesis until direct user conversations are completed. Do not insert invented time savings or quotations.

## What it does

- Shows Approved Decision v3 against Candidate Evidence v4.
- Distinguishes a comparable value change from an ambiguous definition change.
- Computes Exit EV, Exit Equity, MOIC, and five-year IRR with deterministic decimal arithmetic.
- Reruns only the MOIC and IRR tests affected by Exit EBITDA.
- Reuses the unaffected customer-concentration test and exposes compiler metadata proving it.
- Marks the two dependent memo assertions stale.
- Blocks all derived values when metric definitions are not comparable.
- Lets a human Keep Previous, Investigate, or Accept Evidence.
- Converts accepted evidence into draft memo revisions while keeping the deal on HOLD.
- Produces a visibly demo-local, unsigned, non-persistent Resolution Receipt.

## How it was built

- Next.js 16, React 19, TypeScript, and hand-built responsive CSS.
- Zod contracts for trusted fixtures and model output.
- decimal.js at precision 28 with half-up display rounding.
- Pure deterministic compiler and explicit dependency selection.
- OpenAI Responses API structured output for one ambiguous-language fixture only.
- Upstash sliding-window rate-limit boundary for an optional live endpoint.
- Vitest for formulas, domains, semantic policy, state transitions, and API boundaries.
- Playwright for the full Accept/HOLD/Receipt/Reset flow and semantic-block flow.
- Vercel production deployment in public-safe recorded-eval mode.

## Codex usage

Codex was used as an engineering agent across contract design, implementation, test generation, browser QA, build repair, documentation, public deployment, and evidence auditing. The strongest example is not code volume: browser testing caught a real React effect race that aborted its own semantic request. [`CODEX.md`](./CODEX.md) maps tasks to files, commands, outcomes, corrections, and commit hashes.

Do not submit until the Codex `/feedback` session ID is added to `CODEX.md` and the Devpost form.

## Challenges

1. Drawing a credible boundary between AI understanding and financial judgment. Numeric outputs and hurdle results were kept entirely deterministic.
2. Making “only affected tests rerun” observable. The compiler returns evaluated, reused, and blocked test IDs rather than relying on UI color.
3. Avoiding demo theater. Recorded model output is labeled `NOT LIVE`; the receipt is labeled local and unsigned; unvalidated impact remains unvalidated.
4. Turning a technical graph into a coherent product. The final interaction ends with HOLD, memo drafts, and a Resolution Receipt rather than a dead-end visualization.

## What is novel

The novelty is not document search, memo generation, model lineage, or assumption tracking independently. RedFlame combines:

```text
candidate evidence
→ semantic comparability
→ calculation dependency propagation
→ executable investment hurdles
→ stale memo assertions
→ human evidence resolution
```

The README includes a source-backed adjacent-product matrix and avoids claiming that undocumented capabilities do not exist.

## Potential impact

For an investment professional, the value is a reviewable answer to “what must change if this fact is accepted?” The current demo proves the mechanism on a controlled Deal Pack. It does not prove demand, support arbitrary Excel models, or establish measured ROI. Those are next-stage validation and engineering questions.

## What is next

- Validate the workflow with investment professionals.
- Replace controlled fixtures with a normalized ingestion and financial ontology layer.
- Add signed, server-persisted evidence-resolution history.
- Expose the deterministic compiler as an MCP service that WeKnora or another agent host can call.
- Extend the dependency graph to leverage, covenants, sensitivities, and full cash-flow IRR.

## Judging evidence

### Technological Implementation

- 17 deterministic/API contract tests.
- 2 product-level Playwright paths passing locally and against production.
- Fresh Vercel dependency install and production build succeeded.
- Fixed-schema, allowlisted, rate-limited, fail-closed model boundary.
- Traceable Codex build record and real bug correction.

### Design

- One coherent review surface rather than a dashboard or chat wrapper.
- Explicit loading, blocked, unavailable, accepted, kept, investigated, and reset states.
- Complete Accept → HOLD → Receipt → Revised Memo → Reset loop.
- Keyboard focus styles, disabled-action explanations, and narrow-screen stacking.

### Potential Impact

- Specific user and moment: PE Associate, drafted IC memo, revised seller model.
- Exact problem shown: old return tests and memo assertions no longer match accepted evidence.
- Claim remains an unvalidated hypothesis until user evidence exists.

### Quality of the Idea

- Decision CI is demonstrated as a new control loop, not asserted as a slogan.
- Main fixture proves value propagation.
- Counter-fixture proves semantic blocking.
- Unaffected test proves dependency selection.
- HOLD receipt proves evidence acceptance is not investment approval.

## Final submission blockers

- [ ] Run `pnpm run eval:live` with authorized GPT-5.6 access and commit the timestamped artifact, or keep the recorded mode and accurately describe it.
- [ ] Add Codex `/feedback` session ID.
- [x] Generate and verify the local narrated demo: `artifacts/redflame-demo.mp4` · 149.1 seconds · 1440×900 · H.264/AAC.
- [ ] Review the generated MP4, or record a human-voice take using [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).
- [ ] Upload the selected video publicly and add its URL to README and Devpost.
- [x] Confirm GitHub Actions is green: [run 29513856511](https://github.com/NeoCh3n/PE-WeKnora/actions/runs/29513856511).
- [ ] Optionally add permitted user evidence; otherwise keep the unvalidated wording.
