# RedFlame Demo Script · 148-second target

Rehearse the configured production mode exactly as shown. The current public deployment uses an **example fallback, not a live model result**. Do not say “live” unless the visible badge begins with `LIVE` after a successful request.

## 0–12s · Positioning

> Investment teams already have AI that summarizes documents and drafts memos. RedFlame is different. It is pull requests and CI tests for investment decisions.

Show the header: `Approved Decision v3 → Candidate Evidence v4`.

## 12–28s · Approved decision

> Project Apex previously cleared the fund's 2.50x MOIC and 20 percent IRR hurdles. Entry equity is a locked 60 million dollars, and the approved memo relies on those results.

Point to the locked inputs and approved side of the blast radius.

## 28–45s · Candidate evidence

> Management revised FY2030 Exit EBITDA from 24 million to 20 million. RedFlame confirms the period, unit, and Adjusted EBITDA basis are unchanged. This is a comparable value change.

Point to `VALUE CHANGE` and `DEFINITION UNCHANGED`.

## 45–78s · Deterministic blast radius

> Deterministic code recompiles only the affected path. At an 8 times exit multiple, enterprise value falls from 192 million to 160 million. After 12 million of exit net debt, equity value falls to 148 million. Against the locked 60 million entry equity, MOIC falls to 2.47 times and five-year IRR to 19.79 percent.

Point to both failed tests, then the green `UNAFFECTED` concentration test.

## 78–98s · Semantic boundary

Open `Ambiguous definition`.

> This alternative wording does not carry a structured accounting basis. The public demo shows a clearly labeled fallback fixture, not a live model result. In configured live mode, the model may classify the semantic definition, but it never calculates a number or changes a hurdle. RedFlame blocks comparison and disables Accept.

Return to `Comparable value change`.

## 98–118s · Human resolution

Click `Accept evidence`.

> Accepting a fact is not approving an investment. The evidence becomes active, but both return tests remain failed, the deal moves to HOLD, and the affected memo paragraphs become draft revisions requiring human review.

## 118–128s · Completed product loop

> The review ends with a receipt: thresholds unchanged, two failed tests, and two draft revisions. It is deliberately labeled demo-local, unsigned, and not server-persisted.

Click `View revised memo`, then close it.

## 128–138s · Novelty proof

> Adjacent tools document source grounding, model lineage, assumption tracking, and memo updates. RedFlame's narrow contribution is the complete evidence-to-decision control loop shown here: calculations, executable hurdles, stale assertions, and human resolution.

Point to `Why this is different`.

## 138–148s · Codex proof and close

> Codex helped build and verify each recorded layer, including catching a real asynchronous bug in browser testing. RedFlame makes sure an investment decision cannot quietly rely on stale evidence.

End on the HOLD receipt.

## Recording checklist

- Use a 1440×900 browser viewport at 100% zoom.
- Clear local storage and reload before recording.
- Confirm the semantic badge says `RECORDED EVAL FIXTURE · NOT LIVE` unless live infrastructure is actually enabled.
- Keep the cursor away from numbers while speaking.
- Record three full takes; accept only a take at or below 165 seconds.
- Verify the uploaded video is public and under three minutes.

## Automated fallback

On macOS, `pnpm run record:demo` reproduces the public product flow with synchronized system narration and writes `artifacts/redflame-demo.mp4`. The generated fallback is useful for timing and as a submission backup; review it before upload and prefer a clear human-voice take when time permits.
