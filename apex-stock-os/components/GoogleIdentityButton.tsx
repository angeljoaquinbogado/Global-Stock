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
  prompt: () => void;
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

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      className="h-[18px] w-[18px] shrink-0"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.909c1.702-1.567 2.683-3.878 2.683-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.258c-.806.54-1.835.86-3.047.86-2.344 0-4.328-1.585-5.037-3.714H.957v2.332A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.963 10.708A5.42 5.42 0 0 1 3.682 9c0-.593.102-1.168.281-1.708V4.96H.957A9 9 0 0 0 0 9c0 1.45.347 2.824.957 4.04l3.006-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.322 0 2.508.454 3.442 1.345l2.582-2.582C13.463.89 11.427 0 9 0A9 9 0 0 0 .957 4.96l3.006 2.332C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
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
  const latestRef = useRef({
    language,
    currency,
    onAuthenticated,
    onError
  });
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    latestRef.current = { language, currency, onAuthenticated, onError };
  }, [language, currency, onAuthenticated, onError]);

  useEffect(() => {
    if (!clientId) return;

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

      setReady(true);
    };

    void setup().catch(() => {
      if (!cancelled) setUnavailable(true);
    });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const handleGoogleClick = () => {
    if (!ready || unavailable || !window.google?.accounts?.id) {
      onError();
      return;
    }

    window.google.accounts.id.prompt();
  };

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={pending || !ready || unavailable || !clientId}
      aria-busy={pending}
      className={
        "group relative flex min-h-[46px] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border px-5 py-3 text-[13px] font-semibold transition duration-150 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-55 " +
        (dark
          ? "border-white/12 bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.04)] hover:border-white/18 hover:bg-white/[0.10]"
          : "border-black/10 bg-white text-[#111114] shadow-[0_1px_0_rgba(0,0,0,.03)] hover:bg-[#F5F5F7]")
      }
    >
      <span
        aria-hidden="true"
        className={
          "grid h-7 w-7 place-items-center rounded-full transition-transform duration-150 group-hover:scale-[1.03] " +
          (dark ? "bg-white/[0.08]" : "bg-[#F5F5F7]")
        }
      >
        <GoogleMark />
      </span>

      <span>{pending ? "Conectando…" : label}</span>

      <span
        aria-hidden="true"
        className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[#8F0000]/45 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />
    </button>
  );
}
