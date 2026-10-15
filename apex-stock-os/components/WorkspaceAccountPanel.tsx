"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { LanguageCode } from "./GlobalPreferences";

const copy: Record<LanguageCode, { title: string; description: string; email: string; demo: string; session: string; signout: string }> = {
  es: { title: "Cuenta / Cuentas", description: "Consultá la cuenta con la que ingresaste a Global Stock.", email: "Correo electrónico", demo: "Sesión de demostración", session: "Tu cuenta", signout: "Cerrar sesión" },
  en: { title: "Account / Accounts", description: "Review your Global Stock sign-in account.", email: "Email address", demo: "Demo session", session: "Your account", signout: "Sign out" },
  pt: { title: "Conta / Contas", description: "Consulte sua conta do Global Stock.", email: "E-mail", demo: "Sessão de demonstração", session: "Sua conta", signout: "Sair" },
  fr: { title: "Compte / Comptes", description: "Consultez votre compte Global Stock.", email: "Adresse e-mail", demo: "Session de démonstration", session: "Votre compte", signout: "Se déconnecter" },
  de: { title: "Konto / Konten", description: "Hier findest du dein Global Stock-Anmeldekonto.", email: "E-Mail-Adresse", demo: "Demositzung", session: "Dein Konto", signout: "Abmelden" }
};

export function WorkspaceAccountPanel({ language, demoMode, onSignOut }: {
  language: LanguageCode;
  demoMode: boolean;
  onSignOut: () => void;
}) {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    if (demoMode) return;
    const client = getSupabaseBrowserClient();
    let mounted = true;
    void client?.auth.getUser().then(({ data }) => {
      if (mounted) setEmail(data.user?.email ?? null);
    }).catch(() => null);
    return () => { mounted = false; };
  }, [demoMode]);
  const t = copy[language];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{t.title}</h2>
        <p className="mt-2 text-sm text-[var(--apex-muted)]">{t.description}</p>
      </header>
      <section className="apex-card space-y-5 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#8F0000]/10 text-[#8F0000]"><UserRound size={21}/></span>
          <div>
            <h3 className="font-semibold">{demoMode ? t.demo : t.session}</h3>
            <p className="text-xs text-[var(--apex-muted)]">{demoMode ? t.demo : t.email}</p>
          </div>
        </div>
        {!demoMode && email && <p className="break-all rounded-xl bg-[var(--apex-surface-strong)] px-4 py-3 text-sm">{email}</p>}
        <p className="flex items-center gap-2 text-xs text-[var(--apex-muted)]"><ShieldCheck size={16} className="text-[#8F0000]"/>{demoMode ? t.demo : t.session}</p>
        <button type="button" onClick={onSignOut} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--apex-border)] px-4 text-sm font-semibold hover:bg-[var(--apex-surface-strong)]"><LogOut size={17}/>{t.signout}</button>
      </section>
    </div>
  );
}
