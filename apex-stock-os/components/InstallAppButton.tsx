"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  MoreVertical,
  Share,
  Smartphone,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  getRememberedInstallPrompt,
  PWA_INSTALL_AVAILABLE_EVENT,
  rememberInstallPrompt,
  type BeforeInstallPromptEvent
} from "@/lib/pwa-install";
import type { LanguageCode } from "./GlobalPreferences";

type InstallAppButtonProps = {
  language: LanguageCode;
};

const copy: Record<
  LanguageCode,
  {
    installed: string;
    install: string;
    title: string;
    close: string;
    iosFirst: string;
    share: string;
    addHome: string;
    thenChoose: string;
    iosSecond: string;
    browserFallback: string;
    browserInstall: string;
    ready: string;
    installNow: string;
  }
> = {
  es: {
    installed: "App instalada",
    install: "Instalar app",
    title: "Instalá Global Stock",
    close: "Cerrar",
    iosFirst: "En iPhone o iPad abrí esta página en Safari, tocá",
    share: "Compartir",
    addHome: "Añadir a pantalla de inicio",
    thenChoose: "y elegí",
    iosSecond:
      "Después Global Stock se abre desde su propio icono, sin la barra del navegador.",
    browserFallback:
      "Si Chrome o Edge todavía no muestran el diálogo automático, abrí el menú del navegador y elegí",
    browserInstall: "Instalar Global Stock",
    ready: "La instalación nativa está disponible.",
    installNow: "Instalar ahora"
  },
  en: {
    installed: "App installed",
    install: "Install app",
    title: "Install Global Stock",
    close: "Close",
    iosFirst: "On iPhone or iPad open this page in Safari, tap",
    share: "Share",
    addHome: "Add to Home Screen",
    thenChoose: "and choose",
    iosSecond:
      "Global Stock will then open from its own icon without the browser bar.",
    browserFallback:
      "If Chrome or Edge does not show the native install dialog yet, open the browser menu and choose",
    browserInstall: "Install Global Stock",
    ready: "Native installation is available.",
    installNow: "Install now"
  },
  pt: {
    installed: "App instalado",
    install: "Instalar app",
    title: "Instale o Global Stock",
    close: "Fechar",
    iosFirst: "No iPhone ou iPad abra esta página no Safari e toque em",
    share: "Compartilhar",
    addHome: "Adicionar à Tela de Início",
    thenChoose: "e escolha",
    iosSecond:
      "Depois o Global Stock abre pelo próprio ícone, sem a barra do navegador.",
    browserFallback:
      "Se o Chrome ou Edge ainda não mostrar o diálogo automático, abra o menu do navegador e escolha",
    browserInstall: "Instalar Global Stock",
    ready: "A instalação nativa está disponível.",
    installNow: "Instalar agora"
  },
  fr: {
    installed: "App installée",
    install: "Installer l’app",
    title: "Installer Global Stock",
    close: "Fermer",
    iosFirst: "Sur iPhone ou iPad, ouvrez cette page dans Safari puis touchez",
    share: "Partager",
    addHome: "Sur l’écran d’accueil",
    thenChoose: "puis choisissez",
    iosSecond:
      "Global Stock s’ouvrira ensuite depuis sa propre icône, sans la barre du navigateur.",
    browserFallback:
      "Si Chrome ou Edge n’affiche pas encore l’installation native, ouvrez le menu du navigateur et choisissez",
    browserInstall: "Installer Global Stock",
    ready: "L’installation native est disponible.",
    installNow: "Installer"
  },
  de: {
    installed: "App installiert",
    install: "App installieren",
    title: "Global Stock installieren",
    close: "Schließen",
    iosFirst: "Öffne diese Seite auf iPhone oder iPad in Safari und tippe auf",
    share: "Teilen",
    addHome: "Zum Home-Bildschirm",
    thenChoose: "und wähle",
    iosSecond:
      "Danach öffnet sich Global Stock über das eigene Symbol ohne Browserleiste.",
    browserFallback:
      "Wenn Chrome oder Edge den Installationsdialog noch nicht zeigt, öffne das Browsermenü und wähle",
    browserInstall: "Global Stock installieren",
    ready: "Die native Installation ist verfügbar.",
    installNow: "Jetzt installieren"
  }
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  const media = window.matchMedia("(display-mode: standalone)").matches;
  const navigatorStandalone =
    "standalone" in window.navigator &&
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone
    );

  return media || navigatorStandalone;
}

export function InstallAppButton({ language }: InstallAppButtonProps) {
  const labels = copy[language];
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);

  const isIos = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    setStandalone(isStandaloneMode());
    setInstallPrompt(getRememberedInstallPrompt());

    const onPromptAvailable = () => {
      setInstallPrompt(getRememberedInstallPrompt());
    };

    const onInstalled = () => {
      rememberInstallPrompt(null);
      setInstallPrompt(null);
      setStandalone(true);
      setShowHelp(false);
    };

    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => {
      setStandalone(isStandaloneMode());
    };

    window.addEventListener(
      PWA_INSTALL_AVAILABLE_EVENT,
      onPromptAvailable
    );
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener?.("change", onDisplayModeChange);

    return () => {
      window.removeEventListener(
        PWA_INSTALL_AVAILABLE_EVENT,
        onPromptAvailable
      );
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener?.("change", onDisplayModeChange);
    };
  }, []);

  useEffect(() => {
    if (!showHelp) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowHelp(false);
    };

    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onEscape);
    };
  }, [showHelp]);

  async function launchNativeInstall() {
    const prompt = installPrompt ?? getRememberedInstallPrompt();
    if (!prompt) {
      setShowHelp(true);
      return;
    }

    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;

      rememberInstallPrompt(null);
      setInstallPrompt(null);

      if (choice.outcome === "dismissed") {
        setShowHelp(true);
      }
    } catch {
      setShowHelp(true);
    }
  }

  async function install() {
    if (standalone) return;

    if (installPrompt || getRememberedInstallPrompt()) {
      await launchNativeInstall();
      return;
    }

    setShowHelp(true);
  }

  if (standalone) {
    return (
      <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 text-xs font-semibold text-emerald-500">
        <CheckCircle2 size={15} />
        <span className="hidden sm:inline">{labels.installed}</span>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void install()}
        className="gs-download-primary-action inline-flex h-11 touch-manipulation items-center gap-2 rounded-xl border border-[#8F0000] bg-[#8F0000] px-4 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(143,0,0,.2)] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-[#8F0000] hover:shadow-[0_10px_30px_rgba(143,0,0,.28)] active:scale-[.98]"
        aria-label={labels.install}
      >
        <Download size={15} />
        <span className="hidden sm:inline">{labels.install}</span>
      </button>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="fixed inset-0 z-[320] grid place-items-center overflow-y-auto bg-black/78 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) {
                setShowHelp(false);
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                transform: "translate3d(0,14px,0) scale(.98)"
              }}
              animate={{
                opacity: 1,
                transform: "translate3d(0,0,0) scale(1)"
              }}
              exit={{
                opacity: 0,
                transform: "translate3d(0,8px,0) scale(.985)"
              }}
              transition={{
                duration: 0.28,
                ease: [0.23, 1, 0.32, 1]
              }}
              className="my-auto max-h-[calc(100dvh-32px)] w-full max-w-md overflow-y-auto rounded-[28px] border border-white/10 bg-[#0B0B0D]/98 p-5 text-white shadow-[0_30px_100px_rgba(0,0,0,.65)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8F0000] text-white">
                  <Smartphone size={20} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-white/75 transition-colors duration-150 hover:bg-white/[0.08] hover:text-white"
                  aria-label={labels.close}
                >
                  <X size={15} />
                </button>
              </div>

              <h3 className="mt-5 text-xl font-semibold tracking-[-0.035em]">
                {labels.title}
              </h3>

              {installPrompt ? (
                <div className="mt-4">
                  <p className="text-sm leading-6 text-white/58">
                    {labels.ready}
                  </p>
                  <button
                    type="button"
                    onClick={() => void launchNativeInstall()}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#8F0000] bg-[#8F0000] px-4 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(143,0,0,.22)] transition hover:bg-[#8F0000]"
                  >
                    <Download size={15} />
                    {labels.installNow}
                  </button>
                </div>
              ) : isIos ? (
                <div className="mt-3 space-y-3 text-sm leading-6 text-white/58">
                  <p>
                    {labels.iosFirst}{" "}
                    <span className="inline-flex items-center gap-1 font-semibold text-white">
                      {labels.share} <Share size={14} />
                    </span>{" "}
                    {labels.thenChoose} <strong>{labels.addHome}</strong>.
                  </p>
                  <p>{labels.iosSecond}</p>
                </div>
              ) : (
                <div className="mt-3 space-y-3 text-sm leading-6 text-white/58">
                  <p>
                    {labels.browserFallback}{" "}
                    <strong>{labels.browserInstall}</strong>.
                  </p>
                  <p className="flex items-center gap-2 text-xs">
                    <MoreVertical size={15} />
                    Menú del navegador → {labels.browserInstall}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}