"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, ExternalLink, Loader2 } from "lucide-react";

export const TERMS_VERSION = "2026-10-11-ar-beta";
export const PRIVACY_VERSION = "2026-10-12-v5";

type Props = {
  client: SupabaseClient;
  userId: string;
  onReady: () => void;
  onSignOut: () => void;
};

export function UnifiedLegalGate({ client, userId, onReady, onSignOut }: Props) {
  const readyCallback = useRef(onReady);
  useEffect(() => { readyCallback.current = onReady; }, [onReady]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adult, setAdult] = useState(false);
  const [ar, setAr] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    void (async () => {
      // getUser is server verified; client-side session metadata is not authorization.
      const { data: verified, error: userError } = await client.auth.getUser();
      if (userError || verified.user?.id !== userId) {
        throw new Error("La sesión cambió. Volvé a ingresar.");
      }
      const { data, error: readError } = await client
        .from("global_stock_legal_acceptances")
        .select("id,adult_18_attested,operates_in_ar_attested")
        .eq("user_id", userId)
        .eq("terms_version", TERMS_VERSION)
        .eq("privacy_version", PRIVACY_VERSION)
        .maybeSingle();
      if (readError) throw readError;
      if (mounted && data?.id && data.adult_18_attested === true &&
          data.operates_in_ar_attested === true) {
        readyCallback.current();
      }
    })().catch(reason => {
      if (mounted) setError(reason instanceof Error ? reason.message : "No pudimos verificar tu cuenta.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [client, userId, attempt]);

  async function confirm() {
    if (!adult || !ar || !accepted || loading || saving) return;
    setSaving(true);
    setError("");
    try {
      const { data, error: userError } = await client.auth.getUser();
      if (userError || data.user?.id !== userId) throw new Error("La sesión cambió. Volvé a ingresar.");
      const { error: saveError } = await client.from("global_stock_legal_acceptances").upsert({
        user_id: userId, terms_version: TERMS_VERSION, privacy_version: PRIVACY_VERSION,
        adult_18_attested: true, operates_in_ar_attested: true
      }, { onConflict: "user_id,terms_version,privacy_version", ignoreDuplicates: true });
      if (saveError) throw saveError;
      readyCallback.current();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se guardó la aceptación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#09090b] px-4 py-12 text-white">
      <div className="w-full max-w-xl space-y-5 rounded-[28px] border border-white/10 bg-[#151518] p-6 shadow-[0_28px_90px_rgba(0,0,0,.25)] sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#990012]"><ShieldCheck size={24}/></div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#f46776]">Global Stock · Argentina</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Tus datos, tus decisiones.</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">Antes de continuar revisá los documentos vigentes de la beta gratuita. Esta confirmación se guarda para tu cuenta tanto en el celular como en la PC.</p>
        </div>
        <nav className="grid gap-2 text-sm">
          {[
            ["/legal/terms","Términos de uso"],
            ["/legal/privacy","Política de privacidad"],
            ["/legal/cookies","Cookies y almacenamiento"],
            ["/legal/security","Seguridad"]
          ].map(([href,label]) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer"
               className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.025] px-4 font-medium hover:bg-white/[.07]">
              {label}<ExternalLink size={16} aria-hidden="true" />
            </a>
          ))}
        </nav>
        {loading ? <div role="status" className="flex items-center gap-3 text-sm text-white/70"><Loader2 className="animate-spin" size={18}/>Comprobando tu consentimiento…</div> : (
          <>
            <div className="space-y-4 text-sm leading-6 text-white/75">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#a40018]" />
                <span>Declaro que tengo <strong className="text-white">18 años o más</strong> y capacidad legal para administrar un negocio.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={ar} onChange={e => setAr(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#a40018]" />
                <span>Mi negocio <strong className="text-white">opera en Argentina</strong>. Comprendo que esta beta no está dirigida a otros países.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#a40018]" />
                <span>Leí y acepto los términos y la política de privacidad de Global Stock.</span>
              </label>
            </div>
            {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
            <button type="button" disabled={saving || !adult || !ar || !accepted} onClick={() => void confirm()}
              className="min-h-12 w-full rounded-xl bg-[#a30013] px-5 text-sm font-semibold text-white disabled:opacity-45">
              {saving ? "Guardando…" : "Aceptar y continuar"}
            </button>
          </>
        )}
        {error && <button type="button" className="text-sm text-red-300 underline" onClick={() => setAttempt(v => v + 1)}>Volver a comprobar</button>}
        <p className="text-xs leading-5 text-white/45">Esta declaración no verifica documentalmente la edad. No está permitido utilizar cuentas de adultos para dar acceso a menores.</p>
        <button type="button" className="text-sm text-white/55 underline" onClick={onSignOut}>Cerrar sesión</button>
      </div>
    </main>
  );
}
