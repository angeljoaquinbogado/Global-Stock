"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: "dark" | "light";
      size: "compact";
      appearance: "interaction-only";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<void> | undefined;

function ensureTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[data-gs-turnstile="1"]');
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT;
      script.async = true;
      script.defer = true;
      script.dataset.gsTurnstile = "1";
      document.head.appendChild(script);
    }
    const scriptNode = script;
    let elapsed = 0;
    const waitForApi = () => {
      if (window.turnstile) return resolve();
      elapsed += 100;
      if (elapsed > 15000) return reject(new Error("Turnstile unavailable"));
      window.setTimeout(waitForApi, 100);
    };
    scriptNode.addEventListener("error", () => reject(new Error("Turnstile script blocked")), { once: true });
    waitForApi();
  }).catch(error => {
    loading = undefined;
    throw error;
  });
  return loading;
}

export function AuthTurnstile({
  siteKey,
  dark,
  onToken,
  onUnavailable,
  resetCounter = 0
}: {
  siteKey: string;
  dark: boolean;
  onToken: (token: string | null) => void;
  onUnavailable: () => void;
  resetCounter?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const callbacks = useRef({ onToken, onUnavailable });
  callbacks.current = { onToken, onUnavailable };

  useEffect(() => {
    let cancelled = false;
    const element = container.current;
    if (!element || !siteKey) return;
    callbacks.current.onToken(null);

    void ensureTurnstile().then(() => {
      if (cancelled || !window.turnstile || !element.isConnected) return;
      widgetId.current = window.turnstile.render(element, {
        sitekey: siteKey,
        theme: dark ? "dark" : "light",
        size: "compact",
        appearance: "interaction-only",
        callback: token => { if (!cancelled) callbacks.current.onToken(token); },
        "expired-callback": () => { if (!cancelled) callbacks.current.onToken(null); },
        "error-callback": () => {
          if (!cancelled) {
            callbacks.current.onToken(null);
            callbacks.current.onUnavailable();
          }
        }
      });
    }).catch(() => {
      if (!cancelled) callbacks.current.onUnavailable();
    });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch { /* widget may already have been removed */ }
      }
      widgetId.current = null;
    };
  }, [siteKey, dark]);

  useEffect(() => {
    if (resetCounter === 0) return;
    callbacks.current.onToken(null);
    if (widgetId.current && window.turnstile) {
      try { window.turnstile.reset(widgetId.current); }
      catch { callbacks.current.onUnavailable(); }
    }
  }, [resetCounter]);

  return (
    <div
      ref={container}
      data-testid="auth-turnstile"
      aria-label="Verificación de seguridad Cloudflare Turnstile"
      className="gs-auth-turnstile relative z-10 flex min-h-[4px] w-full items-center justify-center"
    />
  );
}
