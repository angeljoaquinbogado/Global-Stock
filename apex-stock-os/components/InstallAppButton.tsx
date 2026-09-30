"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, Smartphone, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { LanguageCode } from "./GlobalPreferences";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

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
      "Tu navegador todavía no ofreció la instalación automática. En Chrome o Edge abrí el menú del navegador y elegí",
    browserInstall: "Instalar Global Stock"
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
      "Your browser has not offered automatic installation yet. In Chrome or Edge open the browser menu and choose",
    browserInstall: "Install Global Stock"
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
      "Seu navegador ainda não ofereceu a instalação automática. No Chrome ou Edge abra o menu e escolha",
    browserInstall: "Instalar Global Stock"
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
      "Votre navigateur n’a pas encore proposé l’installation automatique. Dans Chrome ou Edge, ouvrez le menu et choisissez",
    browserInstall: "Installer Global Stock"
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
      "Dein Browser hat die automatische Installation noch nicht angeboten. Öffne in Chrome oder Edge das Menü und wähle",
    browserInstall: "Global Stock installieren"
  }
};

export function InstallAppButton({ language }: InstallAppButtonProps) {
  const labels = copy[language];
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);

  const isIos = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const navigatorStandalone =
      "standalone" in window.navigator &&
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone
      );

    setStandalone(media.matches || navigatorStandalone);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setStandalone(true);
      setInstallPrompt(null);
      setShowIosHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone) {
    return (
      <span className="hidden rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 py-2 text-[10px] font-semibold text-[var(--apex-muted)] sm:inline-flex">
        {labels.installed}
      </span>
    );
  }

  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }

    setShowIosHelp(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="inline-flex h-10 touch-manipulation items-center gap-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 text-xs font-semibold transition active:scale-[.98]"
      >
        <Download size={15} />
        <span className="hidden sm:inline">{labels.install}</span>
      </button>

      <AnimatePresence>
        {showIosHelp && (
          <motion.div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) {
                setShowIosHelp(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="apex-glass w-full max-w-md rounded-[28px] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8F0000] text-white">
                  <Smartphone size={20} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowIosHelp(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-[var(--apex-border)]"
                  aria-label={labels.close}
                >
                  <X size={15} />
                </button>
              </div>

              <h3 className="mt-5 text-xl font-semibold tracking-[-0.035em]">
                {labels.title}
              </h3>

              {isIos ? (
                <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--apex-muted)]">
                  <p>
                    {labels.iosFirst}{" "}
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--apex-text)]">
                      {labels.share} <Share size={14} />
                    </span>{" "}
                    {labels.thenChoose} <strong>{labels.addHome}</strong>.
                  </p>
                  <p>{labels.iosSecond}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[var(--apex-muted)]">
                  {labels.browserFallback}{" "}
                  <strong>{labels.browserInstall}</strong>.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
