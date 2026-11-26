"use client";

import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { WORKSPACE_ACCENTS, type WorkspaceAccent } from "@/lib/workspace-accent";

const SIMPLE_MODE_KEY = "global-stock-simple-mode-v1";

export function SimpleModeSettingsCard({ accent = "red" }: { accent?: WorkspaceAccent }) {
  const accentColors = WORKSPACE_ACCENTS[accent];
  const [simpleMode, setSimpleMode] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIMPLE_MODE_KEY) === "true";
      setSimpleMode(saved);
      if (saved) document.documentElement.dataset.simpleMode = "true";
    } catch {}
  }, []);

  function handleToggle(next: boolean) {
    setSimpleMode(next);
    if (next) {
      document.documentElement.dataset.simpleMode = "true";
    } else {
      delete document.documentElement.dataset.simpleMode;
    }
    try {
      window.localStorage.setItem(SIMPLE_MODE_KEY, String(next));
    } catch {}
  }

  return (
    <div className="rounded-[24px] border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white"
            style={{ backgroundColor: accentColors.main }}
          >
            <Eye size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[var(--apex-text)]">
              Modo fácil (lectura ampliada)
            </h3>
            <p className="mt-0.5 text-xs text-[var(--apex-muted)]">
              Agranda la tipografía general y oculta atajos técnicos para una operación más cómoda y clara.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={simpleMode}
          onClick={() => handleToggle(!simpleMode)}
          className="min-h-10 rounded-full px-4 text-xs font-bold transition"
          style={
            simpleMode
              ? { backgroundColor: accentColors.main, color: "#ffffff" }
              : {
                  border: "1px solid var(--apex-border)",
                  backgroundColor: "var(--apex-bg)",
                  color: "var(--apex-text)"
                }
          }
        >
          {simpleMode ? "Activado" : "Activar modo fácil"}
        </button>
      </div>
    </div>
  );
}
