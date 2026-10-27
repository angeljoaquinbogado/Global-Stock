"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, CircleAlert, Loader2, XCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { LanguageCode } from "./GlobalPreferences";

type Subscription = {
  user_id: string;
  plan_key: "free" | "starter" | "pro";
  status: "trialing" | "active" | "past_due" | "cancelled" | "expired";
  trial_started_at: string;
  trial_ends_at: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  provider: "paypal" | null;
  provider_subscription_id: string | null;
  price_ars: number;
  billing_currency: "ARS" | "USD";
};

const copy: Record<LanguageCode, Record<string, string>> = {
  es: { title: "Tu suscripción", loading: "Consultando el estado de tu plan…", free: "Gratis", starter: "Emprendedor", pro: "Profesional", trialing: "Prueba gratuita en curso", active: "Activa", past_due: "Pago pendiente", cancelled: "Cancelada", expired: "Prueba finalizada", trialUntil: "La prueba termina el", periodUntil: "Período vigente hasta", noCharge: "No se realizan cobros automáticos al terminar la prueba. Para contratar un plan pago tendrás que confirmar la compra.", cancel: "Cancelar prueba", cancelPaid: "Cancelar suscripción", cancelConfirm: "¿Querés cancelar? Perderás el acceso a las funciones del plan al confirmar. Tus datos no se borran.", cancelledNotice: "La suscripción quedó cancelada. Tus datos no se eliminaron.", noRow: "Todavía no encontramos un plan para esta cuenta. Cerrá sesión y volvé a ingresar para actualizarlo.", error: "No pudimos consultar o actualizar tu suscripción. Intentá nuevamente.", cancelling: "Cancelando…", refresh: "Actualizar estado", safe: "Podés solicitar la cancelación desde aquí. La cancelación no elimina los datos de tu negocio." },
  en: { title: "Your subscription", loading: "Checking your plan…", free: "Free", starter: "Entrepreneur", pro: "Professional", trialing: "Free trial in progress", active: "Active", past_due: "Payment pending", cancelled: "Cancelled", expired: "Trial ended", trialUntil: "Trial ends on", periodUntil: "Current period ends on", noCharge: "The trial does not automatically charge you. You must confirm a paid purchase to subscribe.", cancel: "Cancel trial", cancelPaid: "Cancel subscription", cancelConfirm: "Cancel this subscription? Access to plan features will end when confirmed. Your data will not be deleted.", cancelledNotice: "Subscription cancelled. Your data has not been deleted.", noRow: "No plan was found for this account. Sign out and back in to refresh it.", error: "We could not load or update your subscription. Please try again.", cancelling: "Cancelling…", refresh: "Refresh status", safe: "You can request cancellation here. Cancellation does not delete your business data." },
  pt: { title: "Sua assinatura", loading: "Verificando seu plano…", free: "Grátis", starter: "Empreendedor", pro: "Profissional", trialing: "Período de teste ativo", active: "Ativa", past_due: "Pagamento pendente", cancelled: "Cancelada", expired: "Teste encerrado", trialUntil: "O teste termina em", periodUntil: "Período vigente até", noCharge: "O teste não gera cobrança automática. Você deverá confirmar a contratação paga.", cancel: "Cancelar teste", cancelPaid: "Cancelar assinatura", cancelConfirm: "Deseja cancelar? O acesso às funções do plano será encerrado. Seus dados não serão apagados.", cancelledNotice: "Assinatura cancelada. Seus dados não foram apagados.", noRow: "Não encontramos um plano para esta conta. Saia e entre novamente.", error: "Não foi possível consultar ou atualizar sua assinatura.", cancelling: "Cancelando…", refresh: "Atualizar status", safe: "O cancelamento não apaga os dados da empresa." },
  fr: { title: "Votre abonnement", loading: "Vérification de votre offre…", free: "Gratuit", starter: "Entrepreneur", pro: "Professionnel", trialing: "Essai gratuit en cours", active: "Actif", past_due: "Paiement en attente", cancelled: "Annulé", expired: "Essai terminé", trialUntil: "L’essai se termine le", periodUntil: "Période en cours jusqu’au", noCharge: "L’essai ne déclenche aucun paiement automatique. Vous devez confirmer tout abonnement payant.", cancel: "Annuler l’essai", cancelPaid: "Annuler l’abonnement", cancelConfirm: "Annuler cet abonnement ? Vos données ne seront pas supprimées.", cancelledNotice: "Abonnement annulé. Vos données restent disponibles.", noRow: "Aucune offre trouvée. Déconnectez-vous puis reconnectez-vous.", error: "Impossible de charger ou modifier l’abonnement.", cancelling: "Annulation…", refresh: "Actualiser", safe: "L’annulation ne supprime pas les données de votre entreprise." },
  de: { title: "Dein Abonnement", loading: "Tarif wird geprüft…", free: "Kostenlos", starter: "Unternehmer", pro: "Professional", trialing: "Kostenlose Testphase läuft", active: "Aktiv", past_due: "Zahlung ausstehend", cancelled: "Gekündigt", expired: "Testphase beendet", trialUntil: "Testphase endet am", periodUntil: "Aktueller Zeitraum bis", noCharge: "Nach dem Test erfolgt keine automatische Abbuchung. Ein kostenpflichtiger Abschluss muss bestätigt werden.", cancel: "Test kündigen", cancelPaid: "Abo kündigen", cancelConfirm: "Abo kündigen? Deine Daten werden nicht gelöscht.", cancelledNotice: "Abo gekündigt. Deine Daten bleiben erhalten.", noRow: "Kein Tarif gefunden. Bitte ab- und wieder anmelden.", error: "Abo konnte nicht geladen oder geändert werden.", cancelling: "Wird gekündigt…", refresh: "Status aktualisieren", safe: "Die Kündigung löscht keine Geschäftsdaten." }
};

function effectiveStatus(subscription: Subscription): Subscription["status"] {
  if (subscription.status === "trialing" && Date.parse(subscription.trial_ends_at) <= Date.now()) return "expired";
  return subscription.status;
}

export function SubscriptionManagement({ language, demoMode }: { language: LanguageCode; demoMode: boolean }) {
  const t = copy[language];
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const client = getSupabaseBrowserClient();
      const { data: userData, error: userError } = await client?.auth.getUser() ?? { data: { user: null }, error: new Error("Supabase unavailable") };
      if (userError || !userData.user) throw new Error("AUTH_REQUIRED");
      const { data, error: readError } = await client!.from("global_stock_subscriptions")
        .select("user_id,plan_key,status,trial_started_at,trial_ends_at,current_period_end,cancel_at_period_end,cancelled_at,provider,provider_subscription_id,price_ars,billing_currency")
        .eq("user_id", userData.user.id).maybeSingle();
      if (readError) throw readError;
      setSubscription(data as Subscription | null);
    } catch { setError(t.error); } finally { setLoading(false); }
  }, [t.error]);

  useEffect(() => { if (!demoMode) void refresh(); else setLoading(false); }, [demoMode, refresh]);

  async function cancel() {
    if (!subscription || busy || !window.confirm(t.cancelConfirm)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const client = getSupabaseBrowserClient();
      const { data: sessionData, error: sessionError } = await client?.auth.getSession() ?? { data: { session: null }, error: new Error("Supabase unavailable") };
      if (sessionError || !sessionData.session) throw new Error("AUTH_REQUIRED");
      if (subscription.provider_subscription_id) {
        const response = await fetch("/api/billing/cancel", { method: "POST", headers: { Authorization: `Bearer ${sessionData.session.access_token}` } });
        if (!response.ok) throw new Error("CANCEL_FAILED");
      } else {
        const { error: updateError } = await client!.from("global_stock_subscriptions")
          .update({ cancel_at_period_end: true }).eq("user_id", subscription.user_id);
        if (updateError) throw updateError;
      }
      setNotice(t.cancelledNotice);
      await refresh();
    } catch { setError(t.error); } finally { setBusy(false); }
  }

  if (demoMode) return <section className="apex-card p-5 text-sm text-[var(--apex-muted)]">{t.title}: la sesión demo no tiene una suscripción real.</section>;
  const status = subscription ? effectiveStatus(subscription) : null;
  const date = (value: string) => new Intl.DateTimeFormat(language === "es" ? "es-AR" : language === "pt" ? "pt-BR" : language === "fr" ? "fr-FR" : language === "de" ? "de-DE" : "en-US", { dateStyle: "medium" }).format(new Date(value));
  return (
    <section className="apex-card space-y-4 p-5 sm:p-6" aria-labelledby="subscription-management-title">
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#8F0000]/10 text-[#8F0000]"><CalendarClock size={20}/></span>
        <div className="min-w-0 flex-1"><h3 id="subscription-management-title" className="font-semibold">{t.title}</h3><p className="mt-1 text-xs text-[var(--apex-muted)]">{t.safe}</p></div>
        <button type="button" onClick={() => void refresh()} disabled={loading || busy} aria-label={t.refresh} className="rounded-lg border border-[var(--apex-border)] p-2 disabled:opacity-50"><Loader2 className={loading ? "animate-spin" : "hidden"} size={16}/><span className={loading ? "sr-only" : "text-xs"}>{loading ? t.loading : "↻"}</span></button>
      </header>
      {loading ? <p role="status" className="text-sm text-[var(--apex-muted)]">{t.loading}</p> : subscription ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--apex-surface-strong)] p-4">
            <div><p className="text-sm font-semibold">{t[subscription.plan_key]}</p><p className="mt-1 text-xs text-[var(--apex-muted)]">{status === "trialing" ? `${t.trialUntil} ${date(subscription.trial_ends_at)}` : subscription.current_period_end ? `${t.periodUntil} ${date(subscription.current_period_end)}` : ""}</p></div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--apex-border)] px-3 py-1.5 text-xs font-semibold"><CheckCircle2 size={14}/>{status ? t[status] : ""}</span>
          </div>
          {status === "trialing" && <p className="text-xs leading-5 text-[var(--apex-muted)]">{t.noCharge}</p>}
          {status === "expired" && <p className="text-sm leading-5 text-amber-700 dark:text-amber-300">{t.noCharge}</p>}
          {status === "cancelled" && !notice && <p className="text-sm text-[var(--apex-muted)]">{t.cancelledNotice}</p>}
          {notice && <p role="status" className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={16}/>{notice}</p>}
          {error && <p role="alert" className="flex items-start gap-2 text-sm text-red-600 dark:text-red-300"><CircleAlert size={16}/>{error}</p>}
          {status !== "cancelled" && status !== "expired" && <button type="button" onClick={() => void cancel()} disabled={busy || loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-500/30 px-4 text-sm font-semibold text-red-700 hover:bg-red-500/5 disabled:opacity-50 dark:text-red-300">{busy ? <Loader2 className="animate-spin" size={15}/> : <XCircle size={15}/>} {busy ? t.cancelling : subscription.provider_subscription_id ? t.cancelPaid : t.cancel}</button>}
        </div>
      ) : <div className="space-y-2"><p className="text-sm text-[var(--apex-muted)]">{t.noRow}</p>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div>}
    </section>
  );
}