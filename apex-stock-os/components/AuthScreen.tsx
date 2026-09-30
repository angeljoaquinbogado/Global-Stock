"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Moon,
  Sparkles,
  Sun,
  UserRound,
  Zap
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { Logo } from "./Logo";

const AuthScene = dynamic(
  () => import("./AuthScene").then((module) => module.AuthScene),
  { ssr: false }
);

type AuthScreenProps = {
  dark: boolean;
  onToggleTheme: () => void;
  onAuthenticated: () => void;
};

type Mode = "signin" | "signup";

const spring = { type: "spring", stiffness: 300, damping: 30 } as const;

export function AuthScreen({
  dark,
  onToggleTheme,
  onAuthenticated
}: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@globalstock.local");
  const [password, setPassword] = useState("GlobalStock2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [introComplete, setIntroComplete] = useState(false);
  const [brandVisible, setBrandVisible] = useState(false);

  const configured = useMemo(() => isSupabaseConfigured(), []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      setBrandVisible(true);
      setIntroComplete(true);
      return;
    }

    const brandTimer = window.setTimeout(() => setBrandVisible(true), 1050);
    const completeTimer = window.setTimeout(() => setIntroComplete(true), 5200);

    return () => {
      window.clearTimeout(brandTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  function finishIntro() {
    setBrandVisible(true);
    setIntroComplete(true);
  }

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setShowPassword(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Ingresá un correo electrónico válido.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (mode === "signup" && name.trim().length < 2) {
      setError("Ingresá tu nombre.");
      return;
    }

    setPending(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        onAuthenticated();
        return;
      }

      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (authError) throw authError;
        onAuthenticated();
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: name.trim() }
        }
      });

      if (authError) throw authError;

      if (data.session) {
        onAuthenticated();
      } else {
        setMode("signin");
        setError(
          "Cuenta creada. Revisá tu correo para confirmar el acceso antes de iniciar sesión."
        );
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo completar la autenticación."
      );
    } finally {
      setPending(false);
    }
  }

  async function signInWithGoogle() {
    setError("");
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError(
        "OAuth requiere configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });

    if (authError) setError(authError.message);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <AuthScene />

      <AnimatePresence>
        {!introComplete && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.2, duration: 0.45 }}
            type="button"
            onClick={finishIntro}
            className="fixed right-5 top-5 z-40 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[11px] font-semibold text-white/60 backdrop-blur-xl transition hover:bg-black/50 hover:text-white"
          >
            Saltar intro
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!introComplete ? (
          <motion.section
            key="brand-intro"
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6"
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence>
              {brandVisible && (
                <motion.div
                  initial={{ opacity: 0, y: 22, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={spring}
                  className="text-center"
                >
                  <motion.div
                    initial={{ rotateY: -50, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ ...spring, delay: 0.1 }}
                    className="mx-auto grid h-24 w-24 place-items-center rounded-[30px] border border-white/10 bg-black/35 shadow-[0_28px_100px_rgba(143,0,0,.42)] backdrop-blur-xl"
                  >
                    <Logo className="h-16 w-16" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, letterSpacing: "0.35em" }}
                    animate={{ opacity: 1, letterSpacing: "-0.045em" }}
                    transition={{ duration: 1.05, delay: 0.22 }}
                    className="mt-7 text-[clamp(2.8rem,7vw,6.4rem)] font-semibold leading-none"
                  >
                    GLOBAL STOCK
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.55 }}
                    className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/58 sm:text-base"
                  >
                    Tu negocio conectado al mundo. Stock, ventas, rentabilidad e
                    inteligencia en una sola plataforma.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.95 }}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-red-500/15 bg-red-950/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-red-200/75"
                  >
                    <Zap size={12} />
                    Global network online
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
            transition={{ duration: 0.7 }}
            className="relative z-20 flex min-h-screen items-center justify-center px-4 py-5 lg:justify-end lg:px-10 xl:px-16"
          >
            <motion.div
              initial={{ opacity: 0, x: 44, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={spring}
              className="apex-glass w-full max-w-[510px] rounded-[34px] border-white/10 bg-black/50 p-5 shadow-[0_38px_120px_rgba(0,0,0,.58)] sm:p-7"
            >
              <div className="mb-6 flex items-center justify-between">
                <Logo withWordmark />
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:scale-[1.02] hover:bg-white/10"
                  aria-label="Cambiar tema"
                >
                  {dark ? <Sun size={17} /> : <Moon size={17} />}
                </button>
              </div>

              <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.05] p-1">
                {(["signin", "signup"] as const).map((item) => {
                  const active = mode === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => selectMode(item)}
                      aria-pressed={active}
                      className={
                        "relative min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors " +
                        (active
                          ? "text-white"
                          : "text-white/50 hover:text-white/90")
                      }
                    >
                      {active && (
                        <motion.span
                          layoutId="auth-tab"
                          transition={spring}
                          className="absolute inset-0 rounded-xl bg-[#8F0000] shadow-[0_10px_30px_rgba(143,0,0,.28)]"
                        />
                      )}
                      <span className="relative z-10">
                        {item === "signin" ? "Iniciar sesión" : "Crear cuenta"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === "signup" ? 18 : -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === "signup" ? -12 : 12 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#dca8a8]">
                      <Sparkles size={13} />
                      Global Intelligence ready
                    </div>
                    <h1 className="text-3xl font-semibold tracking-[-0.045em]">
                      {mode === "signin"
                        ? "Volvé al control."
                        : "Creá tu cuenta."}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-white/50">
                      {mode === "signin"
                        ? "Entrá a tu operación global desde cualquier dispositivo."
                        : "Empezá gratis y configurá tu negocio, moneda y stock en pocos pasos."}
                    </p>
                  </div>

                  <form onSubmit={submit} className="space-y-4">
                    {mode === "signup" && (
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-white/70">
                          Nombre
                        </span>
                        <div className="relative">
                          <UserRound
                            size={17}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                          />
                          <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="apex-input bg-white/[0.06] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30"
                            placeholder="Tu nombre"
                            autoComplete="name"
                          />
                        </div>
                      </label>
                    )}

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-white/70">
                        Correo electrónico
                      </span>
                      <div className="relative">
                        <Mail
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                        />
                        <input
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="apex-input bg-white/[0.06] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30"
                          placeholder="nombre@empresa.com"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-white/70">
                        Contraseña
                      </span>
                      <div className="relative">
                        <LockKeyhole
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                        />
                        <input
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="apex-input bg-white/[0.06] py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-white/30"
                          placeholder="Mínimo 8 caracteres"
                          type={showPassword ? "text" : "password"}
                          autoComplete={
                            mode === "signin" ? "current-password" : "new-password"
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </label>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-100"
                      >
                        {error}
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.985 }}
                      transition={spring}
                      disabled={pending}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-5 py-3.5 text-sm font-semibold text-white shadow-crimson transition hover:bg-[#a40000] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pending ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <ArrowRight size={17} />
                      )}
                      {mode === "signin"
                        ? "Entrar a Global Stock"
                        : "Crear cuenta gratis"}
                    </motion.button>

                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3.5 text-sm font-semibold text-white transition hover:scale-[1.01] hover:bg-white/10"
                    >
                      Continuar con Google
                    </button>
                  </form>
                </motion.div>
              </AnimatePresence>

              <p className="mt-5 text-center text-[10px] leading-5 text-white/30">
                {configured
                  ? "Autenticación protegida por Supabase Auth."
                  : "Modo demo para pruebas. Supabase habilita cuentas y datos reales."}
              </p>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
