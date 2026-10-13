"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Supabase owns the Apple authorization-code exchange. Never put Apple's
 * private key, Team ID credentials or client secret in the browser.
 */
export function AppleIdentityButton({
  dark,
  label,
  onError
}: {
  dark: boolean;
  label: string;
  onError: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function startAppleSignIn() {
    if (pending) return;
    setPending(true);
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Supabase no está configurado.");

      // The application already processes OAuth responses on its root using
      // detectSessionInUrl=true; no second login identity or client secret.
      const { data, error } = await client.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: window.location.origin + "/",
          skipBrowserRedirect: true
        }
      });
      if (error) throw error;
      if (!data.url) throw new Error("Apple no devolvió una dirección de autorización.");

      // Only redirect to the configured Supabase Auth endpoint, never to an
      // arbitrary value; the provider then redirects securely to Apple.
      const destination = new URL(data.url);
      const expectedOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
      if (destination.protocol !== "https:" ||
          destination.origin !== expectedOrigin ||
          !destination.pathname.endsWith("/auth/v1/authorize") ||
          destination.searchParams.get("provider") !== "apple") {
        throw new Error("El enlace seguro de Apple no pudo validarse.");
      }
      window.location.assign(destination.href);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      onError(
        /provider.*(not.enabled|disabled|not supported)|unsupported.provider/i.test(message)
          ? "El acceso con Apple todavía necesita habilitarse en Supabase y Apple Developer."
          : "No se pudo iniciar sesión con Apple. Verificá la configuración del proveedor e intentá nuevamente."
      );
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void startAppleSignIn()}
      disabled={pending}
      aria-busy={pending}
      aria-label={label}
      className={
        "group relative flex min-h-[46px] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border px-5 py-3 text-[13px] font-semibold transition duration-150 active:scale-[.99] disabled:cursor-wait disabled:opacity-55 " +
        (dark
          ? "border-white/12 bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.04)] hover:border-white/18 hover:bg-white/[0.10]"
          : "border-black/10 bg-white text-[#111114] shadow-[0_1px_0_rgba(0,0,0,.03)] hover:bg-[#F5F5F7]")
      }
    >
      <span
        aria-hidden="true"
        className={
          "grid h-7 w-7 shrink-0 place-items-center rounded-full transition-transform duration-150 group-hover:scale-[1.03] " +
          (dark ? "bg-white/[0.08]" : "bg-[#F5F5F7]")
        }
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
          <path d="M17.05 12.536c-.028-2.693 2.199-4.003 2.3-4.07-1.266-1.85-3.234-2.104-3.933-2.124-1.67-.174-3.286.994-4.134.994-.853 0-2.147-.97-3.544-.942-1.823.026-3.508 1.06-4.445 2.682-1.897 3.289-.49 8.13 1.364 10.8.91 1.311 1.997 2.786 3.414 2.734 1.362-.055 1.868-.884 3.508-.884 1.642 0 2.096.884 3.536.852 1.46-.024 2.381-1.316 3.286-2.63a11.8 11.8 0 0 0 1.506-3.084 4.69 4.69 0 0 1-2.858-4.328ZM14.33 4.69C15.087 3.772 15.6 2.498 15.458 1.23c-1.091.044-2.406.732-3.185 1.645-.703.804-1.323 2.098-1.157 3.341 1.214.094 2.455-.618 3.213-1.527Z"/>
        </svg>
      </span>
      <span>{pending ? "Conectando…" : label}</span>
      <span aria-hidden="true" className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[#8F0000]/45 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
