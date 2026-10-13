"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Moon,
  Sun,
  UserRound
} from "lucide-react";
import { FormEvent, useState } from "react";

import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { LanguageCode } from "./GlobalPreferences";
import { Logo } from "./Logo";
import { GoogleIdentityButton } from "./GoogleIdentityButton";
import { AppleIdentityButton } from "./AppleIdentityButton";
import { AuthSplitMotion } from "./AuthSplitMotion";
import { TERMS_VERSION, PRIVACY_VERSION } from "./UnifiedLegalGate";

type AuthScreenProps = {
  dark: boolean;
  language: LanguageCode;
  currency: string;
  onToggleTheme: () => void;
  onLanguageChange: (language: LanguageCode) => void;
  onCurrencyChange: (currency: string) => void;
  onAuthenticated: (mode?: "user" | "demo") => void;
};

type Mode = "signin" | "signup";

const copy: Record<
  LanguageCode,
  {
    intro: string;
    network: string;
    signIn: string;
    signUp: string;
    ready: string;
    signInTitle: string;
    signUpTitle: string;
    signInDescription: string;
    signUpDescription: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    enter: string;
    create: string;
    google: string;
    apple: string;
    configured: string;
    demo: string;
    invalidEmail: string;
    invalidPassword: string;
    invalidName: string;
    accountCreated: string;
    authError: string;
    oauthSetup: string;
    showPassword: string;
    hidePassword: string;
    theme: string;
  }
> = {
  es: {
    intro:
      "Consultá tus productos, ventas y stock. Todo lo que necesitás del negocio, a mano.",
    network: "Red global activa",
    signIn: "Iniciar sesión",
    signUp: "Crear cuenta",
    ready: "Global Intelligence activa",
    signInTitle: "Qué bueno verte de nuevo.",
    signUpTitle: "Creá tu cuenta.",
    signInDescription:
      "Entrá para ver cómo viene el negocio.",
    signUpDescription:
      "Empezá gratis y configurá tu negocio, moneda y stock en pocos pasos.",
    name: "Nombre",
    namePlaceholder: "Tu nombre",
    email: "Correo electrónico",
    emailPlaceholder: "nombre@empresa.com",
    password: "Contraseña",
    passwordPlaceholder: "Mínimo 8 caracteres",
    enter: "Entrar a Global Stock",
    create: "Crear cuenta gratis",
    google: "Continuar con Google",
    apple: "Continuar con Apple",
    configured: "Autenticación protegida por Supabase Auth.",
    demo: "Modo demo para pruebas. Supabase habilita cuentas y datos reales.",
    invalidEmail: "Ingresá un correo electrónico válido.",
    invalidPassword: "La contraseña debe tener al menos 8 caracteres.",
    invalidName: "Ingresá tu nombre.",
    accountCreated:
      "Cuenta creada. Si recibís un correo de confirmación, verificá tu dirección e iniciá sesión. Después vas a completar los datos de tu negocio.",
    authError: "No se pudo completar la autenticación.",
    oauthSetup: "Google requiere configurar Supabase antes de usar OAuth.",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    theme: "Cambiar tema"
  },
  en: {
    intro:
      "Your business connected to the world. Inventory, sales, profitability and intelligence in one platform.",
    network: "Global network online",
    signIn: "Sign in",
    signUp: "Create account",
    ready: "Global Intelligence online",
    signInTitle: "Back in control.",
    signUpTitle: "Create your account.",
    signInDescription:
      "Access your global operation from any device.",
    signUpDescription:
      "Start free and configure your business, currency and inventory in a few steps.",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "name@company.com",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    enter: "Enter Global Stock",
    create: "Create free account",
    google: "Continue with Google",
    apple: "Continue with Apple",
    configured: "Authentication protected by Supabase Auth.",
    demo: "Demo mode for testing. Supabase enables real accounts and data.",
    invalidEmail: "Enter a valid email address.",
    invalidPassword: "Password must contain at least 8 characters.",
    invalidName: "Enter your name.",
    accountCreated:
      "Account created. Check your email to confirm access before signing in.",
    authError: "Authentication could not be completed.",
    oauthSetup: "Google sign-in requires Supabase configuration first.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    theme: "Change theme"
  },
  pt: {
    intro:
      "Seu negócio conectado ao mundo. Estoque, vendas, rentabilidade e inteligência em uma só plataforma.",
    network: "Rede global ativa",
    signIn: "Entrar",
    signUp: "Criar conta",
    ready: "Global Intelligence ativa",
    signInTitle: "Volte ao controle.",
    signUpTitle: "Crie sua conta.",
    signInDescription:
      "Acesse sua operação global de qualquer dispositivo.",
    signUpDescription:
      "Comece grátis e configure seu negócio, moeda e estoque em poucos passos.",
    name: "Nome",
    namePlaceholder: "Seu nome",
    email: "E-mail",
    emailPlaceholder: "nome@empresa.com",
    password: "Senha",
    passwordPlaceholder: "Mínimo de 8 caracteres",
    enter: "Entrar no Global Stock",
    create: "Criar conta grátis",
    google: "Continuar com Google",
    apple: "Continuar com Apple",
    configured: "Autenticação protegida pelo Supabase Auth.",
    demo: "Modo demo para testes. Supabase habilita contas e dados reais.",
    invalidEmail: "Digite um e-mail válido.",
    invalidPassword: "A senha deve ter pelo menos 8 caracteres.",
    invalidName: "Digite seu nome.",
    accountCreated:
      "Conta criada. Verifique seu e-mail para confirmar o acesso antes de entrar.",
    authError: "Não foi possível concluir a autenticação.",
    oauthSetup: "O login com Google requer configurar o Supabase primeiro.",
    showPassword: "Mostrar senha",
    hidePassword: "Ocultar senha",
    theme: "Alterar tema"
  },
  fr: {
    intro:
      "Votre activité connectée au monde. Stock, ventes, rentabilité et intelligence sur une seule plateforme.",
    network: "Réseau mondial actif",
    signIn: "Se connecter",
    signUp: "Créer un compte",
    ready: "Global Intelligence active",
    signInTitle: "Reprenez le contrôle.",
    signUpTitle: "Créez votre compte.",
    signInDescription:
      "Accédez à votre activité mondiale depuis n’importe quel appareil.",
    signUpDescription:
      "Commencez gratuitement et configurez votre activité, devise et stock en quelques étapes.",
    name: "Nom",
    namePlaceholder: "Votre nom",
    email: "E-mail",
    emailPlaceholder: "nom@entreprise.com",
    password: "Mot de passe",
    passwordPlaceholder: "8 caractères minimum",
    enter: "Entrer dans Global Stock",
    create: "Créer un compte gratuit",
    google: "Continuer avec Google",
    apple: "Continuer avec Apple",
    configured: "Authentification protégée par Supabase Auth.",
    demo: "Mode démo. Supabase active les comptes et données réels.",
    invalidEmail: "Saisissez une adresse e-mail valide.",
    invalidPassword: "Le mot de passe doit contenir au moins 8 caractères.",
    invalidName: "Saisissez votre nom.",
    accountCreated:
      "Compte créé. Consultez votre e-mail pour confirmer l’accès avant de vous connecter.",
    authError: "Impossible de terminer l’authentification.",
    oauthSetup: "Google nécessite d’abord la configuration de Supabase.",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    theme: "Changer de thème"
  },
  de: {
    intro:
      "Dein Unternehmen mit der Welt verbunden. Bestand, Verkäufe, Rentabilität und Intelligenz auf einer Plattform.",
    network: "Globales Netzwerk aktiv",
    signIn: "Anmelden",
    signUp: "Konto erstellen",
    ready: "Global Intelligence aktiv",
    signInTitle: "Zurück zur Kontrolle.",
    signUpTitle: "Erstelle dein Konto.",
    signInDescription:
      "Greife von jedem Gerät auf deinen globalen Betrieb zu.",
    signUpDescription:
      "Starte kostenlos und richte Unternehmen, Währung und Bestand in wenigen Schritten ein.",
    name: "Name",
    namePlaceholder: "Dein Name",
    email: "E-Mail",
    emailPlaceholder: "name@unternehmen.de",
    password: "Passwort",
    passwordPlaceholder: "Mindestens 8 Zeichen",
    enter: "Global Stock öffnen",
    create: "Kostenloses Konto erstellen",
    google: "Mit Google fortfahren",
    apple: "Mit Apple fortfahren",
    configured: "Authentifizierung durch Supabase Auth geschützt.",
    demo: "Demo-Modus zum Testen. Supabase aktiviert echte Konten und Daten.",
    invalidEmail: "Gib eine gültige E-Mail-Adresse ein.",
    invalidPassword: "Das Passwort muss mindestens 8 Zeichen lang sein.",
    invalidName: "Gib deinen Namen ein.",
    accountCreated:
      "Konto erstellt. Bestätige den Zugang per E-Mail, bevor du dich anmeldest.",
    authError: "Die Authentifizierung konnte nicht abgeschlossen werden.",
    oauthSetup: "Google-Anmeldung erfordert zuerst die Supabase-Konfiguration.",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort ausblenden",
    theme: "Design ändern"
  }
};

export function AuthScreen({
  dark,
  language,
  currency,
  onToggleTheme,
  onLanguageChange,
  onAuthenticated
}: AuthScreenProps) {
  const labels = copy[language];
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>("signin");
  const [adultConsent, setAdultConsent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() =>
    isSupabaseConfigured() ? "" : "demo@globalstock.local"
  );
  const [password, setPassword] = useState(() =>
    isSupabaseConfigured() ? "" : "GlobalStock2026!"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    if (nextMode === "signup") setAdultConsent(false);
    setError("");
    setNotice("");
    setShowPassword(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError(labels.invalidEmail);
      return;
    }

    if (password.length < 8) {
      setError(labels.invalidPassword);
      return;
    }

    if (mode === "signup" && name.trim().length < 2) {
      setError(labels.invalidName);
      return;
    }

    if (mode === "signup" && !adultConsent) {
      setError("Para crear la cuenta necesitás tener 18 años o más y aceptar las condiciones de la beta argentina.");
      return;
    }

    setPending(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (
        mode === "signin" &&
        normalizedEmail === "demo@globalstock.app" &&
        password === "GlobalStock2026!"
      ) {
        if (supabase) {
          await supabase.auth.signOut();
        }
        onAuthenticated("demo");
        return;
      }

      if (!supabase) {
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        onAuthenticated();
        return;
      }

      if (mode === "signin") {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (authError) throw authError;

        if (data.user?.id) {
          const metadata = data.user.user_metadata ?? {};
          const { error: profileError } = await supabase
            .from("global_stock_profiles")
            .upsert(
              {
                user_id: data.user.id,
                full_name:
                  typeof metadata.full_name === "string"
                    ? metadata.full_name
                    : null,
                business_name:
                  typeof metadata.business_name === "string"
                    ? metadata.business_name
                    : null,
                industry:
                  typeof metadata.industry === "string"
                    ? metadata.industry
                    : null,
                country:
                  typeof metadata.country === "string"
                    ? metadata.country
                    : null,
                business_description:
                  typeof metadata.business_description === "string"
                    ? metadata.business_description
                    : null,
                default_currency: currency,
                language
              },
              { onConflict: "user_id", ignoreDuplicates: true }
            );

          if (profileError) throw profileError;
        }

        onAuthenticated();
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            app: "global_stock",
            full_name: name.trim(),
            // Step 2 is completed after the user has a verified session.
            global_stock_onboarding: "pending",
            global_stock_legal_accepted: true,
            global_stock_terms_version: TERMS_VERSION,
            global_stock_privacy_version: PRIVACY_VERSION,
            adult_18_attested: true,
            operates_in_ar_attested: true,
            default_currency: currency,
            language
          }
        }
      });

      if (authError) throw authError;

      if (data.session) {
        onAuthenticated();
      } else {
        setMode("signin");
        setNotice(labels.accountCreated);
      }
    } catch {
      setError(labels.authError);
    } finally {
      setPending(false);
    }
  }


  const muted = dark ? "text-white/60" : "text-[#726D70]";
  const fieldStyle = dark
    ? "border-white/25 text-white placeholder:text-white/40 focus:border-[#E35865]"
    : "border-[#B7A6A3] text-[#2A2223] placeholder:text-[#989092] focus:border-[#8F0000]";
  const icons = dark ? "text-white/50" : "text-[#84777B]";

  const switchText: Record<LanguageCode, {
    first: string; openAccount: string; existing: string;
    back: string; username: string; legal: string;
  }> = {
    es: { first: "¿Todavía no tenés cuenta?", openAccount: "Crear cuenta",
      existing: "¿Ya tenés una cuenta?", back: "Iniciar sesión",
      username: "Nombre completo",
      legal: "Tengo 18 años o más, opero en Argentina y acepto los" },
    en: { first: "New to Global Stock?", openAccount: "Create account",
      existing: "Already have an account?", back: "Sign in",
      username: "Full name", legal: "I am 18 or older, operate in Argentina and accept the" },
    pt: { first: "Novo no Global Stock?", openAccount: "Criar conta",
      existing: "Já tem uma conta?", back: "Entrar",
      username: "Nome completo", legal: "Tenho mais de 18 anos, opero na Argentina e aceito os" },
    fr: { first: "Nouveau sur Global Stock ?", openAccount: "Créer un compte",
      existing: "Vous avez déjà un compte ?", back: "Se connecter",
      username: "Nom complet", legal: "J’ai 18 ans ou plus, j’opère en Argentine et j’accepte les" },
    de: { first: "Neu bei Global Stock?", openAccount: "Konto erstellen",
      existing: "Bereits ein Konto?", back: "Anmelden",
      username: "Vollständiger Name", legal: "Ich bin mindestens 18, arbeite in Argentinien und akzeptiere die" }
  };
  const micro = switchText[language];

  return (
    <main className="gs-auth-viewport fixed inset-0 h-[100dvh] overflow-hidden bg-[radial-gradient(ellipse_at_75%_15%,#2C0913_0%,#0E0C0E_62%,#080809_100%)]">
      <section className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden px-3 py-3 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
        <div className="mx-auto h-full min-h-0 w-full max-w-[1480px]">
          <AuthSplitMotion mode={mode} language={language} dark={dark}>
            <div className="gs-auth-reference-form w-full min-w-0 px-[clamp(18px,4.2vw,72px)] py-2 lg:px-[clamp(30px,5.2vw,88px)]">
              <div className="gs-auth-brand-row mb-7 flex items-center justify-between gap-3">
                <Logo withWordmark />
                <div className="flex shrink-0 items-center gap-1.5">
                  <select
                    aria-label={language === "es" ? "Idioma" : "Language"}
                    value={language}
                    onChange={event => onLanguageChange(event.target.value as LanguageCode)}
                    className={`h-8 max-w-[56px] cursor-pointer rounded-lg border border-current/10 bg-transparent px-1 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#8F0000] ${muted}`}
                  >
                    <option value="es">ES</option>
                    <option value="en">EN</option>
                    <option value="pt">PT</option>
                    <option value="fr">FR</option>
                    <option value="de">DE</option>
                  </select>
                  <button type="button" onClick={onToggleTheme} aria-label={labels.theme}
                    className="grid h-8 w-8 place-items-center rounded-full border border-current/10 bg-black/[.025] transition-colors hover:bg-[#8F0000]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8F0000]">
                    {dark ? <Sun size={15}/> : <Moon size={15}/>}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={reduceMotion ? false : { opacity: 0, y: 9 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -7 }}
                  transition={{ duration: reduceMotion ? 0 : .24, delay: reduceMotion ? 0 : .24 }}
                >
                  <div className="mb-6">
                    <h1 className="text-[clamp(1.35rem,2vw,1.85rem)] font-semibold tracking-[-.048em]">
                      {mode === "signin" ? labels.signIn : labels.signUp}
                    </h1>
                    <div aria-hidden="true" className="mt-2 h-[2px] w-7 rounded-full bg-[#8F0000]"/>
                  </div>
                  <form onSubmit={submit} className="gs-auth-reference-fields space-y-4">
                    {mode === "signup" && (
                      <label className="block">
                        <span className={`mb-1 block text-[11px] font-medium ${muted}`}>{micro.username}</span>
                        <span className="relative block">
                          <UserRound className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 ${icons}`} size={15}/>
                          <input
                            value={name} onChange={event => setName(event.target.value)}
                            type="text" autoComplete="name" required minLength={2}
                            placeholder={labels.namePlaceholder}
                            className={`h-10 w-full border-0 border-b bg-transparent pr-8 text-[13px] outline-none transition-colors ${fieldStyle}`}/>
                        </span>
                      </label>
                    )}
                    <label className="block">
                      <span className={`mb-1 block text-[11px] font-medium ${muted}`}>{labels.email}</span>
                      <span className="relative block">
                        <Mail className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 ${icons}`} size={15}/>
                        <input value={email} onChange={event => setEmail(event.target.value)}
                          type="email" inputMode="email" autoComplete="email" required
                          placeholder={labels.emailPlaceholder}
                          className={`h-10 w-full border-0 border-b bg-transparent pr-8 text-[13px] outline-none transition-colors ${fieldStyle}`}/>
                      </span>
                    </label>
                    <label className="block">
                      <span className={`mb-1 block text-[11px] font-medium ${muted}`}>{labels.password}</span>
                      <span className="relative block">
                        <input value={password} onChange={event => setPassword(event.target.value)}
                          type={showPassword ? "text" : "password"}
                          autoComplete={mode === "signin" ? "current-password" : "new-password"}
                          required minLength={8}
                          placeholder={labels.passwordPlaceholder}
                          className={`h-10 w-full border-0 border-b bg-transparent pr-9 text-[13px] outline-none transition-colors ${fieldStyle}`}/>
                        <button type="button" onClick={() => setShowPassword(value => !value)}
                          aria-label={showPassword ? labels.hidePassword : labels.showPassword}
                          className={`absolute right-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full ${muted}`}>
                          {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </span>
                      {mode === "signup" && <span className={`mt-1 block text-[10px] ${muted}`}>{labels.invalidPassword}</span>}
                    </label>

                    {mode === "signup" && (
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox" checked={adultConsent} required
                          onChange={event => setAdultConsent(event.target.checked)}
                          aria-label="Declaro ser mayor de 18 años y aceptar los términos y la privacidad"
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#8F0000]"/>
                        <span className={`text-[11px] leading-[1.5] ${muted}`}>
                          {micro.legal}{" "}
                          <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#8F0000]">
                            {language === "es" ? "Términos" : "Terms"}
                          </a>{" "}
                          {language === "es" ? "y la" : "&"}{" "}
                          <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#8F0000]">
                            {language === "es" ? "Privacidad" : "Privacy"}
                          </a>.
                        </span>
                      </label>
                    )}

                    {error && (
                      <div role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] leading-4 text-[#BC1D31] dark:text-red-200">{error}</div>
                    )}
                    {notice && (
                      <div role="status" className={`rounded-lg border border-[#8F0000]/25 bg-[#8F0000]/5 px-3 py-2 text-[11px] leading-4 ${dark ? "text-[#F2B8BF]" : "text-[#71242D]"}`}>{notice}</div>
                    )}

                    <button type="submit" disabled={pending || (mode === "signup" && !adultConsent)}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#8F0000] px-4 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(143,0,0,.22)] transition-[background-color,box-shadow] hover:bg-[#AA101E] hover:shadow-[0_10px_26px_rgba(143,0,0,.32)] disabled:cursor-not-allowed disabled:opacity-55">
                      {pending ? <Loader2 className="animate-spin" size={16}/> : <ArrowRight size={16}/>}
                      {mode === "signin" ? labels.signIn : labels.signUp}
                    </button>
                  </form>

                  {mode === "signin" && (
                    <div className="gs-auth-social mt-3 grid gap-2">
                      <GoogleIdentityButton
                        dark={dark} label={labels.google} language={language} currency={currency}
                        onAuthenticated={() => onAuthenticated()}
                        onError={() => setError(labels.authError)}
                      />
                      <AppleIdentityButton
                        dark={dark} label={labels.apple}
                        onError={(message) => setError(message)}
                      />
                    </div>
                  )}

                  <p className={`mt-4 text-center text-[11px] leading-5 ${muted}`}>
                    {mode === "signin" ? micro.first : micro.existing}{" "}
                    <button type="button" onClick={() => selectMode(mode === "signin" ? "signup" : "signin")}
                      className={`font-semibold underline decoration-[#8F0000]/40 underline-offset-[3px] transition-colors hover:text-[#8F0000] ${dark ? "text-white" : "text-[#322729]"}`}>
                      {mode === "signin" ? micro.openAccount : micro.back}
                    </button>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </AuthSplitMotion>
        </div>
      </section>
    </main>
  );
}
