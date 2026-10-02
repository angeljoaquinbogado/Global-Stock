export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const PWA_INSTALL_AVAILABLE_EVENT =
  "global-stock-install-available";

declare global {
  interface Window {
    __globalStockInstallPrompt?: BeforeInstallPromptEvent;
  }
}

export function rememberInstallPrompt(
  prompt: BeforeInstallPromptEvent | null
) {
  if (typeof window === "undefined") return;

  if (prompt) {
    window.__globalStockInstallPrompt = prompt;
    window.dispatchEvent(new Event(PWA_INSTALL_AVAILABLE_EVENT));
    return;
  }

  delete window.__globalStockInstallPrompt;
}

export function getRememberedInstallPrompt() {
  if (typeof window === "undefined") return null;
  return window.__globalStockInstallPrompt ?? null;
}
