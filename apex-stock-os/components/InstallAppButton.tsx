"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, Smartphone, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppButton() {
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
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

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
        App instalada
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

    if (isIos) {
      setShowIosHelp(true);
      return;
    }

    setShowIosHelp(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 text-xs font-semibold transition hover:scale-[1.02]"
      >
        <Download size={15} />
        <span className="hidden sm:inline">Instalar app</span>
      </button>

      <AnimatePresence>
        {showIosHelp && (
          <motion.div
            className="fixed inset-0 z-[80] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setShowIosHelp(false);
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
                  aria-label="Cerrar"
                >
                  <X size={15} />
                </button>
              </div>

              <h3 className="mt-5 text-xl font-semibold tracking-[-0.035em]">
                Instalá Global Stock
              </h3>

              {isIos ? (
                <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--apex-muted)]">
                  <p>
                    En iPhone o iPad abrí esta página en Safari, tocá{" "}
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--apex-text)]">
                      Compartir <Share size={14} />
                    </span>{" "}
                    y elegí <strong>Añadir a pantalla de inicio</strong>.
                  </p>
                  <p>
                    Después Global Stock se abre desde su propio icono, sin la barra del navegador.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[var(--apex-muted)]">
                  Tu navegador todavía no ofreció la instalación automática. En Chrome o Edge abrí el menú del navegador y elegí <strong>Instalar Global Stock</strong>.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
