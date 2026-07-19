# RedFlame Submission Finalization

Everything below requires the entrant's credentials or account action. Do not submit the current timing video: its narration accurately says that no live model result exists.

## 1. Generate the required GPT-5.6 evidence

Preferred path when the Codex CLI is authenticated:

```bash
pnpm run eval:codex
```

This runs only the fixed fixture from an isolated temporary directory and records its separate Codex eval session. If the Codex service is unavailable, use the API-key path below.

From `redflame/`, load an authorized API key without putting it in Git or shell history:

```bash
read -s "OPENAI_API_KEY?OpenAI API key: "
export OPENAI_API_KEY
echo
export OPENAI_MODEL=gpt-5.6-luna
pnpm run eval:live
```

Review `evals/live/latest.json`. It must say `mode: live_eval`, use an official GPT-5.6 family model, and include a real timestamp, provider request/session ID, fixture hash, and structured result. It must not contain a secret.

```bash
git add evals/live/latest.json
git commit -m "evidence(redflame): record GPT-5.6 semantic eval"
git push origin codex/redflame-decision-ci
```

Redeploy so the public UI displays `RECORDED GPT-5.6 EVAL · VERIFIED ARTIFACT`:

```bash
cd redflame
npx vercel --prod --yes
```

## 2. Regenerate and review the eligible video

```bash
pnpm run record:demo
open artifacts/redflame-demo.mp4
```

Confirm all of the following:

- Under three minutes.
- Product is visibly working.
- Audio explains how GPT-5.6 performs bounded semantic classification.
- Audio explains how Codex built and tested the project.
- Visible badge references the verified GPT-5.6 artifact, not the fallback fixture.
- No API key, private window, notification, or unrelated browser content appears.

Upload the selected MP4 as a **public YouTube video**, then add its URL to `README.md`, `SUBMISSION.md`, and the Devpost form.

## 3. Obtain the required Codex Session ID

Return to the primary Codex task where RedFlame was built and enter:

```text
/feedback
```

Copy the generated Session ID into `CODEX.md` and the Devpost form. Do not substitute the ambient Codex task UUID.

## 4. Final Devpost fields

- Project: RedFlame Decision CI
- Submitter type: Individual
- Country of residence: Hong Kong
- Track: Work & Productivity
- Public app: https://redflame-plum.vercel.app
- Source: https://github.com/NeoCh3n/PE-WeKnora/tree/codex/redflame-decision-ci/redflame
- Description: use `SUBMISSION.md`
- Video: public YouTube URL from step 2
- Codex Session ID: `/feedback` output from step 3

Keep the user-validation language honest unless real interviews occur. The workflow remains an explicitly unvalidated product hypothesis; this does not affect the demonstrated technical mechanism.
