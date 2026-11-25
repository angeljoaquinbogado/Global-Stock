"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { FAQ } from "./content";

export function FaqAccordionList() {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const allExpanded = openIndices.length === FAQ.length;

  function toggleItem(index: number) {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  function handleToggleAll() {
    if (allExpanded) {
      setOpenIndices([]);
    } else {
      setOpenIndices(FAQ.map((_, idx) => idx));
    }
  }

  return (
    <div>
      <div className="dl-faq-toolbar">
        <button
          type="button"
          className="dl-faq-toggle-all"
          onClick={handleToggleAll}
          aria-expanded={allExpanded}
        >
          {allExpanded ? (
            <>
              <ChevronsDownUp size={15} aria-hidden="true" />
              <span>Contraer todas</span>
            </>
          ) : (
            <>
              <ChevronsUpDown size={15} aria-hidden="true" />
              <span>Expandir todas</span>
            </>
          )}
        </button>
      </div>

      <div className="dl-faq-list">
        {FAQ.map((item, idx) => {
          const isOpen = openIndices.includes(idx);
          const panelId = `faq-answer-${idx}`;
          const btnId = `faq-question-${idx}`;
          return (
            <div key={item.q} className={`dl-faq-item ${isOpen ? "is-open" : ""}`}>
              <button
                id={btnId}
                type="button"
                className="dl-faq-q"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(idx)}
              >
                <span>{item.q}</span>
                <ChevronDown size={19} aria-hidden="true" className="dl-faq-chevron" />
              </button>

              {isOpen && (
                <div id={panelId} role="region" aria-labelledby={btnId} className="dl-faq-a">
                  <p>{item.a}</p>
                  {item.links && (
                    <div className="dl-faq-links">
                      {item.links.map((l) => (
                        <Link key={l.href} href={l.href}>
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}