import type { CSSProperties } from "react";

/** Presentation preference only; it never changes the meaning of error/success states. */
export type WorkspaceAccent = "red" | "emerald" | "blue";
export const WORKSPACE_ACCENT_KEY = "global-stock-workspace-accent-v1";

export const WORKSPACE_ACCENTS = {
  red: { main: "#8F0000", bright: "#CD2430", glow: "rgba(143,0,0,.22)", soft: "#F8EAEA" },
  emerald: { main: "#086846", bright: "#1CAD7C", glow: "rgba(8,104,70,.20)", soft: "#E5F4EC" },
  blue: { main: "#2459C6", bright: "#3C83EE", glow: "rgba(36,89,198,.22)", soft: "#E9EFFD" }
} as const;

export function isWorkspaceAccent(value: unknown): value is WorkspaceAccent {
  return value === "red" || value === "emerald" || value === "blue";
}

export function workspaceAccentVars(accent: WorkspaceAccent): CSSProperties {
  const colors = WORKSPACE_ACCENTS[accent];
  return {
    "--apex-accent": colors.main,
    "--apex-accent-bright": colors.bright,
    "--apex-accent-soft": colors.soft,
    "--apex-accent-glow": colors.glow
  } as CSSProperties;
}
