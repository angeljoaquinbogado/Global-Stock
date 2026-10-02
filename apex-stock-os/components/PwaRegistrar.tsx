"use client";

import { useEffect } from "react";

import {
  rememberInstallPrompt,
  type BeforeInstallPromptEvent
} from "@/lib/pwa-install";

export function PwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isSecureProduction =
      window.location.protocol === "https:" &&
      window.location.hostname !== "localhost";

    const cleanupLocalCaches = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith("global-stock-"))
            .map((key) => caches.delete(key))
        );
      }
    };

    if (!isSecureProduction) {
      void cleanupLocalCaches();
      return;
    }

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      rememberInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      rememberInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none"
        });
        await registration.update();
      } catch {
        // The web app remains usable even if service-worker registration fails.
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      window.removeEventListener("load", register);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
