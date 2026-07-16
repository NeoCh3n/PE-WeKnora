"use client";

import { useEffect, useMemo, useState } from "react";
import { approvedSnapshot, candidateSnapshot, memoParagraphs } from "@/fixtures/deals";
import latestEval from "@/evals/live/latest.json";
import { compileSnapshot, formatMoney, formatMoic, formatPercent } from "@/lib/compiler";
import { initialReviewState, transitionReview } from "@/lib/review-state";
import type { ReviewState, TestOutcome } from "@/lib/types";

const STORAGE_KEY = "redflame-review-v1";

type EvidenceView = "value" | "ambiguous";
type ModelState =
  | { status: "idle" | "pending" }
  | { status: "live" | "recorded"; explanation: string; timestamp: string; reasonCode: string; modelName?: string; verified?: boolean; provider?: string; evidenceId?: string; fixtureHash?: string }
  | { status: "unavailable"; explanation: string };

const verifiedRecordedEval = latestEval as {
  mode?: string;
  timestamp?: string;
  model?: string;
  provider?: string;
  responseId?: string;
  codexSessionId?: string;
  fixtureHash?: string;
  result?: { explanation?: string; reason_code?: string; definition_changed?: boolean; confidence?: number };
};
const hasVerifiedRecordedEval = verifiedRecordedEval.mode === "live_eval"
  && verifiedRecordedEval.result?.definition_changed === true
  && typeof verifiedRecordedEval.result.explanation === "string"
  && typeof verifiedRecordedEval.result.reason_code === "string"
  && typeof verifiedRecordedEval.timestamp === "string"
  && typeof verifiedRecordedEval.model === "string";
const recordedEval = hasVerifiedRecordedEval ? {
  explanation: verifiedRecordedEval.result!.explanation!,
  timestamp: verifiedRecordedEval.timestamp!,
  reasonCode: verifiedRecordedEval.result!.reason_code!,
  modelName: verifiedRecordedEval.model!,
  provider: verifiedRecordedEval.provider,
  evidenceId: verifiedRecordedEval.codexSessionId || verifiedRecordedEval.responseId,
  fixtureHash: verifiedRecordedEval.fixtureHash,
  verified: true,
} : {
  explanation: "The source notes treat transformation adjustments differently, so the EBITDA definitions are not directly comparable.",
  timestamp: "EXAMPLE ONLY",
  reasonCode: "adjustment_treatment_changed",
  verified: false,
};

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "danger" | "success" | "warning" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function TestRow({ test }: { test: TestOutcome }) {
  return (
    <div className="test-row" data-testid={`test-${test.id}`}>
      <div>
        <strong>{test.name}</strong>
        <span className="test-meta">Threshold v{test.thresholdVersion} · {test.execution.toUpperCase()}</span>
      </div>
      <div className="test-badges">
        {test.execution === "reused" && <Badge tone="neutral">UNAFFECTED</Badge>}
        <Badge tone={test.result === "pass" ? "success" : test.result === "fail" ? "danger" : "warning"}>
          {test.result.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
}

function Step({ label, approved, candidate, kind = "derived", danger = false }: { label: string; approved: string; candidate: string; kind?: "input" | "derived" | "tested"; danger?: boolean }) {
  return (
    <div className={`chain-step ${danger ? "chain-danger" : ""}`}>
      <div className="chain-copy">
        <span>{label}</span>
        <small>{kind === "tested" ? "DERIVED · TESTED" : kind.toUpperCase()}</small>
      </div>
      <div className="chain-values">
        <span>{approved}</span><b aria-hidden="true">→</b><strong>{candidate}</strong>
      </div>
    </div>
  );
}

export function DecisionReview() {
  const [view, setView] = useState<EvidenceView>("value");
  const [review, setReview] = useState<ReviewState>(initialReviewState);
  const [hydrated, setHydrated] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [model, setModel] = useState<ModelState>({ status: "idle" });

  const approved = useMemo(() => compileSnapshot(approvedSnapshot), []);
  const candidate = useMemo(() => compileSnapshot(candidateSnapshot), []);
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setReview(JSON.parse(saved) as ReviewState); } catch { window.localStorage.removeItem(STORAGE_KEY); }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(review));
  }, [review, hydrated]);

  useEffect(() => {
    if (view !== "ambiguous") return;
    const controller = new AbortController();
    setModel({ status: "pending" });
    fetch("/api/semantic", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fixtureId: "candidate-ambiguous-definition" }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (response.ok && body.mode === "live") {
          setModel({
            status: "live",
            explanation: body.result.explanation,
            timestamp: body.timestamp,
            reasonCode: body.result.reason_code,
            modelName: typeof body.model === "string" ? body.model : "OPENAI MODEL",
            provider: typeof body.provider === "string" ? body.provider : "openai_responses_api",
            evidenceId: typeof body.responseId === "string" ? body.responseId : undefined,
          });
          return;
        }
        setModel({ status: "recorded", ...recordedEval });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setModel({ status: "unavailable", explanation: "Semantic classification is unavailable. Route this evidence to investigation." });
      });
    return () => controller.abort();
  }, [view]);

  useEffect(() => {
    if (!memoOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMemoOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [memoOpen]);

  function acceptEvidence() {
    setReview((current) => transitionReview(current, {
      type: "accept",
      now: new Date().toISOString(),
      receiptId: `RES-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    }));
  }

  function resetDemo() {
    window.localStorage.removeItem(STORAGE_KEY);
    setReview(initialReviewState);
    setView("value");
    setModel({ status: "idle" });
    setMemoOpen(false);
    requestAnimationFrame(() => document.querySelector<HTMLElement>("#candidate-evidence")?.focus());
  }

  const accepted = review.evidence === "accepted";
  const keptPrevious = review.evidence === "kept_previous";
  const blocked = view === "ambiguous";

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="RedFlame home">
          <span className="brand-mark">R</span>
          <span>RedFlame<small>DECISION CI</small></span>
        </a>
        <div className="deal-identity">
          <span>PROJECT APEX</span>
          <strong>Approved Decision v3 <i>→</i> Candidate Evidence v4</strong>
        </div>
        <Badge tone={accepted ? "warning" : keptPrevious ? "success" : "danger"}>
          {accepted ? "HOLD" : keptPrevious ? "APPROVED V3 RETAINED" : "REVIEW REQUIRED"}
        </Badge>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">EVIDENCE PULL REQUEST · PR-004</p>
          <h1>A changed fact should not leave an old decision behind.</h1>
          <p className="hero-copy">Review the evidence, compile its financial consequences, and see exactly which investment assertions no longer hold.</p>
        </div>
        <div className="summary-strip" aria-label="Decision summary">
          <div><strong>2</strong><span>FAILED TESTS</span></div>
          <div><strong>1</strong><span>PASSED · UNAFFECTED</span></div>
          <div className="summary-secondary"><strong>{keptPrevious ? "0" : "2"}</strong><span>STALE PARAGRAPHS</span></div>
          <div className="summary-secondary"><strong>1</strong><span>IMPACT PATH</span></div>
        </div>
      </section>

      <nav className="evidence-tabs" aria-label="Evidence scenarios">
        <button className={view === "value" ? "active" : ""} onClick={() => setView("value")}>Comparable value change</button>
        <button className={view === "ambiguous" ? "active" : ""} onClick={() => setView("ambiguous")}>Ambiguous definition</button>
      </nav>

      <div className="review-grid">
        <div className="review-column">
          <section className="panel evidence-panel" aria-labelledby="candidate-evidence">
            <div className="panel-heading">
              <div><p className="eyebrow">01 · CANDIDATE EVIDENCE</p><h2 id="candidate-evidence" tabIndex={-1}>FY2030 Exit EBITDA</h2></div>
              <Badge tone={blocked ? "warning" : "danger"}>{blocked ? "SEMANTIC REVIEW" : "VALUE CHANGE"}</Badge>
            </div>
            {view === "value" ? (
              <>
                <div className="metric-diff">
                  <div><span>APPROVED V3</span><strong>$24.0m</strong></div>
                  <div className="diff-arrow">→</div>
                  <div><span>CANDIDATE V4</span><strong>$20.0m</strong></div>
                  <div className="delta">−16.7%</div>
                </div>
                <div className="definition-check">
                  <Badge tone="success">DEFINITION UNCHANGED</Badge>
                  <span>Same period · same USD millions unit · same Adjusted basis</span>
                </div>
                <p className="source-line">Source · Management Model v4 · Cell F42 <b>↗</b></p>
              </>
            ) : (
              <div className="semantic-card" data-testid="semantic-card">
                <div className="semantic-notes">
                  <div><span>APPROVED NOTE</span><p>“EBITDA before one-time transformation costs.”</p></div>
                  <div><span>CANDIDATE NOTE</span><p>“EBITDA including normalized transformation adjustments.”</p></div>
                </div>
                {model.status === "pending" && <div className="model-state model-pending"><span className="spinner" /> CLASSIFYING AMBIGUOUS DEFINITION</div>}
                {(model.status === "live" || model.status === "recorded") && (
                  <div className="model-result">
                    <Badge tone="warning">{model.status === "live" ? `LIVE ${model.modelName}` : model.verified ? `RECORDED ${model.modelName} EVAL · VERIFIED ARTIFACT` : "RECORDED EVAL FIXTURE · NOT LIVE"}</Badge>
                    <strong>DEFINITION CHANGED · COMPARISON BLOCKED</strong>
                    <p>{model.explanation}</p>
                    <small>{model.reasonCode} · {model.timestamp}</small>
                    {model.evidenceId && <small>EVIDENCE · {model.provider || "model"} · {model.evidenceId}</small>}
                    {model.fixtureHash && <small>FIXTURE SHA-256 · {model.fixtureHash.slice(0, 16)}…</small>}
                  </div>
                )}
                {model.status === "unavailable" && <div className="model-result"><Badge tone="warning">GPT UNAVAILABLE · INVESTIGATE</Badge><p>{model.explanation}</p></div>}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading"><div><p className="eyebrow">02 · EXECUTABLE POLICY</p><h2>Decision Tests</h2></div><span className="compile-label">DETERMINISTIC</span></div>
            {blocked ? (
              <div className="blocked-tests" data-testid="blocked-tests"><strong>RETURN TESTS BLOCKED</strong><p>Derived values are hidden until the EBITDA definition is resolved. No numeric judgment was sent to the model.</p></div>
            ) : (
              <div className="test-list">
                <TestRow test={candidate.tests.base_case_moic_hurdle} />
                <TestRow test={candidate.tests.base_case_irr_hurdle} />
                <TestRow test={candidate.tests.top_customer_concentration} />
              </div>
            )}
          </section>

          <section className="panel memo-panel">
            <div className="panel-heading"><div><p className="eyebrow">04 · AFFECTED WORK PRODUCT</p><h2>IC Memo Assertions</h2></div><Badge tone={accepted ? "warning" : keptPrevious ? "success" : "danger"}>{accepted ? "2 DRAFT" : keptPrevious ? "CURRENT" : "2 STALE"}</Badge></div>
            {memoParagraphs.map((paragraph) => (
              <div className="memo-row" key={paragraph.id}>
                <span>{paragraph.id.toUpperCase()}</span>
                <div><strong>{paragraph.title}</strong><p>{accepted ? paragraph.draft : paragraph.approved}</p></div>
                <Badge tone={accepted ? "warning" : keptPrevious ? "success" : "danger"}>{accepted ? "DRAFT REVISION" : keptPrevious ? "CURRENT" : "STALE"}</Badge>
              </div>
            ))}
          </section>
        </div>

        <div className="review-column">
          <section className="panel blast-panel">
            <div className="panel-heading"><div><p className="eyebrow">03 · DECISION BLAST RADIUS</p><h2>{blocked ? "Comparison blocked" : "One fact, one traceable path"}</h2></div><span className="path-count">1 PATH</span></div>
            {blocked ? (
              <div className="blocked-chain">
                <Badge tone="warning">DEFINITION CHANGED</Badge><h3>Direct comparison is unsafe.</h3><p>Exit EV, equity value, MOIC, and IRR remain hidden. Resolve the evidence definition before recompiling.</p>
              </div>
            ) : (
              <div className="chain">
                <Step label="FY2030 Exit EBITDA" approved="$24.00m" candidate="$20.00m" kind="input" danger />
                <Step label="Exit Enterprise Value" approved={formatMoney(approved.derived.exit_ev)} candidate={formatMoney(candidate.derived.exit_ev)} />
                <Step label="Exit Equity Value" approved={formatMoney(approved.derived.exit_equity)} candidate={formatMoney(candidate.derived.exit_equity)} />
                <Step label="Base-case MOIC" approved={formatMoic(approved.derived.base_case_moic)} candidate={formatMoic(candidate.derived.base_case_moic)} kind="tested" danger />
                <Step label="5-year IRR" approved={formatPercent(approved.derived.base_case_irr)} candidate={formatPercent(candidate.derived.base_case_irr)} kind="tested" danger />
              </div>
            )}
            <div className="locked-inputs"><span>LOCKED INPUTS</span><p>8.0x exit multiple · $12m exit net debt · $60m entry equity · 5-year hold</p></div>
          </section>

          <section className="panel principle-panel">
            <p className="eyebrow">WHY THIS IS DIFFERENT</p>
            <h2>Document AI updates words. RedFlame invalidates decisions.</h2>
            <div className="comparison-mini">
              <div><span>DOCUMENT WORKFLOW</span><p>Detect update → regenerate memo</p></div>
              <div><span>REDFLAME</span><p>Evidence → calculations → tests → assertions → human resolution</p></div>
            </div>
            <p className="comparison-note">A source-backed adjacent-product capability matrix is included in the repository.</p>
          </section>
        </div>
      </div>

      {accepted && (
        <section className="receipt" data-testid="resolution-receipt" aria-live="polite">
          <div className="receipt-icon">✓</div>
          <div className="receipt-main">
            <p className="eyebrow">DEMO-LOCAL RESOLUTION RECEIPT · EVIDENCE ACCEPTED</p>
            <h2>The fact changed. The investment decision did not pass.</h2>
            <div className="receipt-facts">
              <span><b>HOLD</b> decision status</span><span><b>2</b> tests remain failed</span><span><b>2</b> draft revisions</span><span><b>v1</b> thresholds unchanged</span>
            </div>
            <p className="receipt-meta">{review.receiptId} · recorded client timestamp {review.recordedAt}</p>
            <p className="receipt-disclaimer">Not signed · not server-persisted · demo evidence only</p>
          </div>
          <div className="receipt-actions"><button className="button-secondary" onClick={() => setMemoOpen(true)}>View revised memo</button><button className="button-ghost" onClick={resetDemo}>Reset demo</button></div>
        </section>
      )}

      {!accepted && review.evidence !== "pending" && (
        <section className="alternate-resolution" data-testid="alternate-resolution" aria-live="polite">
          <div>
            <p className="eyebrow">EVIDENCE RESOLUTION RECORDED LOCALLY</p>
            <h2>{review.evidence === "kept_previous" ? "Previous approved evidence retained." : "Evidence routed to investigation."}</h2>
            <p>{review.evidence === "kept_previous" ? "Candidate v4 did not enter the active assumptions. The prior decision remains unchanged with a review note." : "No evidence was merged and no decision test was changed. The deal remains REVIEW REQUIRED."}</p>
          </div>
          <button className="button-secondary" onClick={resetDemo}>Reset demo</button>
        </section>
      )}

      {review.evidence === "pending" && (
        <footer className="action-bar">
          <div><strong>{blocked ? "Definition review required" : "Evidence is comparable, but the revised case fails two hurdles."}</strong><span>{blocked ? "Accept is disabled until semantic ambiguity is resolved." : "Accepting evidence creates a memo draft and keeps the deal on HOLD."}</span></div>
          <div className="action-buttons">
            <button className="button-ghost" onClick={() => setReview((s) => transitionReview(s, { type: "keep_previous" }))}>Keep previous</button>
            <button className="button-secondary" onClick={() => setReview((s) => transitionReview(s, { type: "investigate" }))}>Investigate</button>
            <button className="button-primary" onClick={acceptEvidence} disabled={blocked} aria-describedby={blocked ? "accept-disabled-reason" : undefined}>Accept evidence</button>
          </div>
          {blocked && <span id="accept-disabled-reason" className="sr-only">Accept is disabled because the metric definitions are not comparable.</span>}
        </footer>
      )}

      {memoOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setMemoOpen(false)}>
          <section className="memo-modal" role="dialog" aria-modal="true" aria-labelledby="memo-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading"><div><p className="eyebrow">DRAFT REVISION · NOT APPROVED</p><h2 id="memo-title">Project Apex · IC Memo</h2></div><button aria-label="Close revised memo" onClick={() => setMemoOpen(false)}>×</button></div>
            {memoParagraphs.map((paragraph) => <article key={paragraph.id}><span>{paragraph.id.toUpperCase()} · {paragraph.title}</span><p>{paragraph.draft}</p></article>)}
            <div className="memo-warning"><strong>HUMAN REVIEW REQUIRED</strong><p>These paragraphs reflect accepted evidence. They do not approve the investment or change either return hurdle.</p></div>
          </section>
        </div>
      )}
    </main>
  );
}
