"use client";

import { useCallback, useState } from "react";
import { AuthTurnstile } from "@/components/AuthTurnstile";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void };
  }
}

export default function NativeCaptcha() {
  const [message, setMessage] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const send = useCallback((message: { type: string; token?: string }) => {
    window.ReactNativeWebView?.postMessage(JSON.stringify(message));
  }, []);

  const onToken = useCallback((token: string | null) => {
    send(token ? { type: "verified", token } : { type: "expired" });
  }, [send]);

  if (!siteKey) {
    return <main role="status" className="bg-transparent text-xs">Verificación no configurada.</main>;
  }
  return (
    <main className="flex min-h-[68px] items-center justify-center bg-transparent px-2 text-xs text-[#69646a]">
      <AuthTurnstile
        siteKey={siteKey}
        dark={false}
        onToken={onToken}
        onUnavailable={() => { setMessage("No se pudo verificar. Revisá tu conexión."); send({ type: "error" }); }}
      />
      {message && <span role="alert" className="sr-only">{message}</span>}
    </main>
  );
}
