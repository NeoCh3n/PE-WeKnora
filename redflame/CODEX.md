# Codex Build Record

This file is evidence of bounded engineering work, not a prompt dump. Every entry names the task, touched files, verification, and outcome. Commit hashes are added only after the corresponding files are committed. Session links are secondary evidence and are included only if judge-visible.

## Entry 1 · Freeze the financial contract

- Task: Turn the approved product premise into typed fixtures, a deterministic no-interim-cash-flow return bridge, versioned hurdle tests, and exact display rules.
- Files: `fixtures/deals.ts`, `lib/types.ts`, `lib/compiler.ts`, `tests/compiler.test.ts`.
- Verification: `vitest run`; approved and candidate golden values, invalid-domain behavior, unrounded threshold comparison, and unaffected-test reuse.
- Outcome: PASS. Candidate v4 produces $148m exit equity, 2.47x MOIC, and 19.79% IRR. Two return tests fail while customer concentration is reused and remains green.
- Commit: `474a94f8`.

## Entry 2 · Enforce the AI boundary

- Task: Keep numeric judgment outside the model; route only ambiguous source wording to a strict schema; fail closed when live infrastructure is absent.
- Files: `lib/semantic.ts`, `lib/semantic-model.ts`, `app/api/semantic/route.ts`, `tests/semantic.test.ts`, `tests/semantic-model.test.ts`, `tests/api-route.test.ts`.
- Verification: structured-diff table tests, schema rejection of numeric claims, unknown-fixture rejection, and disabled-endpoint response.
- Outcome: PASS. The public-safe default exposes no arbitrary prompt surface and returns `INVESTIGATE`/recorded mode when live prerequisites are absent.
- Commit: `474a94f8`.

## Entry 3 · Build a complete decision-review product

- Task: Implement the Decision PR, affected-only tests, blast radius, stale memo assertions, human resolution actions, demo-local receipt, revised memo, persistence, and reset.
- Files: `components/DecisionReview.tsx`, `app/globals.css`, `lib/review-state.ts`, `tests/review-state.test.ts`, `e2e/decision-flow.spec.ts`.
- Verification: production build plus Playwright at 1440×900.
- Outcome: PASS after one real correction described below.
- Commits: `daa1dcb2`, `45d736c3`.

### Real correction caught by browser testing

The first ambiguous-definition E2E test stayed forever in `CLASSIFYING`. The effect depended on `model.status`; setting the state to `pending` invoked its cleanup and aborted the fetch it had just started. The dependency was reduced to the evidence view, after which both browser paths passed. This is the kind of defect the product's own deterministic test philosophy is intended to catch.

## Entry 4 · Verify the runnable artifact

- Task: Separate deterministic unit tests from Playwright, pin a Next-compatible TypeScript version, and prove a clean production build.
- Files: `vitest.config.ts`, `playwright.config.ts`, `package.json`, `pnpm-lock.yaml`, `.github/workflows/redflame-ci.yml`.
- Verification: 17 deterministic tests, two browser paths, and `next build`.
- Outcome: PASS locally. Vercel installed from the lockfile and completed the production build. GitHub Actions run [`29515229913`](https://github.com/NeoCh3n/PE-WeKnora/actions/runs/29515229913) completed successfully for the auditable model-evidence build on the public branch.
- Commits: `474a94f8`, `daa1dcb2`, `27f89547`, `45d736c3`.

## Entry 5 · Audit judge-visible claims

- Task: Make judging evidence inspectable and downgrade every unsupported claim.
- Files: `README.md`, `CODEX.md`, `docs/decision-pr.png`, `docs/resolution-receipt.png`, `evals/live/`.
- Verification: source-backed capability links, explicit unvalidated-impact wording, explicit `NOT LIVE` recorded mode, and evidence-gate status table.
- Outcome: PASS for local evidence. Both screenshots exist and unsupported external claims are marked missing. Commit hashes remain to be finalized; deployment, live eval, `/feedback`, and video require external completion.
- Commits: evidence screenshots `daa1dcb2`; README, build record, and evidence gate `27f89547`.

## Entry 6 · Close final trust gaps

- Task: Audit the model boundary and judge-visible fallback language before freezing the submission candidate.
- Files: `app/api/semantic/route.ts`, `lib/semantic-model.ts`, `components/DecisionReview.tsx`, `tests/semantic-model.test.ts`, and submission documentation.
- Verification: model results that deny a definition change or fall below the confidence threshold are rejected; the public fallback is labeled as a fixture rather than implied model-run evidence; unit tests and production build pass.
- Outcome: PASS. The corrected build was deployed and both Playwright paths passed against the public URL.
- Commit: `5d5af2a4`.

## Entry 7 · Make the demo reproducible

- Task: Replace a fragile manual recording sequence with a repeatable public-app walkthrough and produce a local timing fallback.
- Files: `scripts/record-demo.ts`, `package.json`, `.gitignore`, `DEMO_SCRIPT.md`, and submission documentation.
- Verification: generated MP4 is 149.1 seconds, 1440×900, H.264 video plus AAC audio, and 5.3 MB; six-frame visual contact sheet confirms the main review and HOLD receipt states.
- Outcome: PASS for timing and product-flow evidence. The MP4 remains an ignored local artifact and must be regenerated after the real GPT-5.6 eval before public upload.
- Commit: `d6e41d6d`.

## Entry 8 · Make GPT-5.6 evidence auditable

- Task: Turn the competition's model requirement into an explicit eligibility gate rather than treating a configured code path as proof of use.
- Files: `scripts/eval-live.ts`, `evals/live/latest.json`, `components/DecisionReview.tsx`, `scripts/record-demo.ts`, and submission documentation.
- Verification: placeholder mode cannot display a verified model badge; a successful live eval writes model, timestamp, response ID, fixture hash, and structured result to both an immutable timestamped file and judge-visible `latest.json`; the recorder changes its narration only when that artifact is present.
- Outcome: PASS for implementation and public browser regression. Actual GPT-5.6 execution remains blocked on authorized API access and is clearly marked as the primary eligibility gate.
- Commit: `2b77ccfa`.

## Entry 9 · Add a credentialless Codex GPT-5.6 eval path

- Task: Let an authenticated Codex installation generate the same bounded GPT-5.6 evidence without requiring an API key, while guaranteeing that no repository content enters the eval prompt.
- Files: `scripts/eval-codex.ts`, `package.json`, `README.md`, `FINALIZE.md`, and `SUBMISSION.md`.
- Verification: the script creates an isolated temporary directory, allowlists only `gpt-5.6` and `gpt-5.6-sol`, requests strict structured output, validates it through the production Zod contract, requires the expected reason and confidence, captures the separate Codex session ID, and writes nothing on failure. Unit tests and the production TypeScript build pass.
- Service evidence: bounded attempts started sessions `019f6bc2-408c-7952-bbd6-40b43092be30`, `019f6bc9-0bcc-7933-a8ce-fcf1fac654f8`, `019f6bcc-343e-7880-acc1-b4683e54a6a1`, `019f6bcf-8424-7332-bcf1-bad4bf70437f`, Luna session `019f6bd5-948c-7531-991e-4bf872ed2db8`, and minimal-reasoning Luna session `019f6bdb-c0c8-7fb1-a49f-bcc2365befa6`. Every attempt disconnected at approximately the same stream duration before returning a result, across schema/no-schema and Sol/Luna variants. None is claimed as a successful GPT-5.6 eval and `latest.json` remains unchanged.
- Outcome: PASS for the fail-closed implementation; successful model evidence remains pending service availability or authorized API access.
- Commit: `6c81691b`.

## Entry 10 · Make model evidence judge-visible

- Task: Ensure a successful GPT-5.6 run can be verified from the product surface rather than only by inspecting a repository JSON file.
- Files: `components/DecisionReview.tsx`, `app/api/semantic/route.ts`, and `app/globals.css`.
- Verification: verified recorded artifacts expose provider, Codex session or OpenAI response ID, and a truncated fixture SHA-256; live runtime responses expose the OpenAI response ID; placeholders expose none of these identifiers. Unit tests and production build pass.
- Outcome: PASS for implementation; the fields remain hidden until a real successful eval exists.
- Commit: `1e39d4b5`.

## Verification log

```text
vitest: 17 tests passed
playwright: 2 paths passed
next build: PASS
```

## Required submission metadata

- Codex `/feedback` session ID: MISSING, submission blocker.
- Judge-visible Codex session links: not claimed.
- Public deployment: `https://redflame-plum.vercel.app` · Vercel deployment `dpl_2QUcQgLDxR7zHGwu58Mrh6Cg3785` · READY. Runtime application code is present in pushed commit `0cc37ae2`; both browser paths passed against this deployment, and the unconfigured semantic endpoint returned fail-closed `INVESTIGATE` state.
