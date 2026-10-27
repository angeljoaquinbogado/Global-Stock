"use client";

import { Check, Clock3, CreditCard, Sparkles } from "lucide-react";
import type { LanguageCode } from "./GlobalPreferences";

const plans = [
  {
    id: "free",
    name: "Prueba gratuita",
    price: 0,
    suffix: "15 días",
    description: "Probá Global Stock con tu negocio antes de elegir.",
    features: ["Caja registradora y ventas", "Inventario y productos", "Reportes básicos", "Sin tarjeta obligatoria"],
    icon: Clock3
  },
  {
    id: "starter",
    name: "Emprendedor",
    price: 9900,
    suffix: "por mes",
    description: "Para comercios pequeños que necesitan orden diario.",
    features: ["Caja, ventas e inventario", "Proveedores y comprobantes", "Estadísticas del negocio", "Un negocio o local"],
    icon: Check
  },
  {
    id: "pro",
    name: "Profesional",
    price: 19900,
    suffix: "por mes",
    description: "Para negocios en crecimiento y equipos con varios locales.",
    features: ["Todo lo de Emprendedor", "Análisis avanzados e IA", "Gestión de varios locales", "Informes y organización avanzados"],
    icon: Sparkles
  }
] as const;

const labels: Record<LanguageCode, { title: string; subtitle: string; currencyNote: string; paymentNote: string; trial: string; perMonth: string; selected: string }> = {
  es: { title: "Planes de Global Stock", subtitle: "Opciones simples para cada etapa de tu negocio.", currencyNote: "Precios iniciales sugeridos en pesos argentinos (ARS).", paymentNote: "La contratación y los cobros todavía no están activados. PayPal se habilitará cuando se configuren los importes de facturación y los planes del proveedor.", trial: "Prueba gratuita de 15 días", perMonth: "por mes", selected: "Plan sugerido" },
  en: { title: "Global Stock plans", subtitle: "Simple options for every stage of your business.", currencyNote: "Suggested starting prices in Argentine pesos (ARS).", paymentNote: "Sign-up and charges are not enabled yet. PayPal will be enabled after billing amounts and provider plans are configured.", trial: "15-day free trial", perMonth: "per month", selected: "Suggested plan" },
  pt: { title: "Planos Global Stock", subtitle: "Opções simples para cada fase do seu negócio.", currencyNote: "Preços iniciais sugeridos em pesos argentinos (ARS).", paymentNote: "A contratação e as cobranças ainda não estão ativadas. O PayPal será habilitado após configurar os valores e os planos do provedor.", trial: "Teste grátis de 15 dias", perMonth: "por mês", selected: "Plano sugerido" },
  fr: { title: "Offres Global Stock", subtitle: "Des options simples pour chaque étape de votre activité.", currencyNote: "Prix de départ suggérés en pesos argentins (ARS).", paymentNote: "Les abonnements et paiements ne sont pas encore activés. PayPal sera activé après la configuration des tarifs et des plans du fournisseur.", trial: "Essai gratuit de 15 jours", perMonth: "par mois", selected: "Offre suggérée" },
  de: { title: "Global Stock Tarife", subtitle: "Einfache Optionen für jede Entwicklungsphase.", currencyNote: "Vorgeschlagene Einstiegspreise in argentinischen Pesos (ARS).", paymentNote: "Abos und Zahlungen sind noch nicht aktiviert. PayPal wird nach Einrichtung der Preise und Anbieterpläne aktiviert.", trial: "15 Tage kostenlos testen", perMonth: "pro Monat", selected: "Vorgeschlagener Tarif" }
};

function formatArs(value: number, language: LanguageCode) {
  return new Intl.NumberFormat(language === "es" ? "es-AR" : language === "pt" ? "pt-BR" : language === "fr" ? "fr-FR" : language === "de" ? "de-DE" : "en-US", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0
  }).format(value);
}

export function SubscriptionPlans({ language }: { language: LanguageCode }) {
  const t = labels[language];
  return (
    <section className="space-y-5" aria-labelledby="subscription-plans-title">
      <header>
        <h3 id="subscription-plans-title" className="text-xl font-semibold tracking-tight">{t.title}</h3>
        <p className="mt-1 text-sm text-[var(--apex-muted)]">{t.subtitle}</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <article key={plan.id} className={`apex-card flex flex-col p-5 ${plan.id === "starter" ? "border-[#8F0000]/40 ring-1 ring-[#8F0000]/15" : ""}`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#8F0000]/10 text-[#8F0000]"><Icon size={18}/></span>
                {plan.name}
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{plan.price === 0 ? "$0" : formatArs(plan.price, language)}</p>
              <p className="mt-1 text-xs text-[var(--apex-muted)]">{plan.price === 0 ? t.trial : t.perMonth}</p>
              <p className="mt-3 min-h-10 text-sm text-[var(--apex-muted)]">{plan.description}</p>
              <ul className="mt-4 flex-1 space-y-2.5">
                {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-[#8F0000]"/><span>{feature}</span></li>)}
              </ul>
              {plan.id === "free" && <p className="mt-5 rounded-xl bg-[var(--apex-surface-strong)] px-3 py-2 text-xs font-medium">{t.trial}</p>}
            </article>
          );
        })}
      </div>
      <p className="text-xs text-[var(--apex-muted)]">{t.currencyNote}</p>
      <div className="flex items-start gap-3 rounded-2xl border border-[var(--apex-border)] p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--apex-surface-strong)]"><CreditCard size={18}/></span>
        <p className="text-sm leading-6 text-[var(--apex-muted)]">{t.paymentNote}</p>
      </div>
    </section>
  );
}
