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
import { FormEvent, useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { LOGIN_ATTEMPT_LIMIT, LOGIN_ATTEMPT_STORAGE_KEY, addFailedLoginAttempt,
  classifyAuthFailure, emptyLoginAttemptState, loginLockSeconds,
  readLoginAttemptState } from "@/lib/auth-feedback";
import type { LanguageCode } from "./GlobalPreferences";
import { Logo } from "./Logo";
import { GoogleIdentityButton } from "./GoogleIdentityButton";
import { AuthSplitMotion } from "./AuthSplitMotion";
import { AuthLanguagePicker } from "./AuthLanguagePicker";
import { AuthTurnstile } from "./AuthTurnstile";
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
    configured: string;
    demo: string;
    invalidEmail: string;
    invalidPassword: string;
    invalidName: string;
    accountCreated: string;
    authError: string;
    invalidCredentials: string;
    unconfirmedEmail: string;
    manyAttempts: string;
    existingAccount: string;
    loginLocked: string;
    retryIn: string;
    remainingAttempts: string;
    captchaPending: string;
    captchaError: string;
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
    configured: "Autenticación protegida por Supabase Auth.",
    demo: "Modo demo para pruebas. Supabase habilita cuentas y datos reales.",
    invalidEmail: "Ingresá un correo electrónico válido.",
    invalidPassword: "La contraseña debe tener al menos 8 caracteres.",
    invalidName: "Ingresá tu nombre.",
    accountCreated:
      "Revisá tu correo si recibiste un enlace de confirmación. Si ese correo ya tiene una cuenta, iniciá sesión o recuperá tu contraseña.",
    authError: "No se pudo completar la autenticación. Revisá tu conexión e intentá nuevamente.",
    invalidCredentials: "Correo electrónico o contraseña incorrectos.",
    unconfirmedEmail: "Confirmá tu correo electrónico antes de iniciar sesión. Revisá también la carpeta de spam.",
    manyAttempts: "Demasiadas solicitudes. Esperá unos minutos antes de intentarlo otra vez.",
    existingAccount: "Si ese correo ya tiene una cuenta, iniciá sesión o recuperá tu contraseña.",
    loginLocked: "Por seguridad, el acceso se pausó temporalmente. Volvé a intentarlo en",
    retryIn: "Reintentar en",
    remainingAttempts: "Intentos restantes en este navegador:",
    captchaPending: "Esperá a que finalice la verificación de seguridad.",
    captchaError: "No se pudo completar la verificación. Revisá tu conexión e intentá otra vez.",
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
      "Check your inbox for a confirmation link. If you already have an account, sign in or reset your password.",
    authError: "Could not complete authentication. Check your connection and try again.",
    invalidCredentials: "Incorrect email or password.",
    unconfirmedEmail: "Confirm your email address before signing in. Check your spam folder as well.",
    manyAttempts: "Too many requests. Please wait a few minutes before trying again.",
    existingAccount: "If you already have an account with this email, sign in or reset your password.",
    loginLocked: "For security, sign-in is temporarily paused. Try again in",
    retryIn: "Try again in",
    remainingAttempts: "Attempts remaining in this browser:",
    captchaPending: "Please complete the security verification.",
    captchaError: "Security verification failed. Check your connection and try again.",
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
      "Verifique sua caixa de entrada. Se já tiver uma conta, entre ou redefina a senha.",
    authError: "Não foi possível entrar. Verifique sua conexão e tente novamente.",
    invalidCredentials: "E-mail ou senha incorretos.",
    unconfirmedEmail: "Confirme seu e-mail antes de entrar. Verifique também a pasta de spam.",
    manyAttempts: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
    existingAccount: "Se este e-mail já tiver uma conta, entre ou redefina sua senha.",
    loginLocked: "Por segurança, o acesso foi pausado temporariamente. Tente novamente em",
    retryIn: "Tentar novamente em",
    remainingAttempts: "Tentativas restantes neste navegador:",
    captchaPending: "Conclua a verificação de segurança.",
    captchaError: "Não foi possível verificar. Confira sua conexão e tente novamente.",
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
      "Consultez votre boîte de réception. Si vous avez déjà un compte, connectez-vous ou réinitialisez votre mot de passe.",
    authError: "Connexion impossible. Vérifiez votre connexion et réessayez.",
    invalidCredentials: "E-mail ou mot de passe incorrect.",
    unconfirmedEmail: "Confirmez votre adresse e-mail avant de vous connecter. Vérifiez les indésirables.",
    manyAttempts: "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
    existingAccount: "Si cette adresse possède déjà un compte, connectez-vous ou réinitialisez votre mot de passe.",
    loginLocked: "Pour votre sécurité, la connexion est temporairement suspendue. Réessayez dans",
    retryIn: "Réessayer dans",
    remainingAttempts: "Tentatives restantes dans ce navigateur :",
    captchaPending: "Terminez la vérification de sécurité.",
    captchaError: "La vérification a échoué. Vérifiez votre connexion et réessayez.",
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
      "Prüfe dein Postfach auf einen Bestätigungslink. Falls du bereits ein Konto hast, melde dich an oder setze dein Passwort zurück.",
    authError: "Anmeldung fehlgeschlagen. Überprüfe deine Verbindung und versuche es erneut.",
    invalidCredentials: "E-Mail-Adresse oder Passwort falsch.",
    unconfirmedEmail: "Bestätige zuerst deine E-Mail-Adresse. Prüfe auch den Spamordner.",
    manyAttempts: "Zu viele Versuche. Warte einige Minuten und versuche es erneut.",
    existingAccount: "Falls bereits ein Konto mit dieser E-Mail besteht, melde dich an oder setze dein Passwort zurück.",
    loginLocked: "Die Anmeldung ist aus Sicherheitsgründen vorübergehend pausiert. Versuche es erneut in",
    retryIn: "Erneut versuchen in",
    remainingAttempts: "Verbleibende Versuche in diesem Browser:",
    captchaPending: "Bitte schließe die Sicherheitsprüfung ab.",
    captchaError: "Sicherheitsprüfung fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut.",
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
  // Keep the widget optional until Supabase Auth CAPTCHA is actually enabled.
  // A configured site key alone must not block beta users (especially Expo Go).
  const siteKey = process.env.NEXT_PUBLIC_AUTH_CAPTCHA_ENABLED === "true"
    ? (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "")
    : "";
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [attemptState, setAttemptState] = useState(emptyLoginAttemptState);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const pendingRef = useRef(false);

  useEffect(() => {
    const update = () => {
      setCurrentTime(Date.now());
      try {
        setAttemptState(readLoginAttemptState(window.localStorage.getItem(LOGIN_ATTEMPT_STORAGE_KEY)));
      } catch { /* Browsers may block storage in private mode. */ }
    };
    update();
    const timer = window.setInterval(update, 1000);
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOGIN_ATTEMPT_STORAGE_KEY) update();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const remainingLockSeconds = loginLockSeconds(attemptState, currentTime);
  const lockTimeText = `${Math.ceil(remainingLockSeconds / 60)} min`;

  function trackInvalidLogin() {
    const now = Date.now();
    let current = attemptState;
    try { current = readLoginAttemptState(window.localStorage.getItem(LOGIN_ATTEMPT_STORAGE_KEY), now); }
    catch { /* Continue with in-memory state. */ }
    const next = addFailedLoginAttempt(current, now);
    setAttemptState(next);
    setCurrentTime(now);
    try { window.localStorage.setItem(LOGIN_ATTEMPT_STORAGE_KEY, JSON.stringify(next)); }
    catch { /* Supabase still enforces its server-side limits. */ }
    return next;
  }

  function resetInvalidLogins() {
    setAttemptState(emptyLoginAttemptState());
    try { window.localStorage.removeItem(LOGIN_ATTEMPT_STORAGE_KEY); }
    catch { /* no-op */ }
  }

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    if (nextMode === "signup") { setAdultConsent(false); }
    setError("");
    setNotice("");
    setShowPassword(false);
    setCaptchaToken(null);
    setCaptchaReset(value => value + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();

    if (mode === "signin") {
      const now = Date.now();
      let current = attemptState;
      try { current = readLoginAttemptState(window.localStorage.getItem(LOGIN_ATTEMPT_STORAGE_KEY), now); }
      catch { /* no-op */ }
      if (loginLockSeconds(current, now) > 0) {
        setAttemptState(current);
        setCurrentTime(now);
        setError(`${labels.loginLocked} ${Math.ceil(loginLockSeconds(current, now) / 60)} min.`);
        return;
      }
    }

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

    if (siteKey && !captchaToken) {
      setError(labels.captchaPending);
      return;
    }

    pendingRef.current = true;
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
          password,
          options: siteKey ? { captchaToken: captchaToken! } : undefined
        });

        if (authError) {
          const reason = classifyAuthFailure(authError);
          if (reason === "invalid") {
            const next = trackInvalidLogin();
            if (loginLockSeconds(next, Date.now()) > 0) {
              setError(`${labels.loginLocked} 15 min.`);
            } else {
              setError(`${labels.invalidCredentials} ${labels.remainingAttempts} ${LOGIN_ATTEMPT_LIMIT - next.failed}.`);
            }
          } else if (reason === "unconfirmed") {
            setError(labels.unconfirmedEmail);
          } else if (reason === "rate_limited") {
            setError(labels.manyAttempts);
          } else {
            setError(labels.authError);
          }
          return;
        }

        resetInvalidLogins();

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
          ...(siteKey ? { captchaToken: captchaToken! } : {}),
          data: {
            app: "global_stock",
            full_name: name.trim(),
            // Step 2 is completed after the user has a verified session.
            global_stock_onboarding: "pending",
            global_stock_selected_plan: "pending",
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

      if (authError) {
        const reason = classifyAuthFailure(authError);
        setError(reason === "duplicate" ? labels.existingAccount
          : reason === "rate_limited" ? labels.manyAttempts
          : labels.authError);
        return;
      }

      if (data.session) {
        onAuthenticated();
      } else {
        setMode("signin");
        setNotice(labels.accountCreated);
      }
    } catch {
      setError(labels.authError);
    } finally {
      if (siteKey) {
        setCaptchaToken(null);
        setCaptchaReset(value => value + 1);
      }
      pendingRef.current = false;
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
            <div data-auth-theme={dark ? "dark" : "light"} className="gs-auth-reference-form w-full min-w-0 px-[clamp(18px,4.2vw,72px)] py-2 lg:px-[clamp(25px,4.3vw,72px)]">
              <div className="gs-auth-brand-row mb-8 flex items-center justify-between gap-3">
                <Logo withWordmark className="gs-auth-reference-logo [&>img]:!h-11 [&>img]:!w-11 [&>div>div]:!text-[16px]" />
                <div data-testid="auth-header-preferences" className={`flex shrink-0 items-center gap-1.5 ${mode === "signin" ? "lg:mr-[clamp(84px,7.7vw,112px)]" : ""}`}>
                  <AuthLanguagePicker language={language} dark={dark} onChange={onLanguageChange} />
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
                  <div className="mb-7">
                    <h1 className="text-[clamp(1.55rem,2.25vw,2.05rem)] font-semibold tracking-[-.048em]">
{mode === "signin" ? labels.signIn : labels.signUp}
                    </h1>
                    <div aria-hidden="true" className="mt-2 h-[2px] w-7 rounded-full bg-[#8F0000]"/>
                  </div>
                  <form onSubmit={submit} className="gs-auth-reference-fields space-y-[18px]">
                    {mode === "signup" && (
                      <label className="block">
                        <span className={`mb-1 block text-[12px] font-medium ${muted}`}>{micro.username}</span>
                        <span className="relative block">
                          <UserRound className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 ${icons}`} size={15}/>
                          <input
                            value={name} onChange={event => setName(event.target.value)}
                            type="text" autoComplete="name" required minLength={2}
                            placeholder={labels.namePlaceholder}
                            className={`h-11 w-full border-0 border-b bg-transparent pr-8 text-[14px] outline-none transition-colors ${fieldStyle}`}/>
                        </span>
                      </label>
                    )}
                    <label className="block">
                      <span className={`mb-1 block text-[12px] font-medium ${muted}`}>{labels.email}</span>
                      <span className="relative block">
                        <Mail className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 ${icons}`} size={15}/>
                        <input value={email} onChange={event => setEmail(event.target.value)}
                          type="email" inputMode="email" autoComplete="email" required
                          placeholder={labels.emailPlaceholder}
                          className={`h-11 w-full border-0 border-b bg-transparent pr-8 text-[14px] outline-none transition-colors ${fieldStyle}`}/>
                      </span>
                    </label>
                    <div className="block">
                      <label htmlFor="global-stock-auth-password" className={`mb-1 block text-[12px] font-medium ${muted}`}>{labels.password}</label>
                      <span className="relative block">
                        <input id="global-stock-auth-password" value={password} onChange={event => setPassword(event.target.value)}
                          type={showPassword ? "text" : "password"}
                          autoComplete={mode === "signin" ? "current-password" : "new-password"}
                          required minLength={8}
                          placeholder={labels.passwordPlaceholder}
                          data-testid="auth-password-input"
                          className={`h-11 w-full border-0 border-b bg-transparent pr-12 text-[14px] outline-none transition-colors ${fieldStyle}`}/>
                        <button type="button"
                          data-testid="auth-password-visibility"
                          onClick={(event) => {
                            event.preventDefault();
                            setShowPassword(previous => !previous);
                          }}
                          aria-pressed={showPassword}
                          aria-controls="global-stock-auth-password"
                          aria-label={showPassword ? labels.hidePassword : labels.showPassword}
                          title={showPassword ? labels.hidePassword : labels.showPassword}
                          className={`gs-auth-password-eye absolute -right-[10px] top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 touch-manipulation items-center justify-center border-0 bg-transparent p-0 text-inherit outline-none ${icons}`}>
                          {showPassword ? <EyeOff size={16} strokeWidth={1.7} aria-hidden="true"/> : <Eye size={16} strokeWidth={1.7} aria-hidden="true"/>}
                        </button>
                      </span>
                      {mode === "signup" && <span className={`mt-1 block text-[10px] ${muted}`}>{labels.invalidPassword}</span>}
                    </div>



                    {mode === "signup" && (
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox" checked={adultConsent} required
                          onChange={event => setAdultConsent(event.target.checked)}
                          aria-label="Declaro ser mayor de 18 años y aceptar los términos y la privacidad"
                          className="peer sr-only"/>
                        <span aria-hidden="true" className={`relative mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition-all duration-200 ${adultConsent ? "border-[#8F0000] bg-[#8F0000] scale-100" : dark ? "border-white/40 bg-white/5" : "border-[#A99B9D] bg-transparent"}`}>
                          <motion.span animate={{ scale: adultConsent ? 1 : 0, opacity: adultConsent ? 1 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="h-1.5 w-1.5 rounded-full bg-white"/>
                        </span>
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

                    {siteKey && (
                      <AuthTurnstile
                        key={`${mode}-${dark}`}
                        siteKey={siteKey}
                        dark={dark}
                        onToken={setCaptchaToken}
                        onUnavailable={() => setError(labels.captchaError)}
                        resetCounter={captchaReset}
                      />
                    )}
                    {error && (
                      <div role="alert" data-testid="auth-feedback-error" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] leading-4 text-[#BC1D31] dark:text-red-200">{error}</div>
                    )}
                    {notice && (
                      <div role="status" data-testid="auth-feedback-notice" className={`rounded-lg border border-[#8F0000]/25 bg-[#8F0000]/5 px-3 py-2 text-[11px] leading-4 ${dark ? "text-[#F2B8BF]" : "text-[#71242D]"}`}>{notice}</div>
                    )}

                    <button type="submit" disabled={pending || (siteKey.length > 0 && !captchaToken) || (mode === "signin" && remainingLockSeconds > 0) || (mode === "signup" && !adultConsent)}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#8F0000] px-4 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(143,0,0,.22)] transition-[background-color,box-shadow] hover:bg-[#AA101E] hover:shadow-[0_10px_26px_rgba(143,0,0,.32)] disabled:cursor-not-allowed disabled:opacity-55">
                      {pending ? <Loader2 className="animate-spin" size={16}/> : <ArrowRight size={16}/>}
                      {mode === "signin" && remainingLockSeconds > 0
                        ? `${labels.retryIn} ${lockTimeText}`
                        : mode === "signin" ? labels.signIn : labels.signUp}
                    </button>
                  </form>

                  {mode === "signin" && (
                    <div className="gs-auth-google mt-3">
                      <GoogleIdentityButton
                        dark={dark} label={labels.google} language={language} currency={currency}
                        onAuthenticated={() => onAuthenticated()}
                        onError={() => setError(labels.authError)}
                      />
                    </div>
                  )}

                  <p className={`mt-4 text-center text-[12px] leading-5 ${muted}`}>
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
