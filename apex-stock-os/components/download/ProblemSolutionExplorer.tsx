"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { PAIN_SOLUTIONS } from "./content";

export function ProblemSolutionExplorer() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const current = PAIN_SOLUTIONS[selectedIdx] ?? PAIN_SOLUTIONS[0];

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    setSelectedIdx((idx + delta + PAIN_SOLUTIONS.length) % PAIN_SOLUTIONS.length);
  }

  return (
    <div className="dl-ps-compact">
      <div className="dl-ps-pills" role="tablist" aria-label="Problemas frecuentes de un comercio">
        {PAIN_SOLUTIONS.map((item, idx) => {
          const active = idx === selectedIdx;
          return (
            <button
              key={item.id}
              id={`ps-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`ps-panel-${item.id}`}
              tabIndex={active ? 0 : -1}
              className={`dl-ps-pill-tab ${active ? "is-active" : ""}`}
              onClick={() => setSelectedIdx(idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
            >
              <span className="dl-ps-pill-num" aria-hidden="true">
                {idx + 1}
              </span>
              <span>{item.shortTab}</span>
            </button>
          );
        })}
      </div>

      <div
        id={`ps-panel-${current.id}`}
        className="dl-ps-split"
        role="tabpanel"
        aria-labelledby={`ps-tab-${current.id}`}
      >
        <article className="dl-ps-box is-problem">
          <span className="dl-ps-box-tag">
            <AlertCircle size={15} aria-hidden="true" /> Problema habitual
          </span>
          <h3>{current.problemTitle}</h3>
          <p>{current.problemDetail}</p>
        </article>

        <article className="dl-ps-box is-solution">
          <span className="dl-ps-box-tag">
            <CheckCircle2 size={15} aria-hidden="true" /> Cómo lo resolvés con Global Stock
          </span>
          <h3>{current.solutionTitle}</h3>
          <p>{current.solutionDetail}</p>

          <div className="dl-ps-mini-metrics">
            {current.highlights.map((h) => (
              <div key={h.label} className="dl-ps-mini-row">
                <span>{h.label}</span>
                <strong className={h.tone === "ok" ? "is-ok" : "is-alert"}>{h.value}</strong>
              </div>
            ))}
          </div>

          <div className="dl-ps-box-foot">
            <Link href="/" className="dl-btn-primary">
              Probarlo gratis
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}