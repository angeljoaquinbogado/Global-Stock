"use client";

import { motion } from "framer-motion";
import { ArrowRight, Building2, Loader2, MapPin, Moon, Sun, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { AuthSplitMotion } from "./AuthSplitMotion";
import { BusinessTypePicker, type BusinessTypeValue } from "./BusinessTypePicker";
import type { LanguageCode } from "./GlobalPreferences";
import { Logo } from "./Logo";
import { TERMS_VERSION, PRIVACY_VERSION } from "./UnifiedLegalGate";

type Props = {
  client: SupabaseClient;
  userId: string;
  dark: boolean;
  language: LanguageCode;
  currency: string;
  onToggleTheme: () => void;
  onReady: (legalAccepted: boolean) => void;
  onSignOut: () => void;
};

const words: Record<LanguageCode, {
  eyebrow: string; heading: string; description: string;
  business: string; businessPlaceholder: string; activity: string;
  country: string; descriptionLabel: string; descriptionPlaceholder: string;
  save: string; saving: string; signOut: string; retry: string;
  missingName: string; unsupportedCountry: string; failure: string;
  loading: string; regionNote: string;
}> = {
  es: {
    eyebrow: "PASO 2 DE 2 · TU NEGOCIO",
    heading: "Configurá tu negocio",
    description: "Tu cuenta está lista. Completá estos datos para empezar a usar Global Stock.",
    business: "Nombre del negocio", businessPlaceholder: "Ej.: Global Pesca",
    activity: "Actividad del negocio", country: "País de operación",
    descriptionLabel: "¿A qué se dedica?",
    descriptionPlaceholder: "Ej.: venta de artículos de pesca en local físico y online",
    save: "Guardar y entrar a Global Stock", saving: "Guardando negocio…",
    signOut: "Cerrar sesión", retry: "Reintentar", missingName: "Ingresá el nombre de tu negocio.",
    unsupportedCountry: "La beta actual está disponible únicamente para negocios que operan en Argentina.",
    failure: "No pudimos guardar el negocio. Revisá tu conexión e intentá nuevamente.",
    loading: "Verificando tu cuenta…",
    regionNote: "La beta gratuita está disponible para negocios que operan en Argentina."
  },
  en: {
    eyebrow: "STEP 2 OF 2 · YOUR BUSINESS", heading: "Set up your business",
    description: "Your account is ready. Add your business details to start using Global Stock.",
    business: "Business name", businessPlaceholder: "Example: Global Fishing",
    activity: "Business activity", country: "Operating country",
    descriptionLabel: "What does your business do?",
    descriptionPlaceholder: "Example: fishing supplies online and in-store",
    save: "Save and open Global Stock", saving: "Saving business…",
    signOut: "Sign out", retry: "Retry", missingName: "Enter your business name.",
    unsupportedCountry: "This beta is only available to businesses operating in Argentina.",
    failure: "Could not save your business. Check your connection and retry.",
    loading: "Checking your account…",
    regionNote: "The free beta is currently available for businesses operating in Argentina."
  },
  pt: {
    eyebrow: "ETAPA 2 DE 2 · SEU NEGÓCIO", heading: "Configure seu negócio",
    description: "Sua conta está pronta. Adicione os dados da empresa para começar.",
    business: "Nome do negócio", businessPlaceholder: "Ex.: Global Pesca",
    activity: "Atividade do negócio", country: "País de operação",
    descriptionLabel: "O que a empresa faz?",
    descriptionPlaceholder: "Ex.: loja de artigos de pesca e vendas online",
    save: "Salvar e entrar no Global Stock", saving: "Salvando negócio…",
    signOut: "Sair", retry: "Tentar novamente", missingName: "Digite o nome do negócio.",
    unsupportedCountry: "Esta versão beta só está disponível para negócios na Argentina.",
    failure: "Não foi possível salvar. Verifique sua conexão e tente novamente.",
    loading: "Verificando sua conta…",
    regionNote: "O beta gratuito está disponível para negócios que operam na Argentina."
  },
  fr: {
    eyebrow: "ÉTAPE 2 SUR 2 · VOTRE ACTIVITÉ", heading: "Configurez votre activité",
    description: "Votre compte est prêt. Ajoutez les informations de votre activité.",
    business: "Nom de l’activité", businessPlaceholder: "Ex. : Global Pêche",
    activity: "Type d’activité", country: "Pays d’activité",
    descriptionLabel: "Que fait votre activité ?",
    descriptionPlaceholder: "Ex. : vente d’articles de pêche en magasin et en ligne",
    save: "Enregistrer et accéder à Global Stock", saving: "Enregistrement…",
    signOut: "Déconnexion", retry: "Réessayer", missingName: "Saisissez le nom de votre activité.",
    unsupportedCountry: "Cette version bêta est réservée aux entreprises en Argentine.",
    failure: "Enregistrement impossible. Vérifiez votre connexion et réessayez.",
    loading: "Vérification du compte…",
    regionNote: "La version bêta gratuite est disponible pour les activités en Argentine."
  },
  de: {
    eyebrow: "SCHRITT 2 VON 2 · DEIN GESCHÄFT", heading: "Richte dein Geschäft ein",
    description: "Dein Konto ist bereit. Ergänze die Geschäftsdaten, um loszulegen.",
    business: "Geschäftsname", businessPlaceholder: "Beispiel: Global Angeln",
    activity: "Geschäftstätigkeit", country: "Betriebsland",
    descriptionLabel: "Was macht dein Geschäft?",
    descriptionPlaceholder: "Beispiel: Angelbedarf im Laden und online",
    save: "Speichern und Global Stock öffnen", saving: "Wird gespeichert…",
    signOut: "Abmelden", retry: "Erneut versuchen", missingName: "Gib einen Geschäftsnamen ein.",
    unsupportedCountry: "Diese Beta ist nur für Geschäfte in Argentinien verfügbar.",
    failure: "Speichern fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut.",
    loading: "Konto wird geprüft…",
    regionNote: "Die kostenlose Beta steht derzeit Geschäften in Argentinien zur Verfügung."
  }
};

export function BusinessOnboardingGate({
  client, userId, dark, language, currency, onToggleTheme, onReady, onSignOut
}: Props) {
  const messages = words[language];
  const readyRef = useRef(onReady);
  useEffect(() => { readyRef.current = onReady; }, [onReady]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<BusinessTypeValue>("retail");
  const [category, setCategory] = useState("almacen");
  const [country, setCountry] = useState("Argentina");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    void (async () => {
      const { data: verified, error: authError } = await client.auth.getUser();
      if (authError || verified.user?.id !== userId) throw new Error("La sesión cambió. Volvé a iniciar sesión.");

      const metadata = verified.user.user_metadata ?? {};
      // Existing accounts and OAuth logins keep their existing flow.
      // For a completed registration, restore the business identity when
      // entering from another PC or phone (not just the device of signup).
      if (metadata.global_stock_onboarding !== "pending") {
        if (metadata.global_stock_onboarding === "complete") {
          const { data: profile } = await client
            .from("global_stock_profiles")
            .select("business_name, industry, country, business_description")
            .eq("user_id", userId)
            .maybeSingle();
          if (!alive) return;
          if (typeof profile?.business_name === "string" && profile.business_name.trim()) {
            localStorage.setItem("global-stock-business-name", profile.business_name);
            if (typeof profile.industry === "string") localStorage.setItem("global-stock-business-type", profile.industry);
            if (typeof profile.country === "string") localStorage.setItem("global-stock-business-country", profile.country);
            if (typeof profile.business_description === "string") localStorage.setItem("global-stock-business-description", profile.business_description);
            if (typeof metadata.business_category === "string") localStorage.setItem("global-stock-business-category", metadata.business_category);
          }
        }
        if (alive) readyRef.current(false);
        return;
      }

      const { data: profile, error: profileError } = await client
        .from("global_stock_profiles")
        .select("business_name")
        .eq("user_id", userId)
        .maybeSingle();
      if (profileError) throw profileError;

      // Profile is the durable source if the browser closed after the save.
      if (typeof profile?.business_name === "string" &&
          profile.business_name.trim().length >= 2 &&
          metadata.global_stock_onboarding === "pending") {
        const { error: updateError } = await client.auth.updateUser({
          data: { global_stock_onboarding: "complete" }
        });
        if (updateError) throw updateError;
        if (alive) readyRef.current(false);
      }
    })().catch(() => {
      if (alive) setError(messages.failure);
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [client, userId, retry, messages.failure]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading) return;
    const businessName = name.trim();
    if (businessName.length < 2) { setError(messages.missingName); return; }
    if (country.trim().toLocaleLowerCase("es") !== "argentina") {
      setError(messages.unsupportedCountry);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const { data: verified, error: authError } = await client.auth.getUser();
      if (authError || verified.user?.id !== userId) throw new Error("Session mismatch");
      const metadata = verified.user.user_metadata ?? {};
      if (metadata.global_stock_onboarding !== "pending") {
        readyRef.current(false);
        return;
      }

      const { error: profileError } = await client.from("global_stock_profiles").upsert({
        user_id: userId,
        full_name: typeof metadata.full_name === "string" ? metadata.full_name : null,
        business_name: businessName,
        industry,
        country: "Argentina",
        business_description: description.trim(),
        default_currency: currency,
        language
      }, { onConflict: "user_id" });
      if (profileError) throw profileError;

      const { error: userUpdateError } = await client.auth.updateUser({
        data: {
          global_stock_onboarding: "complete",
          business_name: businessName,
          industry,
          business_category: category,
          country: "Argentina",
          business_description: description.trim(),
          default_currency: currency,
          language
        }
      });
      if (userUpdateError) throw userUpdateError;

      // The owner already attested 18+, Argentina, and accepted these exact
      // document versions during account creation. Save that consent to the
      // same protected record used by UnifiedLegalGate.
      const signedTheseTerms =
        metadata.global_stock_legal_accepted === true &&
        metadata.adult_18_attested === true &&
        metadata.operates_in_ar_attested === true &&
        metadata.global_stock_terms_version === TERMS_VERSION &&
        metadata.global_stock_privacy_version === PRIVACY_VERSION;
      let legalAccepted = false;
      if (signedTheseTerms) {
        const { error: consentError } = await client
          .from("global_stock_legal_acceptances")
          .upsert({
            user_id: userId,
            terms_version: TERMS_VERSION,
            privacy_version: PRIVACY_VERSION,
            adult_18_attested: true,
            operates_in_ar_attested: true
          }, { onConflict: "user_id,terms_version,privacy_version", ignoreDuplicates: true });
        legalAccepted = !consentError;
      }

      // Only retain non-secret UI settings locally; Supabase remains canonical.
      localStorage.setItem("global-stock-business-name", businessName);
      localStorage.setItem("global-stock-business-type", industry);
      localStorage.setItem("global-stock-business-category", category);
      localStorage.setItem("global-stock-business-country", "Argentina");
      localStorage.setItem("global-stock-business-description", description.trim());

      readyRef.current(legalAccepted);
    } catch {
      setError(messages.failure);
    } finally {
      setSaving(false);
    }
  }

  const muted = dark ? "text-white/60" : "text-[#736F72]";
  const text = dark ? "text-white" : "text-[#21191B]";
  const border = dark
    ? "border-white/20 bg-transparent text-white placeholder:text-white/35"
    : "border-[#C3B7B2] bg-transparent text-[#21191B] placeholder:text-[#8C8585]";

  return (
    <main className={`h-[100dvh] overflow-hidden ${dark ? "bg-[#09080B]" : "bg-[#EDE9E6]"}`}>
      <section className="flex h-full w-full items-center overflow-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-[14px] lg:py-[14px]">
        <AuthSplitMotion mode="signup" language={language} dark={dark}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .3 }}
            className={`min-w-0 px-5 py-6 sm:px-7 lg:px-[clamp(26px,3vw,52px)] ${text}`}>
            <div className="mb-8 flex items-center justify-between gap-2">
              <Logo withWordmark />
              <div className="flex items-center gap-2">
                <button type="button" onClick={onToggleTheme}
                  aria-label={dark ? "Usar tema claro" : "Usar tema oscuro"}
                  className="grid h-9 w-9 place-items-center rounded-full border border-current/10 bg-black/5 dark:bg-white/5">
                  {dark ? <Sun size={16}/> : <Moon size={16}/>}
                </button>
                <button type="button" onClick={onSignOut}
                  aria-label={messages.signOut}
                  className="grid h-9 w-9 place-items-center rounded-full border border-current/10 bg-black/5 dark:bg-white/5">
                  <X size={16}/>
                </button>
              </div>
            </div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#8F0000]">{messages.eyebrow}</p>
            <h1 className="text-2xl font-semibold tracking-[-.045em] sm:text-[1.8rem]">{messages.heading}</h1>
            <p className={`mb-6 mt-2 text-[13px] leading-5 ${muted}`}>{messages.description}</p>

            {loading ? (
              <div role="status" className={`flex items-center gap-3 py-6 text-sm ${muted}`}>
                <Loader2 className="animate-spin" size={18}/>{messages.loading}
              </div>
            ) : (
              <form onSubmit={save} className="space-y-5">
                <div className="space-y-3 rounded-[22px] border border-[var(--apex-border)] p-3.5">
                  <label className="block">
                    <span className={`mb-2 block text-xs font-semibold ${muted}`}>{messages.business}</span>
                    <div className="relative">
                      <Building2 size={17} aria-hidden="true"
                        className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`}/>
                      <input type="text" autoComplete="organization" required minLength={2}
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder={messages.businessPlaceholder}
                        className={`min-h-11 w-full border-0 border-b py-3 pl-10 pr-2 text-[13px] outline-none focus:border-[#8F0000] ${border}`}/>
                    </div>
                  </label>
                  <div>
                    <p className={`mb-2 text-xs font-semibold ${muted}`}>{messages.activity}</p>
                    <BusinessTypePicker language={language} value={industry}
                      onChange={setIndustry} categoryId={category} onCategoryChange={setCategory}/>
                  </div>
                  <label className="block">
                    <span className={`mb-2 block text-xs font-semibold ${muted}`}>{messages.country}</span>
                    <div className="relative">
                      <MapPin size={17} aria-hidden="true"
                        className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`}/>
                      <input type="text" required value={country}
                        onChange={e => setCountry(e.target.value)}
                        className={`min-h-11 w-full border-0 border-b py-3 pl-10 pr-2 text-[13px] outline-none focus:border-[#8F0000] ${border}`}/>
                    </div>
                    <span className={`mt-2 block text-[11px] leading-4 ${muted}`}>{messages.regionNote}</span>
                  </label>
                  <label className="block">
                    <span className={`mb-2 block text-xs font-semibold ${muted}`}>{messages.descriptionLabel}</span>
                    <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                      placeholder={messages.descriptionPlaceholder}
                      className={`min-h-20 w-full resize-y border-0 border-b px-2 py-3 text-[13px] outline-none focus:border-[#8F0000] ${border}`}/>
                  </label>
                </div>
                {error && (
                  <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-600 dark:text-red-200">
                    {error}
                    <button type="button" onClick={() => setRetry(v=>v+1)}
                      className="ml-3 underline">{messages.retry}</button>
                  </div>
                )}
                <button type="submit" disabled={saving}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#8F0000] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(143,0,0,.20)] hover:bg-[#a40000] disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin" size={17}/> : <ArrowRight size={17}/>}
                  {saving ? messages.saving : messages.save}
                </button>
              </form>
            )}
          </motion.div>
        </AuthSplitMotion>
      </section>
    </main>
  );
}
