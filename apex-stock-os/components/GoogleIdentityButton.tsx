"use client";

import { useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { LanguageCode } from "./GlobalPreferences";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentityApi = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    nonce?: string;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type: "standard";
      theme: "outline" | "filled_black";
      size: "large";
      text: "continue_with";
      shape: "rectangular";
      logo_alignment: "left";
      width: number;
    }
  ) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdentityApi;
      };
    };
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity requires a browser."));
  }

  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
    const src = "https://accounts.google.com/gsi/client";
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="' + src + '"]'
    );

    const complete = () => {
      if (window.google?.accounts?.id) resolve();
      else reject(new Error("Google Identity did not initialize."));
    };

    if (existing) {
      existing.addEventListener("load", complete, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Identity failed to load.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", complete, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Google Identity failed to load.")),
      { once: true }
    );
    document.head.appendChild(script);
  }).catch((error) => {
    googleIdentityScriptPromise = null;
    throw error;
  });

  return googleIdentityScriptPromise;
}

async function createGoogleNonce() {
  const values = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...values));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(nonce)
  );
  const hashedNonce = Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

  return { nonce, hashedNonce };
}

type GoogleIdentityButtonProps = {
  dark: boolean;
  label: string;
  language: LanguageCode;
  currency: string;
  onAuthenticated: () => void;
  onError: () => void;
};

export function GoogleIdentityButton({
  dark,
  label,
  language,
  currency,
  onAuthenticated,
  onError
}: GoogleIdentityButtonProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef({
    language,
    currency,
    onAuthenticated,
    onError
  });
  const [pending, setPending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    latestRef.current = { language, currency, onAuthenticated, onError };
  }, [language, currency, onAuthenticated, onError]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !clientId) return;

    let cancelled = false;

    const setup = async () => {
      await loadGoogleIdentityScript();
      if (cancelled || !window.google?.accounts?.id) return;

      const { nonce, hashedNonce } = await createGoogleNonce();
      if (cancelled) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        callback: async (response) => {
          if (!response.credential) {
            latestRef.current.onError();
            return;
          }

          setPending(true);

          try {
            const supabase = getSupabaseBrowserClient();
            if (!supabase) throw new Error("Supabase is not configured.");

            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce
            });

            if (error) throw error;

            if (data.user?.id) {
              const metadata = data.user.user_metadata ?? {};
              const fullName =
                typeof metadata.full_name === "string"
                  ? metadata.full_name
                  : typeof metadata.name === "string"
                    ? metadata.name
                    : null;

              const { error: profileError } = await supabase
                .from("global_stock_profiles")
                .upsert(
                  {
                    user_id: data.user.id,
                    full_name: fullName,
                    default_currency: latestRef.current.currency,
                    language: latestRef.current.language
                  },
                  { onConflict: "user_id", ignoreDuplicates: true }
                );

              if (profileError) throw profileError;
            }

            latestRef.current.onAuthenticated();
          } catch {
            latestRef.current.onError();
          } finally {
            setPending(false);
          }
        }
      });

      const width = Math.max(
        240,
        Math.min(400, Math.floor(host.getBoundingClientRect().width || 400))
      );

      host.replaceChildren();
      window.google.accounts.id.renderButton(host, {
        type: "standard",
        theme: dark ? "filled_black" : "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width
      });
    };

    void setup().catch(() => {
      if (!cancelled) setUnavailable(true);
    });

    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }, [clientId, dark]);

  if (!clientId || unavailable) {
    return (
      <button
        type="button"
        onClick={onError}
        className={
          "w-full rounded-2xl border px-5 py-3 text-[13px] font-semibold transition active:scale-[.99] " +
          (dark
            ? "border-white/12 bg-white/[0.06] text-white hover:bg-white/[0.11]"
            : "border-black/10 bg-[#F5F5F7] text-[#111114] hover:bg-[#ECECEF]")
        }
      >
        {label}
      </button>
    );
  }

  return (
    <div
      className={
        "relative min-h-[44px] w-full overflow-hidden rounded-2xl transition " +
        (pending ? "pointer-events-none opacity-60" : "")
      }
      aria-busy={pending}
    >
      <div ref={hostRef} className="min-h-[44px] w-full" />
    </div>
  );
}
