"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Moon,
  Sparkles,
  Sun,
  UserRound,
  Zap
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { GlobalPreferences, type LanguageCode } from "./GlobalPreferences";
import { BusinessTypePicker, type BusinessTypeValue } from "./BusinessTypePicker";
import { Logo } from "./Logo";

const AuthScene = dynamic(
  () => import("./AuthScene").then((module) => module.AuthScene),
  { ssr: false }
);

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
      "Tu negocio conectado al mundo. Stock, ventas, rentabilidad e inteligencia en una sola plataforma.",
    network: "Red global activa",
    signIn: "Iniciar sesión",
    signUp: "Crear cuenta",
    ready: "Global Intelligence activa",
    signInTitle: "Volvé al control.",
    signUpTitle: "Creá tu cuenta.",
    signInDescription:
      "Entrá a tu operación global desde cualquier dispositivo.",
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
    configured: "Autenticación protegida por Supabase Auth.",
    demo: "Modo demo para pruebas. Supabase habilita cuentas y datos reales.",
    invalidEmail: "Ingresá un correo electrónico válido.",
    invalidPassword: "La contraseña debe tener al menos 8 caracteres.",
    invalidName: "Ingresá tu nombre.",
    accountCreated:
      "Cuenta creada. Revisá tu correo para confirmar el acceso antes de iniciar sesión.",
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

const signupExtra: Record<
  LanguageCode,
  {
    businessName: string;
    businessNamePlaceholder: string;
    industry: string;
    industryRetail: string;
    industryRestaurant: string;
    industryServices: string;
    industryWholesale: string;
    industryEcommerce: string;
    industryIndustry: string;
    industryOther: string;
    country: string;
    countryPlaceholder: string;
    businessDescription: string;
    businessDescriptionPlaceholder: string;
    invalidBusinessName: string;
  }
> = {
  es: {
    businessName: "Nombre del negocio",
    businessNamePlaceholder: "Ej.: Global Pesca",
    industry: "Actividad del negocio",
    industryRetail: "Comercio / retail",
    industryRestaurant: "Restaurante / gastronomía",
    industryServices: "Servicios",
    industryWholesale: "Mayorista / distribución",
    industryEcommerce: "Ecommerce",
    industryIndustry: "Industria / fabricación",
    industryOther: "Otro",
    country: "País de operación",
    countryPlaceholder: "Ej.: Argentina",
    businessDescription: "¿A qué se dedica?",
    businessDescriptionPlaceholder:
      "Ej.: venta de artículos de pesca en local físico y online",
    invalidBusinessName: "Ingresá el nombre del negocio."
  },
  en: {
    businessName: "Business name",
    businessNamePlaceholder: "Example: Global Fishing",
    industry: "Business activity",
    industryRetail: "Retail",
    industryRestaurant: "Restaurant / hospitality",
    industryServices: "Services",
    industryWholesale: "Wholesale / distribution",
    industryEcommerce: "Ecommerce",
    industryIndustry: "Industry / manufacturing",
    industryOther: "Other",
    country: "Operating country",
    countryPlaceholder: "Example: United States",
    businessDescription: "What does the business do?",
    businessDescriptionPlaceholder:
      "Example: fishing goods sold in-store and online",
    invalidBusinessName: "Enter the business name."
  },
  pt: {
    businessName: "Nome do negócio",
    businessNamePlaceholder: "Ex.: Global Pesca",
    industry: "Atividade do negócio",
    industryRetail: "Comércio / varejo",
    industryRestaurant: "Restaurante / gastronomia",
    industryServices: "Serviços",
    industryWholesale: "Atacado / distribuição",
    industryEcommerce: "Ecommerce",
    industryIndustry: "Indústria / fabricação",
    industryOther: "Outro",
    country: "País de operação",
    countryPlaceholder: "Ex.: Brasil",
    businessDescription: "Qual é a atividade?",
    businessDescriptionPlaceholder:
      "Ex.: venda de artigos de pesca em loja física e online",
    invalidBusinessName: "Digite o nome do negócio."
  },
  fr: {
    businessName: "Nom de l’entreprise",
    businessNamePlaceholder: "Ex. : Global Pêche",
    industry: "Activité de l’entreprise",
    industryRetail: "Commerce",
    industryRestaurant: "Restaurant / restauration",
    industryServices: "Services",
    industryWholesale: "Grossiste / distribution",
    industryEcommerce: "Ecommerce",
    industryIndustry: "Industrie / fabrication",
    industryOther: "Autre",
    country: "Pays d’activité",
    countryPlaceholder: "Ex. : France",
    businessDescription: "Que fait l’entreprise ?",
    businessDescriptionPlaceholder:
      "Ex. : vente d’articles de pêche en magasin et en ligne",
    invalidBusinessName: "Saisissez le nom de l’entreprise."
  },
  de: {
    businessName: "Unternehmensname",
    businessNamePlaceholder: "Beispiel: Global Angeln",
    industry: "Geschäftstätigkeit",
    industryRetail: "Einzelhandel",
    industryRestaurant: "Restaurant / Gastronomie",
    industryServices: "Dienstleistungen",
    industryWholesale: "Großhandel / Vertrieb",
    industryEcommerce: "Ecommerce",
    industryIndustry: "Industrie / Fertigung",
    industryOther: "Andere",
    country: "Betriebsland",
    countryPlaceholder: "Beispiel: Deutschland",
    businessDescription: "Was macht das Unternehmen?",
    businessDescriptionPlaceholder:
      "Beispiel: Angelbedarf im Laden und online",
    invalidBusinessName: "Gib den Unternehmensnamen ein."
  }
};

export function AuthScreen({
  dark,
  language,
  currency,
  onToggleTheme,
  onLanguageChange,
  onCurrencyChange,
  onAuthenticated
}: AuthScreenProps) {
  const labels = copy[language];
  const signupLabels = signupExtra[language];
  const configured = useMemo(() => isSupabaseConfigured(), []);
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState<BusinessTypeValue>("retail");
  const [country, setCountry] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [email, setEmail] = useState(() =>
    isSupabaseConfigured() ? "" : "demo@globalstock.local"
  );
  const [password, setPassword] = useState(() =>
    isSupabaseConfigured() ? "" : "GlobalStock2026!"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [introComplete, setIntroComplete] = useState(false);
  const [brandVisible, setBrandVisible] = useState(false);

  useEffect(() => {
    const brandDelay = reduceMotion ? 80 : 2350;
    const completeDelay = reduceMotion ? 950 : 6200;

    const brandTimer = window.setTimeout(
      () => setBrandVisible(true),
      brandDelay
    );
    const completeTimer = window.setTimeout(
      () => setIntroComplete(true),
      completeDelay
    );

    return () => {
      window.clearTimeout(brandTimer);
      window.clearTimeout(completeTimer);
    };
  }, [reduceMotion]);

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setShowPassword(false);
  }

  function persistBusinessProfile() {
    localStorage.setItem(
      "global-stock-business-name",
      businessName.trim()
    );
    localStorage.setItem("global-stock-business-type", industry);
    localStorage.setItem(
      "global-stock-business-country",
      country.trim()
    );
    localStorage.setItem(
      "global-stock-business-description",
      businessDescription.trim()
    );
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

    if (mode === "signup" && businessName.trim().length < 2) {
      setError(signupLabels.invalidBusinessName);
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
        if (mode === "signup") persistBusinessProfile();
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
          data: {
            app: "global_stock",
            full_name: name.trim(),
            business_name: businessName.trim(),
            industry,
            country: country.trim(),
            business_description: businessDescription.trim(),
            default_currency: currency,
            language
          }
        }
      });

      if (authError) throw authError;

      persistBusinessProfile();

      if (data.session) {
        onAuthenticated();
      } else {
        setMode("signin");
        setError(labels.accountCreated);
      }
    } catch {
      setError(labels.authError);
    } finally {
      setPending(false);
    }
  }

  async function signInWithGoogle() {
    setError("");
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError(labels.oauthSetup);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });

    if (authError) setError(labels.authError);
  }

  const surfaceClass = dark
    ? "border-white/12 bg-black/[0.78] text-white shadow-[0_38px_120px_rgba(0,0,0,.62)]"
    : "border-black/10 bg-white/[0.96] text-[#111114] shadow-[0_32px_90px_rgba(0,0,0,.26)]";

  const mutedClass = dark ? "text-white/65" : "text-[#5F6068]";
  const fieldClass = dark
    ? "border-white/12 bg-white/[0.07] text-white placeholder:text-white/35 focus:bg-white/[0.10]"
    : "border-black/12 bg-white text-[#111114] placeholder:text-[#8A8B91] shadow-[0_1px_0_rgba(0,0,0,.03)] focus:bg-white";
  const iconMutedClass = dark ? "text-white/48" : "text-[#6E7078]";

  return (
    <main className="relative h-[100dvh] min-h-[100svh] overflow-hidden bg-black">
      <AuthScene active={!introComplete} panelVisible={introComplete} />

      <AnimatePresence mode="wait">
        {!introComplete ? (
          <motion.section
            key="brand-intro"
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6 text-white"
            exit={{ opacity: 0, transform: "scale(1.02)" }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            <AnimatePresence>
              {brandVisible && (
                <motion.div
                  initial={{
                    opacity: 0,
                    transform: "translate3d(0,16px,0) scale(.95)"
                  }}
                  animate={{
                    opacity: 1,
                    transform: "translate3d(0,0,0) scale(1)"
                  }}
                  transition={{
                    duration: 0.3,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                  className="text-center"
                >
                  <motion.div
                    initial={{
                      opacity: 0,
                      transform: "scale(.94) rotate(6deg)"
                    }}
                    animate={{
                      opacity: 1,
                      transform: "scale(1) rotate(0deg)"
                    }}
                    transition={{
                      duration: 0.28,
                      delay: 0.08,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    className="mx-auto grid h-24 w-24 place-items-center rounded-[30px] border border-white/10 bg-black/45 shadow-[0_24px_72px_rgba(143,0,0,.32)] backdrop-blur-md"
                  >
                    <Logo className="h-16 w-16" />
                  </motion.div>

                  <motion.div
                    initial={{
                      opacity: 0,
                      transform: "translate3d(0,8px,0) scaleX(.96)"
                    }}
                    animate={{
                      opacity: 1,
                      transform: "translate3d(0,0,0) scaleX(1)"
                    }}
                    transition={{
                      duration: 0.3,
                      delay: 0.16,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    className="mt-7 origin-center text-[clamp(2.55rem,7vw,6.4rem)] font-semibold leading-none tracking-[-0.045em]"
                  >
                    GLOBAL STOCK
                  </motion.div>

                  <motion.p
                    key={language}
                    initial={{
                      opacity: 0,
                      transform: "translate3d(0,6px,0)"
                    }}
                    animate={{
                      opacity: 1,
                      transform: "translate3d(0,0,0)"
                    }}
                    transition={{
                      duration: 0.24,
                      delay: 0.42,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/58 sm:text-base"
                  >
                    {labels.intro}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.95 }}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-red-500/15 bg-red-950/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-red-200/75"
                  >
                    <Zap size={12} />
                    {labels.network}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        ) : (
          <motion.section
            key="auth-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.32 }}
            className="absolute inset-0 z-20 overflow-y-auto overscroll-contain px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] sm:px-6 lg:px-8 xl:px-12"
          >
            <div className="mx-auto flex min-h-full w-full max-w-[1440px] items-center justify-center lg:justify-start">
            <motion.div
              key={dark ? "dark-auth" : "light-auth"}
              initial={{
                opacity: 0,
                transform: "translate3d(0,18px,0) scale(.985)"
              }}
              animate={{
                opacity: 1,
                transform: "translate3d(0,0,0) scale(1)"
              }}
              transition={{
                duration: 0.28,
                ease: [0.23, 1, 0.32, 1]
              }}
              className={`relative mx-auto my-auto w-full max-w-[460px] overflow-visible rounded-[26px] border p-4 backdrop-blur-[12px] sm:rounded-[28px] sm:p-5 sm:backdrop-blur-[16px] lg:mx-0 lg:max-w-[430px] xl:max-w-[440px] ${surfaceClass}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <Logo withWordmark />
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full border transition active:scale-[.97] " +
                    (dark
                      ? "border-white/12 bg-white/[0.07] text-white hover:bg-white/[0.12]"
                      : "border-black/10 bg-[#F5F5F7] text-[#111114] hover:bg-[#ECECEF]")
                  }
                  aria-label={labels.theme}
                >
                  {dark ? <Sun size={17} /> : <Moon size={17} />}
                </button>
              </div>

              <div className="mb-4">
                <GlobalPreferences
                  language={language}
                  currency={currency}
                  onLanguageChange={onLanguageChange}
                  onCurrencyChange={onCurrencyChange}
                />
              </div>

              <div
                className={
                  "mb-5 grid grid-cols-2 rounded-2xl border p-1 " +
                  (dark
                    ? "border-white/10 bg-white/[0.05]"
                    : "border-black/10 bg-[#F2F2F4]")
                }
              >
                {(["signin", "signup"] as const).map((item) => {
                  const active = mode === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => selectMode(item)}
                      aria-pressed={active}
                      className={
                        "relative min-h-10 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors duration-150 " +
                        (active
                          ? "bg-[#8F0000] text-white shadow-[0_8px_22px_rgba(143,0,0,.22)]"
                          : dark
                            ? "text-white/58 hover:text-white"
                            : "text-[#5F6068] hover:text-[#111114]")
                      }
                    >
                      <span>
                        {item === "signin" ? labels.signIn : labels.signUp}
                      </span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${mode}-${language}`}
                  initial={{
                    opacity: 0,
                    transform:
                      mode === "signup"
                        ? "translate3d(12px,0,0)"
                        : "translate3d(-12px,0,0)"
                  }}
                  animate={{
                    opacity: 1,
                    transform: "translate3d(0,0,0)"
                  }}
                  exit={{
                    opacity: 0,
                    transform:
                      mode === "signup"
                        ? "translate3d(-8px,0,0)"
                        : "translate3d(8px,0,0)"
                  }}
                  transition={{
                    duration: 0.18,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                >
                  <div className="mb-5">
                    <div className={`mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] ${dark ? "text-[#FF3B47]" : "text-[#8F0000]"}`}>
                      <Sparkles size={13} />
                      {labels.ready}
                    </div>
                    <h1 className={`text-[1.7rem] font-semibold leading-tight tracking-[-0.045em] sm:text-[1.85rem] ${dark ? "text-white" : "text-[#111114]"}`}>
                      {mode === "signin"
                        ? labels.signInTitle
                        : labels.signUpTitle}
                    </h1>
                    <p className={`mt-1.5 text-[13px] leading-5 ${mutedClass}`}>
                      {mode === "signin"
                        ? labels.signInDescription
                        : labels.signUpDescription}
                    </p>
                  </div>

                  <form onSubmit={submit} className="space-y-3">
                    {mode === "signup" && (
                      <div className="grid gap-3 rounded-[22px] border border-[var(--apex-border)] bg-[var(--apex-surface-strong)]/45 p-3.5">
                        <label className="block">
                          <span className={`mb-2 block text-xs font-semibold ${mutedClass}`}>
                            {signupLabels.businessName}
                          </span>
                          <div className="relative">
                            <Building2
                              size={17}
                              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${iconMutedClass}`}
                            />
                            <input
                              value={businessName}
                              onChange={(event) => setBusinessName(event.target.value)}
                              className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-[13px] outline-none transition focus:border-[#8F0000] focus:ring-4 focus:ring-[#8F0000]/10 ${fieldClass}`}
                              placeholder={signupLabels.businessNamePlaceholder}
                              autoComplete="organization"
                            />
                          </div>
                        </label>

                        <label className="block">
                          <span className={`mb-2 block text-xs font-semibold ${mutedClass}`}>
                            {signupLabels.industry}
                          </span>
                          <BusinessTypePicker
                            language={language}
                            value={industry}
                            onChange={setIndustry}
                          />
                        </label>

                        <label className="block">
                          <span className={`mb-2 block text-xs font-semibold ${mutedClass}`}>
                            {signupLabels.country}
                          </span>
                          <div className="relative">
                            <MapPin
                              size={17}
                              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${iconMutedClass}`}
                            />
                            <input
                              value={country}
                              onChange={(event) => setCountry(event.target.value)}
                              className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-[13px] outline-none transition focus:border-[#8F0000] focus:ring-4 focus:ring-[#8F0000]/10 ${fieldClass}`}
                              placeholder={signupLabels.countryPlaceholder}
                              autoComplete="country-name"
                            />
                          </div>
                        </label>

                        <label className="block">
                          <span className={`mb-2 block text-xs font-semibold ${mutedClass}`}>
                            {signupLabels.businessDescription}
                          </span>
                          <textarea
                            value={businessDescription}
                            onChange={(event) => setBusinessDescription(event.target.value)}
                            rows={2}
                            className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-[#8F0000] focus:ring-4 focus:ring-[#8F0000]/10 ${fieldClass}`}
                            placeholder={signupLabels.businessDescriptionPlaceholder}
                          />
                        </label>
                      </div>
                    )}

                    {mode === "signup" && (
                      <label className="block">
                        <span className={`mb-2 block text-xs font-semibold ${mutedClass}`}>
                          {labels.name}
                        </span>
                        <div className="relative">
                          <UserRound
                            size={17}
                            className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${iconMutedClass}`}
                          />
                          <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-[13px] outline-none transition focus:border-[#8F0000] focus:ring-4 focus:ring-[#8F0000]/10 ${fieldClass}`}
                            placeholder={labels.namePlaceholder}
                            autoComplete="name"
                          />
                        </div>
                      </label>
                    )}

                    <label className="block">
                      <span className={`mb-2 block text-xs font-semibold ${mutedClass}`}>
                        {labels.email}
                      </span>
                      <div className="relative">
                        <Mail
                          size={17}
                          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${iconMutedClass}`}
                        />
                        <input
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-[13px] outline-none transition focus:border-[#8F0000] focus:ring-4 focus:ring-[#8F0000]/10 ${fieldClass}`}
                          placeholder={labels.emailPlaceholder}
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className={`mb-2 block text-xs font-semibold ${mutedClass}`}>
                        {labels.password}
                      </span>
                      <div className="relative">
                        <LockKeyhole
                          size={17}
                          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${iconMutedClass}`}
                        />
                        <input
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className={`w-full rounded-2xl border py-3 pl-11 pr-12 text-[13px] outline-none transition focus:border-[#8F0000] focus:ring-4 focus:ring-[#8F0000]/10 ${fieldClass}`}
                          placeholder={labels.passwordPlaceholder}
                          type={showPassword ? "text" : "password"}
                          autoComplete={
                            mode === "signin"
                              ? "current-password"
                              : "new-password"
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className={`absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full transition ${mutedClass}`}
                          aria-label={
                            showPassword
                              ? labels.hidePassword
                              : labels.showPassword
                          }
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </label>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-600 dark:text-red-100"
                      >
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={pending}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_14px_42px_rgba(143,0,0,.28)] transition-colors duration-150 hover:bg-[#a40000] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pending ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <ArrowRight size={17} />
                      )}
                      {mode === "signin" ? labels.enter : labels.create}
                    </button>

                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className={
                        "w-full rounded-2xl border px-5 py-3 text-[13px] font-semibold transition active:scale-[.99] " +
                        (dark
                          ? "border-white/12 bg-white/[0.06] text-white hover:bg-white/[0.11]"
                          : "border-black/10 bg-[#F5F5F7] text-[#111114] hover:bg-[#ECECEF]")
                      }
                    >
                      {labels.google}
                    </button>
                  </form>
                </motion.div>
              </AnimatePresence>

              <p className={`mt-4 text-center text-[9px] leading-4 ${mutedClass}`}>
                {configured ? labels.configured : labels.demo}
              </p>
            </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}